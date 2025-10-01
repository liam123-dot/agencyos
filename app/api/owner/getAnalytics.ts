
'use server'

import { getOrg } from "../user/selected-organization/getOrg"

interface CallWithAnalytics {
    id: string;
    agent_id: string | null;
    client_id: string;
    organization_id: string;
    seconds: number;
    data: any;
    created_at: string;
    updated_at: string;
    agents: {
        id: string;
        platform_id: string;
        platform: string;
        data: any;
    } | null;
    clients: {
        id: string;
        name: string;
        email: string;
    } | null;
    subscriptions: {
        id: string;
        per_second_price_cents: number;
        base_amount_cents: number;
        minutes_included: number;
    } | null;
    cost: number;
    revenue: number;
    margin: number;
}

export async function getAnalytics() {
    const { organization, userData, supabaseServerClient } = await getOrg()

    if (!organization) {
        throw new Error('Organization not found')
    }

    // Fetch all calls for the organization with client and subscription data
    const { data: callsData, error } = await supabaseServerClient
        .from('calls')
        .select(`
            *,
            agents(
                id,
                platform_id,
                platform,
                data
            ),
            clients(
                id,
                name
            )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Error fetching calls:', error);
        throw new Error('Failed to fetch calls');
    }

    // Fetch all subscriptions for clients in this organization
    const { data: subscriptions, error: subsError } = await supabaseServerClient
        .from('subscriptions')
        .select('*')
        .eq('organization_id', organization.id)
        .eq('status', 'active');

    if (subsError) {
        console.error('Error fetching subscriptions:', subsError);
        throw new Error('Failed to fetch subscriptions');
    }

    // Create a map of client_id to subscription
    const subscriptionMap = new Map(
        subscriptions?.map(sub => [sub.client_id, sub]) || []
    );

    // Calculate analytics for each call
    const callsWithAnalytics: CallWithAnalytics[] = (callsData || []).map(call => {
        const subscription = subscriptionMap.get(call.client_id);
        
        // Cost from Vapi (what we pay)
        const cost = call.data?.cost || 0;
        
        // Revenue calculation (what client pays us)
        let revenue = 0;
        if (subscription && subscription.per_second_price_cents) {
            // Convert per_second_price_cents to dollars and multiply by seconds
            revenue = (subscription.per_second_price_cents * call.seconds) / 100;
        }
        
        // Margin = Revenue - Cost
        const margin = revenue - cost;

        return {
            ...call,
            subscriptions: subscription || null,
            cost,
            revenue,
            margin
        };
    });

    // Calculate totals
    const totalCost = callsWithAnalytics.reduce((sum, call) => sum + call.cost, 0);
    const totalRevenue = callsWithAnalytics.reduce((sum, call) => sum + call.revenue, 0);
    const totalMargin = callsWithAnalytics.reduce((sum, call) => sum + call.margin, 0);
    const totalCalls = callsWithAnalytics.length;

    return {
        calls: callsWithAnalytics,
        totals: {
            totalCost,
            totalRevenue,
            totalMargin,
            totalCalls,
            averageMargin: totalCalls > 0 ? totalMargin / totalCalls : 0,
            marginPercentage: totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0
        }
    };
}

