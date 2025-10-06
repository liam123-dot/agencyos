
'use server'

import Stripe from "stripe"
import { getUser } from "../user/getUser"
import { authorizedToAccessClient } from "./clientMembers"
import { redirect } from "next/navigation"

export async function selectProduct(productId: string) {
    
    const { userData } = await getUser()
    const clientId = userData.client_id

    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        throw new Error('Unauthorized')
    }
    const { supabaseServerClient, client } = authorized

    const {data: product, error: productError} = await supabaseServerClient.from('products').select('*').eq('id', productId).single()

    const {data: organization, error: organizationError} = await supabaseServerClient.from('organizations').select('*').eq('id', product.organization_id).single()

    if (productError) {
        throw new Error('Failed to fetch product')
    }

    if (organizationError) {
        throw new Error('Failed to fetch organization')
    }

    if (!organization) {
        throw new Error('Organization not found')
    }

    const stripe = new Stripe(organization.stripe_api_key)

    if (!client.stripe_customer_id) {
        const stripeCustomer = await stripe.customers.create({
            email: userData.email,
        })
        client.stripe_customer_id = stripeCustomer.id
        await supabaseServerClient.from('clients').update({ stripe_customer_id: stripeCustomer.id }).eq('id', client.id)
    }

    // create checkout session
    const checkoutSessionParams: Stripe.Checkout.SessionCreateParams = {
        customer: client.stripe_customer_id,
        line_items: [{
            price: product.stripe_base_price_id,
            quantity: 1,
        }, {
            price: product.stripe_usage_price_id
        }],
        mode: 'subscription',
        success_url: `https://${organization.domain}/app/billing/success`,
        cancel_url: `https://${organization.domain}/app/billing`,
        metadata: {
            client_id: client.id,
            product_id: product.id,
            organization_id: organization.id,
        },
    }

    // Add trial period if product has trial_days configured
    if (product.trial_days && product.trial_days > 0) {
        checkoutSessionParams.subscription_data = {
            trial_period_days: product.trial_days,
        }
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutSessionParams)

    // redirect to checkout session
    redirect(checkoutSession.url!)

}

export async function switchProduct(newProductId: string) {
    
    const { userData } = await getUser()
    const clientId = userData.client_id

    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        throw new Error('Unauthorized')
    }
    const { supabaseServerClient, client } = authorized

    // Get the new product
    const {data: newProduct, error: productError} = await supabaseServerClient.from('products').select('*').eq('id', newProductId).single()
    if (productError) {
        throw new Error('Failed to fetch new product')
    }

    // Get the organization
    const {data: organization, error: organizationError} = await supabaseServerClient.from('organizations').select('*').eq('id', newProduct.organization_id).single()
    if (organizationError) {
        throw new Error('Failed to fetch organization')
    }

    if (!organization) {
        throw new Error('Organization not found')
    }

    const stripe = new Stripe(organization.stripe_api_key)

    if (!client.stripe_customer_id) {
        throw new Error('Client does not have a Stripe customer ID')
    }

    // Get current subscription
    const {data: currentSubscription, error: subscriptionError} = await supabaseServerClient
        .from('subscriptions')
        .select('*')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single()

    if (subscriptionError || !currentSubscription) {
        throw new Error('No active subscription found')
    }

    // Directly update the subscription with proration
    try {
        // First, expire existing credit grants for the current subscription
        await expireExistingCreditGrants(stripe, client.stripe_customer_id, currentSubscription.stripe_subscription_id)
        
        // Get the current subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(currentSubscription.stripe_subscription_id)
        
        // Update the subscription items
        const updatedSubscription = await stripe.subscriptions.update(currentSubscription.stripe_subscription_id, {
            items: [
                {
                    id: stripeSubscription.items.data[0].id, // Base price item
                    price: newProduct.stripe_base_price_id,
                },
                {
                    id: stripeSubscription.items.data[1]?.id, // Usage price item (if exists)
                    price: newProduct.stripe_usage_price_id,
                }
            ].filter(item => item.id), // Filter out any undefined items
            proration_behavior: 'create_prorations',
            metadata: {
                client_id: client.id,
                product_id: newProduct.id,
                organization_id: organization.id,
                switched_from: currentSubscription.base_price_id,
            }
        })

        // Redirect to success page
        redirect(`https://${organization.domain}/app/billing/success?switched=true`)
        
    } catch (error) {
        console.error('Error switching subscription:', error)
        throw new Error('Failed to switch subscription')
    }
}

// Helper function to expire existing credit grants for a subscription
async function expireExistingCreditGrants(stripe: Stripe, customerId: string, subscriptionId: string) {
    try {
        // List all active credit grants for the customer
        const creditGrants = await stripe.billing.creditGrants.list({
            customer: customerId,
            limit: 100, // Adjust if needed
        })

        // Filter grants that belong to the current subscription and are still active
        const grantsToExpire = creditGrants.data.filter(grant => 
            grant.metadata?.subscription_id === subscriptionId && 
            grant.amount && 
            grant.amount.monetary &&
            grant.amount.monetary.value &&
            grant.amount.monetary.value > 0 &&
            (!grant.expires_at || grant.expires_at > Math.floor(Date.now() / 1000))
        )

        // Expire each relevant credit grant
        for (const grant of grantsToExpire) {
            await stripe.billing.creditGrants.expire(grant.id)
            console.log(`Expired credit grant ${grant.id} for subscription ${subscriptionId}`)
        }

        console.log(`Expired ${grantsToExpire.length} credit grants for subscription ${subscriptionId}`)
        
    } catch (error) {
        console.error('Error expiring credit grants:', error)
        // Don't throw here - we don't want to fail the entire switch if credit grant expiration fails
    }
}


