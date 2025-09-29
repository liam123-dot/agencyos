'use server'

import { VapiClient, Vapi } from "@vapi-ai/server-sdk"
import { createServerClient } from "@/lib/supabase/server"

export async function getVapiAgent(agentId: string) {
    const supabase = await createServerClient()
    
    // First get the agent from our database to get the platform_id and organization
    const { data: agent, error } = await supabase
        .from('agents')
        .select('platform_id, organization_id')
        .eq('id', agentId)
        .single()
    
    if (error) {
        throw new Error('Failed to fetch agent')
    }

    // Get the organization to access the Vapi API key
    const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('vapi_api_key')
        .eq('id', agent.organization_id)
        .single()

    if (orgError || !organization?.vapi_api_key) {
        throw new Error('Failed to get organization or Vapi API key')
    }

    // Fetch the agent data from Vapi
    const vapiClient = new VapiClient({ token: organization.vapi_api_key })
    const vapiAgent = await vapiClient.assistants.get(agent.platform_id) as Vapi.Assistant

    return vapiAgent
}
