'use server'

import { getUser } from "@/app/api/user/getUser";

interface GetCallsParams {
    page?: number;
    limit?: number;
    clientId?: string;
}

export async function getCalls({ page = 1, limit = 10, clientId }: GetCallsParams) {
    // Validate and clamp limit to allowed values
    const allowedLimits = [10, 25, 50];
    const validatedLimit = allowedLimits.includes(limit) ? limit : 10;
    const { userData, supabaseServerClient } = await getUser();

    console.log('userData', userData)
    console.log('clientId', clientId)
    const client_id = userData.client_id || clientId;
    console.log('client_id finito', client_id)

    if (!client_id) {
        throw new Error('Client ID is required')
    }

    const offset = (page - 1) * validatedLimit;

    // Fetch calls with agent information using left join to include calls without agents
    const { data: callsData, error } = await supabaseServerClient
        .from('calls')
        .select(`
            *,
            agents(
                id,
                platform_id,
                platform,
                data
            )
        `)
        .eq('client_id', client_id)
        .order('created_at', { ascending: false })
        .range(offset, offset + validatedLimit - 1);

    if (error) {
        console.error('Error fetching calls:', error);
        throw new Error('Failed to fetch calls');
    }

    // Get total count for pagination
    const { count, error: countError } = await supabaseServerClient
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client_id);

    if (countError) {
        console.error('Error fetching calls count:', countError);
        throw new Error('Failed to fetch calls count');
    }

    return {
        calls: callsData || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / validatedLimit),
        limit: validatedLimit
    };
}
