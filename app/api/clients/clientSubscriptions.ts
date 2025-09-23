import { createServerClient } from "@/lib/supabase/server";
import Stripe from "stripe";
import { Subscription } from "./subscriptionType";

export async function syncClientSubscriptions(clientId: string) {

    const supabase = await createServerClient();

    const { data: client, error } = await supabase.from('clients').select('*').eq('id', clientId).single()

    if (error) {
        throw new Error('Failed to fetch client')
    }

    if (!client.stripe_customer_id) {
        throw new Error('Client does not have a stripe customer id')
    }

    const { data: organization } = await supabase.from('organizations').select('*').eq('id', client.organization_id).single()

    if (error) {
        throw new Error('Failed to fetch organization')
    }
    
    
    const stripe = new Stripe(organization.stripe_api_key)
    
    const { data: subscriptions } = await stripe.subscriptions.list({
        customer: client.stripe_customer_id,
    })

    if (subscriptions.length === 0) {
        throw new Error('Client does not have any subscriptions')
    }

    // For now, we'll handle the first (and likely only) subscription
    const subscription = subscriptions[0] as Stripe.Subscription;
    
    // Parse subscription items to separate base and usage pricing
    let baseItem: Stripe.SubscriptionItem | undefined;
    let usageItem: Stripe.SubscriptionItem | undefined;

    subscription.items.data.forEach((item: Stripe.SubscriptionItem) => {
        const metadata = item.price.metadata || {};
        const itemType = metadata.type;
        
        if (itemType === 'base_price') {
            baseItem = item;
        } else if (itemType === 'usage_price') {
            usageItem = item;
        }
    });

    // Prepare subscription data for database
    const subscriptionRecord = {
        client_id: clientId,
        organization_id: client.organization_id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: client.stripe_customer_id,
        currency: subscription.currency,
        status: subscription.status,
        
        // Base pricing info (if exists)
        base_price_id: baseItem?.price.id || null,
        base_amount_cents: baseItem?.price.unit_amount || 0,
        minutes_included: baseItem?.price.metadata?.minutes_included ? 
            parseInt(baseItem.price.metadata.minutes_included) : 0,
        
        // Usage pricing info (if exists)
        usage_price_id: usageItem?.price.id || null,
        per_second_price_cents: usageItem?.price.unit_amount_decimal ? 
            parseFloat(usageItem.price.unit_amount_decimal) : 0,
        billing_meter_id: usageItem?.price.recurring?.meter || null,
        billing_meter_event_name: usageItem?.price.metadata?.billing_meter_event_name || null,
        
        // Subscription periods
        current_period_start: subscription.items.data[0]?.current_period_start 
            ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
            : null,
        current_period_end: subscription.items.data[0]?.current_period_end
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        
        // Payment method (if available)
        payment_method_brand: (subscription.default_payment_method as Stripe.PaymentMethod)?.card?.brand || null,
        payment_method_last4: (subscription.default_payment_method as Stripe.PaymentMethod)?.card?.last4 || null,
        
        synced_at: new Date().toISOString()
    };

        // Check if subscription already exists for this client
        const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('client_id', clientId)
        .single();

    let upsertedSub, upsertError;

    if (existingSub) {
        // Update existing subscription
        const { data, error } = await supabase
            .from('subscriptions')
            .update(subscriptionRecord)
            .eq('client_id', clientId)
            .select()
            .single();
        upsertedSub = data;
        upsertError = error;
    } else {
        // Insert new subscription
        const { data, error } = await supabase
            .from('subscriptions')
            .insert(subscriptionRecord)
            .select()
            .single();
        upsertedSub = data;
        upsertError = error;
    }

    if (upsertError) {
        console.error('Error upserting subscription:', upsertError);
        throw new Error(`Failed to sync subscription: ${upsertError.message}`);
    }

    console.log(`Successfully synced subscription for client ${clientId}:`, {
        subscriptionId: subscription.id,
        status: subscription.status,
        basePrice: baseItem?.price.unit_amount || 0,
        usagePrice: usageItem?.price.unit_amount_decimal || '0'
    });

    // Only create credit grants if we have minutes included and a valid billing period
    if (subscriptionRecord.minutes_included > 0 && subscriptionRecord.current_period_start) {
        const amount = Math.ceil(subscriptionRecord.minutes_included * 60 * subscriptionRecord.per_second_price_cents);

        console.log('subscriptionRecord', subscriptionRecord);
        console.log('amount', amount);

        // Create unique idempotency key using subscription ID and billing period start
        // This ensures credits are only granted once per billing period for each subscription
        const periodStartTimestamp = new Date(subscriptionRecord.current_period_start).getTime();
        const idempotencyKey = `credit-grant-${subscription.id}-${periodStartTimestamp}-${subscriptionRecord.currency}`;

        console.log('Creating credit grant with idempotency key:', idempotencyKey);

        try {
            const creditGrant = await stripe.billing.creditGrants.create({
                customer: client.stripe_customer_id,
                amount: {
                    type: 'monetary',
                    monetary: {
                        value: amount,
                        currency: subscriptionRecord.currency,
                    }
                },
                applicability_config: {
                    scope: {
                      price_type: 'metered',
                    },
                  },
                category: 'paid',
                expires_at: subscriptionRecord.current_period_end ? 
                    Math.floor(new Date(subscriptionRecord.current_period_end).getTime() / 1000) : 
                    undefined,
                metadata: {
                    client_id: clientId,
                    subscription_id: subscription.id,
                    billing_period_start: subscriptionRecord.current_period_start,
                    billing_period_end: subscriptionRecord.current_period_end,
                },
            }, {
                idempotencyKey: idempotencyKey,
            });

            console.log(`Successfully created credit grant for client ${clientId}, subscription ${subscription.id}, period starting ${subscriptionRecord.current_period_start}`);
            console.log('creditGrant', creditGrant);
        } catch (error: any) {
            // If the error is due to idempotency (credit already granted for this period), log it but don't throw
            if (error.code === 'idempotency_key_already_used') {
                console.log(`Credit grant already exists for client ${clientId}, subscription ${subscription.id}, period starting ${subscriptionRecord.current_period_start}`);
            } else {
                console.error('Error creating credit grant:', error);
                throw error;
            }
        }
    } else {
        console.log('Skipping credit grant creation - no minutes included or invalid billing period');
    }

}


export async function getClientSubscriptions(clientId: string): Promise<Subscription | null> {
    const supabase = await createServerClient();
    const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single();
    
    if (error) {
        // If no subscription found, return null instead of throwing error
        if (error.code === 'PGRST116') {
            return null;
        }
        throw new Error('Failed to fetch subscriptions');
    }
    
    return subscription as Subscription;
}
