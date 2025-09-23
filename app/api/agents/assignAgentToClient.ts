'use server'

import { VapiClient, Vapi } from "@vapi-ai/server-sdk"
import { authorizedToAccessClient } from "../clients/clientMembers"
import { getOrg } from "../user/selected-organization/getOrg"
import { revalidatePath } from "next/cache"

export async function assignVapiAgentToClient(clientId: string, vapiAgentId: string) {
    const { organization, supabaseServerClient } = await getOrg()
    if (!organization) {
        throw new Error('Organization not found')
    }
    
    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        throw new Error('Unauthorized')
    }

    const vapiClient = new VapiClient({token: organization.vapi_api_key})
    const vapiAgent = await vapiClient.assistants.get(vapiAgentId) as Vapi.Assistant
    
    // Check if agent already exists in the database
    const { data: existingAgent, error: checkError } = await supabaseServerClient
        .from('agents')
        .select('*')
        .eq('platform_id', vapiAgentId)
        .eq('platform', 'vapi')
        .eq('client_id', clientId)
        .single()
    
    // If no error and agent exists, throw error
    if (!checkError && existingAgent) {
        throw new Error('Agent already assigned to this client')
    }
    
    // Insert the new agent
    const { error: insertError } = await supabaseServerClient.from('agents').insert({
        platform_id: vapiAgentId,
        platform: 'vapi',
        client_id: clientId,
        organization_id: organization.id,
        data: vapiAgent
    })
    
    if (insertError) {
        throw new Error('Failed to assign agent to client')
    }

    const { data: newAgent } = await supabaseServerClient.from('agents').select('*').eq('platform_id', vapiAgentId).eq('platform', 'vapi').single();

    await assignWebhookToVapiAgent(organization.vapi_api_key, newAgent.id, newAgent.platform_id)

    revalidatePath(`/app/clients/${clientId}/agents`)
    
    // Return a plain object instead of the database result
    return { success: true }
}

async function assignWebhookToVapiAgent(vapiKey: string, agentId: string, vapiAgentId: string) {

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/agents/${agentId}/webhook`

    const vapi = new VapiClient({token: vapiKey})

    const updatedAgent = await vapi.assistants.update(vapiAgentId, {
        server: {
          url: webhookUrl
        }
      });

}