'use server'

import { getUser } from "../user/getUser"

export async function getClientAgents(clientId?: string) {
    const { userData, supabaseServerClient } = await getUser()
    if (!clientId) {
        clientId = userData.client_id
    }
    // Join agents with phone_numbers (which has agent_id)
    // Also get the count of calls for each agent using a subquery
    const { data: agents, error } = await supabaseServerClient
        .from('agents')
        .select(`
            *,
            phone_numbers:phone_numbers (
                id,
                phone_number,
                agent_id,
                client_id,
                created_at,
                updated_at
            ),
            calls_count:calls(count)
        `)
        .eq('client_id', clientId)


    const agentsWithPhoneNumbers = agents?.map((agent: any) => ({
        ...agent,
        phone_numbers: agent.phone_numbers?.[0]?.phone_number || null,
        calls_count: agent.calls_count?.[0]?.count || 0,
    }))
    if (error) {
        throw new Error('Failed to fetch client agents')
    }
    return agentsWithPhoneNumbers
}