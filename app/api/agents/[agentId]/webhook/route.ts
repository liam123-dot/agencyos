import { createServerClient } from "@/lib/supabase/server"
import { Vapi } from "@vapi-ai/server-sdk"
import Stripe from "stripe"

export async function POST(request: Request, { params }: { params: Promise<{ agentId: string }> }) {


    const { agentId } = await params
    const data = await request.json()
    console.log(data)


    const supabaseServerClient = await createServerClient()

    const { data: agent, error: agentError } = await supabaseServerClient.from('agents').select('*').eq('id', agentId).single()

    if (agentError) {
        throw new Error('Failed to fetch agent')
    }
    
    if (agent.platform === 'vapi') {
        await handleVapiWebhook(agentId, agent.client_id, agent.organization_id, data)
    }

    return new Response('OK')
}


async function handleVapiWebhook(agentId: string, clientId: string, organizationId: string, data: any) {
    const supabaseServerClient = await createServerClient()

    const message = data.message;

    if (message.type === 'end-of-call-report') {

        const report = message as Vapi.ServerMessageEndOfCallReport;

        const durationSeconds = Math.round((report as any).durationSeconds || 0);

        const { error: insertError } = await supabaseServerClient
            .from('calls')
            .insert({
                agent_id: agentId,
                client_id: clientId,
                organization_id: organizationId,
                seconds: durationSeconds,
                data: report
            });

        await logSeconds(organizationId, clientId, durationSeconds, report.call?.id || '')
    }

}

async function logSeconds(orgId: string, clientId: string, seconds: number, callId: string) {
    const supabaseServerClient = await createServerClient()

    const { data: organization, error: organizationError } = await supabaseServerClient
        .from('organizations')
        .select('stripe_api_key')
        .eq('id', orgId)
        .single();
    
    if (organizationError) {
        throw new Error('Failed to fetch organization')
    }

    // Get client's Stripe customer ID
    const { data: client, error: clientError } = await supabaseServerClient
        .from('clients')
        .select('stripe_customer_id')
        .eq('id', clientId)
        .single();

    if (clientError) {
        throw new Error('Failed to fetch client')
    }

    // Get client's active subscription with billing meter info
    const { data: subscription, error: subscriptionError } = await supabaseServerClient
        .from('subscriptions')
        .select('billing_meter_id, billing_meter_event_name')
        .eq('client_id', clientId)
        .eq('status', 'active')
        .single();

    if (subscriptionError) {
        throw new Error('Failed to fetch subscription')
    }

        let billing_meter_event_name = subscription?.billing_meter_event_name;

    if (!billing_meter_event_name) {
        // fetch the product from the database
        const { data: products, error: productError } = await supabaseServerClient
            .from('products')
            .select('billing_meter_event_name')
            .eq('stripe_billing_meter_id', subscription?.billing_meter_id)
            .limit(1);

        const product = Array.isArray(products) && products.length > 0 ? products[0] : null;

        if (productError || !product?.billing_meter_event_name) {
            throw new Error('Product not found or billing meter event name not found');
        }
        billing_meter_event_name = product?.billing_meter_event_name;
    }

    console.log('billing_meter_event_name', billing_meter_event_name);

    const stripe = new Stripe(organization.stripe_api_key);
    
    try {
        // Create billing meter event with call ID as idempotency key
        const meterEvent = await stripe.billing.meterEvents.create({
            event_name: billing_meter_event_name,
            payload: {
                customer_id: client.stripe_customer_id,
                seconds_used: seconds.toString() // Stripe expects string value for meter events
            },
            identifier: callId
        });

        console.log(`Successfully logged ${seconds} seconds for client ${clientId}, call ${callId}:`, {
            meterEventName: billing_meter_event_name,
            customerId: client.stripe_customer_id,
            seconds
        });
        console.log('meterEvent', meterEvent);

        return {
            success: true,
            seconds,
            callId
        };

    } catch (error: any) {
        console.error('Error creating Stripe billing meter event:', error);
        throw new Error(`Failed to log usage: ${error.message}`);
    }

}
