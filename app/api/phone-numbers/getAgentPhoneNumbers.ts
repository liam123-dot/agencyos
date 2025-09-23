'use server'

import { createServerClient } from "@/lib/supabase/server";

export async function getAgentPhoneNumbers(agentId: string) {
    try {
        const supabaseServerClient = await createServerClient();

        // Get the agent with its related client info
        const { data: agent, error: agentError } = await supabaseServerClient
            .from("agents")
            .select(`
                *,
                client:clients!inner(*)
            `)
            .eq("id", agentId)
            .single();

        if (agentError || !agent) {
            throw new Error("Agent not found");
        }

        // Get all phone numbers for the client
        const { data: phoneNumbers, error } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("client_id", agent.client.id)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        // Separate assigned and unassigned numbers
        const assignedToThisAgent = phoneNumbers?.filter(num => num.agent_id === agentId) || [];
        const availableToAssign = phoneNumbers?.filter(num => !num.agent_id) || [];

        return { 
            success: true, 
            assignedToThisAgent,
            availableToAssign,
            agent 
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
