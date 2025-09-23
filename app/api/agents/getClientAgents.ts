'use server'

import { getUser } from "../user/getUser"

export async function getClientAgents(clientId?: string) {
    const { userData, supabaseServerClient } = await getUser()
    if (!clientId) {
        clientId = userData.client_id
    }
    const { data: agents, error } = await supabaseServerClient.from('agents').select('*').eq('client_id', clientId)
    if (error) {
        throw new Error('Failed to fetch client agents')
    }
    return agents
}