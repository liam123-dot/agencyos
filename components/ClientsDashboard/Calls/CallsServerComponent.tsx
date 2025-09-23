'use server'

import { getUser } from "@/app/api/user/getUser";

interface GetCallsParams {
    page?: number;
    limit?: number;
    clientId?: string;
    search?: string;
    status?: string;
    agent?: string;
}

export async function getCalls({ page = 1, limit = 10, clientId, search, status, agent }: GetCallsParams) {
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
            )
        `)
        .eq('client_id', client_id);

    // Apply search filter
    if (search && search.trim()) {
        // Search in call data (JSON field) for phone numbers or transcripts
        query = query.or(`data->>customer->number.ilike.%${search}%,data->>transcript.ilike.%${search}%`);
    }

    // Apply status filter
    if (status) {
        query = query.eq('data->>status', status);
    }

    // Apply agent filter
    if (agent) {
        query = query.eq('agent_id', agent);
    }

    // Apply ordering and pagination
    const { data: callsData, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + validatedLimit - 1);

    if (error) {
        console.error('Error fetching calls:', error);
        throw new Error('Failed to fetch calls');
    }

    // Get total count for pagination with same filters
    let countQuery = supabaseServerClient
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', client_id);

    // Apply same filters for count
    if (search && search.trim()) {
        countQuery = countQuery.or(`data->>customer->number.ilike.%${search}%,data->>transcript.ilike.%${search}%`);
    }

    if (status) {
        countQuery = countQuery.eq('data->>status', status);
    }

    if (agent) {
        countQuery = countQuery.eq('agent_id', agent);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
        console.error('Error fetching calls count:', countError);
        throw new Error('Failed to fetch calls count');
    }

    console.log('callsData', JSON.stringify(callsData, null, 2))

    return {
        calls: callsData || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages: Math.ceil((count || 0) / validatedLimit),
        limit: validatedLimit
    };
}
