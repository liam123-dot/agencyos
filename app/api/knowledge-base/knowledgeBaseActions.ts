'use server'

import { revalidatePath } from "next/cache";
import { clientDashboardAuth } from "../clients/clientDashboardAuth"

export async function createKnowledgeBase(name: string, clientId?: string) {

    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)

    // check for knowledge base with same name for this client
    const { data: knowledgeBase, error: knowledgeBaseError } = await supabaseServerClient.from('knowledge_base').select('*').eq('name', name).eq('client_id', client.id)
    if (knowledgeBaseError) {
        console.error('Error fetching knowledge base', knowledgeBaseError)
        throw new Error('Failed to fetch knowledge base')
    }
    if (knowledgeBase && knowledgeBase.length > 0) {
        console.error('Knowledge base with same name already exists')
        throw new Error('Knowledge base with same name already exists')
    }

    const {data: organization, error: organizationError} = await supabaseServerClient.from('organizations').select('*').eq('id', client.organization_id).single()
    if (organizationError) {
        console.error('Error fetching organization', organizationError)
        throw new Error('Failed to fetch organization')
    }
    
    const { error } = await supabaseServerClient.from('knowledge_base').insert({
        name: name,
        client_id: client.id,
        organization_id: client.organization_id
    });

    // fetch created knowledge base from database to find id

    const { data: createdKnowledgeBase, error: createdKnowledgeBaseError } = await supabaseServerClient.from('knowledge_base').select('*').eq('name', name).eq('client_id', client.id).single()
    if (createdKnowledgeBaseError) {
        console.error('Error fetching created knowledge base', createdKnowledgeBaseError)
        throw new Error('Failed to fetch created knowledge base')
    }

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/knowledge-base/${createdKnowledgeBase.id}/query`

    const vapiKnowledgeBase = await createCustomVapiKnowledgeBase(organization.vapi_api_key, webhookUrl)

    await supabaseServerClient.from('knowledge_base').update({ vapi_knowledge_base_id: vapiKnowledgeBase.id }).eq('id', createdKnowledgeBase.id)
    
    revalidatePath(`/s/${client.organization_id}/app/knowledge-base`)

    return { success: true }
}

async function createCustomVapiKnowledgeBase(vapi_api_key: string, server_url: string) {

    const response = await fetch('https://api.vapi.ai/knowledge-base', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${vapi_api_key}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            provider: 'custom-knowledge-base',
            server: {
                url: server_url
            }
        })
    })
    console.log('Response', response)

    const data = await response.json()
    console.log('Data', data)
    return data

}

export async function getKnowledgeBases(clientId?: string) {

    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)
    
    const { data, error } = await supabaseServerClient
        .from('knowledge_base')
        .select('*')
        .eq('client_id', client.id)
        .eq('organization_id', client.organization_id)
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error fetching knowledge bases', error)
        throw new Error('Failed to fetch knowledge bases')
    }

    return data || []

}

export async function getKnowledgeBaseById(id: string, clientId?: string) {

    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)
    
    const { data, error } = await supabaseServerClient
        .from('knowledge_base')
        .select('*')
        .eq('id', id)
        .eq('client_id', client.id)
        .eq('organization_id', client.organization_id)
        .single();
    
    if (error) {
        console.error('Error fetching knowledge base', error)
        throw new Error('Failed to fetch knowledge base')
    }

    return data

}
