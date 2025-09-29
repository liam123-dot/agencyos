'use server'

import { clientDashboardAuth } from "../clients/clientDashboardAuth"
import { Ragie } from "ragie"

const ragie = new Ragie({auth: process.env.RAGIE_API_KEY})

export async function deleteKnowledge(knowledgeId: string, clientId?: string) {
    const { supabaseServerClient } = await clientDashboardAuth(clientId)

    const { data: knowledge, error: knowledgeError } = await supabaseServerClient.from('knowledge').select('*').eq('id', knowledgeId).single()
    if (knowledgeError) {
        console.error('Error fetching knowledge', knowledgeError)
        throw new Error('Failed to fetch knowledge')
    }

    if (knowledge.external_id) {
        await ragie.documents.delete({documentId: knowledge.external_id})
    }
    
    await supabaseServerClient.from('knowledge').delete().eq('id', knowledgeId)

    return { success: true }
}
