'use server'

import { createServerClient } from "@/lib/supabase/server"

export async function getAgent(agentId: string) {
    const supabase = await createServerClient()
    
    const { data: agent, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()
    
    if (error) {
        throw new Error('Failed to fetch agent')
    }
    
    return agent
}
