'use server'

import { VapiClient } from "@vapi-ai/server-sdk"
import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface UpdateAgentConfigData {
    name?: string
    firstMessage?: string
    firstMessageInterruptionsEnabled?: boolean
    voicemailMessage?: string
    endCallMessage?: string
    systemMessage?: string
    model?: {
        knowledgeBaseId?: string
    }
}

export async function updateVapiAgent(agentId: string, updateData: UpdateAgentConfigData) {
    const supabase = await createServerClient()
    
    // First get the agent from our database to get the platform_id and organization
    const { data: agent, error } = await supabase
        .from('agents')
        .select('platform_id, organization_id, client_id')
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

    // Prepare the update payload for Vapi
    const vapiClient = new VapiClient({ token: organization.vapi_api_key })
    
    // First get the current agent to preserve existing data
    const currentAgent = await vapiClient.assistants.get(agent.platform_id)
    
    // Build the update payload
    const updatePayload: any = {
        name: updateData.name,
        firstMessage: updateData.firstMessage,
        firstMessageInterruptionsEnabled: updateData.firstMessageInterruptionsEnabled,
        voicemailMessage: updateData.voicemailMessage,
        endCallMessage: updateData.endCallMessage,
        model: {
            ...currentAgent.model,
            knowledgeBaseId: updateData.model?.knowledgeBaseId
        }
    }

    // Handle system message update in the model.messages array
    if (updateData.systemMessage !== undefined) {
        const messages = currentAgent.model?.messages || []
        const systemMessageIndex = messages.findIndex((msg: any) => msg.role === 'system')
        
        if (systemMessageIndex >= 0) {
            // Update existing system message
            messages[systemMessageIndex] = {
                role: 'system',
                content: updateData.systemMessage
            }
        } else {
            // Add new system message at the beginning
            messages.unshift({
                role: 'system',
                content: updateData.systemMessage
            })
        }
        
        updatePayload.model = {
            ...currentAgent.model,
            messages
        }
    }

    // Remove undefined values
    Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key] === undefined) {
            delete updatePayload[key]
        }
    })

    // Update the agent in Vapi
    const updatedAgent = await vapiClient.assistants.update(agent.platform_id, updatePayload)

    // Update our local database with the new data
    const { error: updateError } = await supabase
        .from('agents')
        .update({ 
            data: updatedAgent,
            updated_at: new Date().toISOString()
        })
        .eq('id', agentId)

    if (updateError) {
        throw new Error('Failed to update local agent data')
    }

    // Revalidate the cache
    revalidatePath(`/s/${agent.organization_id}/app/agents/${agentId}`)
    revalidatePath(`/s/${agent.organization_id}/app/agents/${agentId}/configuration`)

    return { success: true }
}
