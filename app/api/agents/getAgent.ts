'use server'

import { createServerClient } from "@/lib/supabase/server"

interface PhoneNumber {
    id: string;
    phone_number: string;
    agent_id?: string;
}

export async function getAgent(agentId: string) {
    const supabase = await createServerClient()
    
    // Get agent with call statistics and phone number details
    const { data: agent, error } = await supabase
        .from('agents')
        .select(`
            *,
            calls_count:calls(count),
            phone_numbers:phone_numbers(
                id,
                phone_number,
                agent_id
            )
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

    // Get the assigned phone number (if any)
    const assignedPhoneNumber = (agent.phone_numbers as PhoneNumber[])?.find((pn: PhoneNumber) => pn.agent_id === agentId)?.phone_number || null;

    // Format the response with computed values
    return {
        ...agent,
        calls_total: agent.calls_count?.[0]?.count || 0,
        assigned_numbers_count: agent.phone_numbers?.length || 0,
        assigned_phone_number: assignedPhoneNumber,
        average_duration_seconds: averageDuration
    }
}
