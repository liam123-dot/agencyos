'use server'

import { VapiClient } from "@vapi-ai/server-sdk"
import { getOrg } from "../user/selected-organization/getOrg"

export async function getVapiAgentsExcludingExisting(clientId: string) {
    const { organization, supabaseServerClient } = await getOrg()
    if (!organization) {
        throw new Error('Organization not found')
    }
    const vapiClient = new VapiClient({token: organization.vapi_api_key})
    const agents = await vapiClient.assistants.list()
    
    const { data: existingAgents, error: existingAgentsError } = await supabaseServerClient.from('agents').select('*').eq('platform', 'vapi')
    if (existingAgentsError) {
        throw new Error('Failed to fetch existing agents')
    }

    // do not include any agents from vapi that have an id that exists as a platform_id
    const agentsToExclude = existingAgents?.map((agent: any) => agent.platform_id)
    const filteredAgents = agents.filter((agent: any) => !agentsToExclude.includes(agent.id))
    
    // Filter the agent data to only include what's needed on the client side
    const safeAgents = filteredAgents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        firstMessage: agent.firstMessage,
        voice: agent.voice ? {
            voiceId: agent.voice.voiceId,
            provider: agent.voice.provider
        } : undefined,
        model: agent.model ? {
            model: agent.model.model,
            provider: agent.model.provider
        } : undefined,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
    }))
    
    return safeAgents
}
