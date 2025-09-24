'use server'

import { createServerClient } from "@/lib/supabase/server"

export async function getAgent(agentId: string) {
    const supabase = await createServerClient()
    
    // Get agent with call statistics and phone number count
    const { data: agent, error } = await supabase
        .from('agents')
        .select(`
            *,
            calls_count:calls(count),
            assigned_numbers_count:phone_numbers(count)
        `)
        .eq('id', agentId)
        .single()
    
    if (error) {
        throw new Error('Failed to fetch agent')
    }

    // Get average call duration
    const { data: avgDuration } = await supabase
        .from('calls')
        .select('seconds')
        .eq('agent_id', agentId)
        .not('seconds', 'is', null)

    const totalSeconds = avgDuration?.reduce((sum, call) => sum + (call.seconds || 0), 0) || 0
    const callCount = avgDuration?.length || 0
    const averageDuration = callCount > 0 ? Math.round(totalSeconds / callCount) : 0

    // Format the response with computed values
    return {
        ...agent,
        calls_total: agent.calls_count?.[0]?.count || 0,
        assigned_numbers_count: agent.assigned_numbers_count?.[0]?.count || 0,
        average_duration_seconds: averageDuration
    }
}
