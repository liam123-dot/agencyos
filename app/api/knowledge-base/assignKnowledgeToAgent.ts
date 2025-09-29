
'use server'

import { revalidatePath } from "next/cache"
import { updateVapiAgent } from "../agents/updateVapiAgent"
import { clientDashboardAuth } from "../clients/clientDashboardAuth"

export async function assignKnowledgeBaseToAgent(knowledgeBaseId: string, agentId: string, clientId?: string) {
    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)

    const { data: knowledgeBase, error: knowledgeBaseError } = await supabaseServerClient
        .from('knowledge_base')
        .select('*')
        .eq('id', knowledgeBaseId)
        .single()

    if (knowledgeBaseError) {
        throw new Error('Knowledge base not found')
    }

    const { data: agent, error: agentError } = await supabaseServerClient
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()

    if (agentError) {
        throw new Error('Agent not found')
    }

    await supabaseServerClient.from('knowledge_base').update({ agent_id: agentId }).eq('id', knowledgeBaseId)

    await updateVapiAgent(agentId, { model: { knowledgeBaseId: knowledgeBase.vapi_knowledge_base_id } })

    return { success: true }
}


export async function removeKnowledgeBaseFromAgent(knowledgeBaseId: string, agentId: string, clientId?: string) {
    const { supabaseServerClient } = await clientDashboardAuth(clientId)

    
    const { data: agent, error: agentError } = await supabaseServerClient
    .from('agents')
    .select('*')
    .eq('id', agentId)
    .single()
    
    if (agentError) {
        console.error('Agent not found')
        throw new Error('Agent not found')
    }
    await supabaseServerClient.from('knowledge_base').update({ agent_id: null }).eq('id', knowledgeBaseId)

    // @ts-expect-error vapi types are not up to date
    await updateVapiAgent(agent.id, { model: { knowledgeBaseId: null } })

    revalidatePath(`/app/agents/${agentId}/knowledge-base`)

    return { success: true }
}
