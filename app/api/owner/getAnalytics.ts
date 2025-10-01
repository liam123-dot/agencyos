
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
        currency: string;
    } | null;
    cost: number;
    revenue: number;
    margin: number;
    costInLocalCurrency: number;
    currency: string;
}

// Approximate currency conversion rates (USD to target currency)
const CURRENCY_RATES: Record<string, number> = {
    'usd': 1.0,
    'eur': 0.92,
    'gbp': 0.79,
    'cad': 1.35,
    'aud': 1.52,
    'jpy': 149.0,
    'chf': 0.88,
    'nzd': 1.64,
    'sek': 10.5,
    'nok': 10.8,
    'dkk': 6.85,
    'pln': 3.95,
    'inr': 83.0,
    'brl': 4.95,
    'mxn': 17.0,
    'zar': 18.5,
    'sgd': 1.34,
    'hkd': 7.82,
};

function convertUsdToCurrency(usdAmount: number, targetCurrency: string): number {
    const currency = targetCurrency?.toLowerCase() || 'usd';
    const rate = CURRENCY_RATES[currency] || 1.0;
    return usdAmount * rate;
}

interface GetAnalyticsParams {
    clientId?: string;
    agentId?: string;
    startDate?: string;
    endDate?: string;
}

export async function getAnalytics(params?: GetAnalyticsParams) {
    const { organization, userData, supabaseServerClient } = await getOrg()

    if (!organization) {
        throw new Error('Organization not found')
    }

    // Build the query with filters
    let query = supabaseServerClient
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
        .eq('organization_id', organization.id);

    // Apply filters
    if (params?.clientId) {
        query = query.eq('client_id', params.clientId);
    }

    if (params?.agentId) {
        query = query.eq('agent_id', params.agentId);
    }

    if (params?.startDate) {
        query = query.gte('created_at', params.startDate);
    }

    if (params?.endDate) {
        query = query.lte('created_at', params.endDate);
    }

    // Apply ordering and limit
    const { data: callsData, error } = await query
        .order('created_at', { ascending: false })
        .limit(1000);

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
        
        // Cost from Vapi (always in USD)
        const costUsd = call.data?.cost || 0;
        
        // Get currency from subscription (default to USD)
        const currency = subscription?.currency?.toLowerCase() || 'usd';
        
        // Convert cost to local currency
        const costInLocalCurrency = convertUsdToCurrency(costUsd, currency);
        
        // Revenue calculation (what client pays us in their currency)
        let revenue = 0;
        if (subscription && subscription.per_second_price_cents) {
            // per_second_price_cents is already in the subscription's currency
            revenue = (subscription.per_second_price_cents * call.seconds) / 100;
        }
        
        // Margin = Revenue - Cost (both in local currency)
        const margin = revenue - costInLocalCurrency;

        return {
            ...call,
            subscriptions: subscription || null,
            cost: costUsd,
            revenue,
            margin,
            costInLocalCurrency,
            currency
        };
    });

    // Calculate totals (in USD for aggregation, since we may have mixed currencies)
    const totalCostUsd = callsWithAnalytics.reduce((sum, call) => sum + call.cost, 0);
    const totalRevenueUsd = callsWithAnalytics.reduce((sum, call) => {
        // Convert revenue back to USD for totals
        const revenueUsd = call.revenue / (CURRENCY_RATES[call.currency] || 1.0);
        return sum + revenueUsd;
    }, 0);
    const totalMarginUsd = totalRevenueUsd - totalCostUsd;
    const totalCalls = callsWithAnalytics.length;

    // Fetch all unique clients and agents for filters
    const { data: allClients } = await supabaseServerClient
        .from('clients')
        .select('id, name')
        .eq('organization_id', organization.id)
        .order('name');

    const { data: allAgents } = await supabaseServerClient
        .from('agents')
        .select('id, platform_id, platform, data, client_id')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

    return {
        calls: callsWithAnalytics,
        totals: {
            totalCost: totalCostUsd,
            totalRevenue: totalRevenueUsd,
            totalMargin: totalMarginUsd,
            totalCalls,
            averageMargin: totalCalls > 0 ? totalMarginUsd / totalCalls : 0,
            marginPercentage: totalRevenueUsd > 0 ? (totalMarginUsd / totalRevenueUsd) * 100 : 0
        },
        filters: {
            clients: allClients || [],
            agents: allAgents || []
        }
    };
}

