'use server'

import { createServerClient } from "@/lib/supabase/server";
import { VapiClient } from "@vapi-ai/server-sdk";

/**
 * Removes agent assignment from phone numbers in VAPI when routing rules are created
 * This allows routing rules to take precedence over direct agent assignment
 */
export async function removeAgentFromVapiPhoneNumbers(agentId: string) {
    console.log(`[VAPI_REMOVE] Starting removal of agent ${agentId} from VAPI phone numbers...`);
    
    try {
        const supabaseServerClient = await createServerClient();
        
        // Get the agent with its related client and organization info
        const { data: agent, error: agentError } = await supabaseServerClient
            .from("agents")
            .select(`
                *,
                client:clients!inner(
                    *,
                    organization:organizations!inner(*)
                )
            `)
            .eq("id", agentId)
            .single();

        if (agentError || !agent) {
            console.error(`[VAPI_REMOVE] Agent not found - agentId: ${agentId}`, agentError);
            throw new Error("Agent not found");
        }

        const organization = agent.client.organization;
        
        if (!organization || !organization.vapi_api_key) {
            console.error(`[VAPI_REMOVE] Vapi API key not configured for organization`);
            throw new Error("Vapi API key not configured for this organization");
        }

        // Get all phone numbers assigned to this agent
        const { data: phoneNumbers, error: phoneError } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("agent_id", agentId)
            .eq("client_id", agent.client_id);

        if (phoneError) {
            console.error(`[VAPI_REMOVE] Error fetching phone numbers:`, phoneError);
            throw new Error("Failed to fetch phone numbers for agent");
        }

        if (!phoneNumbers || phoneNumbers.length === 0) {
            console.log(`[VAPI_REMOVE] No phone numbers assigned to agent ${agentId}`);
            return { success: true, message: "No phone numbers to update" };
        }

        console.log(`[VAPI_REMOVE] Found ${phoneNumbers.length} phone numbers assigned to agent`);

        // Initialize Vapi client
        const vapiClient = new VapiClient({ token: organization.vapi_api_key });
        
        // Get all VAPI phone numbers
        const vapiPhoneNumbers = await vapiClient.phoneNumbers.list();
        console.log(`[VAPI_REMOVE] Retrieved ${vapiPhoneNumbers.length} phone numbers from Vapi`);

        const updateResults = [];

        for (const phoneNumber of phoneNumbers) {
            console.log(`[VAPI_REMOVE] Processing phone number: ${phoneNumber.phone_number}`);
            
            // Find the corresponding VAPI phone number
            const vapiPhoneNumber = vapiPhoneNumbers.find((vn: any) => 
                vn.number === phoneNumber.phone_number
            );

            if (vapiPhoneNumber && vapiPhoneNumber.assistantId === agent.platform_id) {
                console.log(`[VAPI_REMOVE] Removing assistant assignment from VAPI phone number ${phoneNumber.phone_number}`);
                
                try {
                    // Remove the assistant assignment (set to null)
                    await vapiClient.phoneNumbers.update(vapiPhoneNumber.id, {
                        assistantId: null as any,
                        name: `${phoneNumber.phone_number} - Routing Rules Active`
                    });
                    
                    console.log(`[VAPI_REMOVE] Successfully removed assistant from ${phoneNumber.phone_number}`);
                    updateResults.push({ phoneNumber: phoneNumber.phone_number, success: true });
                } catch (vapiError: any) {
                    console.error(`[VAPI_REMOVE] Failed to update VAPI phone number ${phoneNumber.phone_number}:`, vapiError);
                    updateResults.push({ 
                        phoneNumber: phoneNumber.phone_number, 
                        success: false, 
                        error: vapiError.message 
                    });
                }
            } else {
                console.log(`[VAPI_REMOVE] Phone number ${phoneNumber.phone_number} not found in VAPI or not assigned to this agent`);
                updateResults.push({ 
                    phoneNumber: phoneNumber.phone_number, 
                    success: false, 
                    error: "Phone number not found in VAPI or not assigned to agent" 
                });
            }
        }

        const successCount = updateResults.filter(r => r.success).length;
        const failureCount = updateResults.filter(r => !r.success).length;
        
        console.log(`[VAPI_REMOVE] Completed: ${successCount} successful, ${failureCount} failed`);
        
        return { 
            success: true, 
            message: `Updated ${successCount} phone numbers, ${failureCount} failed`,
            results: updateResults
        };

    } catch (error: any) {
        console.error(`[VAPI_REMOVE] Failed to remove agent from VAPI phone numbers:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Re-assigns agent to phone numbers in VAPI when all routing rules are deleted
 * This restores direct agent assignment when routing rules are no longer active
 */
export async function reassignAgentToVapiPhoneNumbers(agentId: string) {
    console.log(`[VAPI_REASSIGN] Starting reassignment of agent ${agentId} to VAPI phone numbers...`);
    
    try {
        const supabaseServerClient = await createServerClient();
        
        // Get the agent with its related client and organization info
        const { data: agent, error: agentError } = await supabaseServerClient
            .from("agents")
            .select(`
                *,
                client:clients!inner(
                    *,
                    organization:organizations!inner(*)
                )
            `)
            .eq("id", agentId)
            .single();

        if (agentError || !agent) {
            console.error(`[VAPI_REASSIGN] Agent not found - agentId: ${agentId}`, agentError);
            throw new Error("Agent not found");
        }

        const organization = agent.client.organization;
        
        if (!organization || !organization.vapi_api_key) {
            console.error(`[VAPI_REASSIGN] Vapi API key not configured for organization`);
            throw new Error("Vapi API key not configured for this organization");
        }

        // Get all phone numbers assigned to this agent
        const { data: phoneNumbers, error: phoneError } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("agent_id", agentId)
            .eq("client_id", agent.client_id);

        if (phoneError) {
            console.error(`[VAPI_REASSIGN] Error fetching phone numbers:`, phoneError);
            throw new Error("Failed to fetch phone numbers for agent");
        }

        if (!phoneNumbers || phoneNumbers.length === 0) {
            console.log(`[VAPI_REASSIGN] No phone numbers assigned to agent ${agentId}`);
            return { success: true, message: "No phone numbers to update" };
        }

        console.log(`[VAPI_REASSIGN] Found ${phoneNumbers.length} phone numbers assigned to agent`);

        // Initialize Vapi client
        const vapiClient = new VapiClient({ token: organization.vapi_api_key });
        
        // Get all VAPI phone numbers
        const vapiPhoneNumbers = await vapiClient.phoneNumbers.list();
        console.log(`[VAPI_REASSIGN] Retrieved ${vapiPhoneNumbers.length} phone numbers from Vapi`);

        const updateResults = [];

        for (const phoneNumber of phoneNumbers) {
            console.log(`[VAPI_REASSIGN] Processing phone number: ${phoneNumber.phone_number}`);
            
            // Find the corresponding VAPI phone number
            const vapiPhoneNumber = vapiPhoneNumbers.find((vn: any) => 
                vn.number === phoneNumber.phone_number
            );

            if (vapiPhoneNumber) {
                console.log(`[VAPI_REASSIGN] Reassigning agent to VAPI phone number ${phoneNumber.phone_number}`);
                
                try {
                    // Reassign the assistant
                    await vapiClient.phoneNumbers.update(vapiPhoneNumber.id, {
                        assistantId: agent.platform_id,
                        name: `${phoneNumber.phone_number} - ${agent.data?.name || 'Agent'}`
                    });
                    
                    console.log(`[VAPI_REASSIGN] Successfully reassigned agent to ${phoneNumber.phone_number}`);
                    updateResults.push({ phoneNumber: phoneNumber.phone_number, success: true });
                } catch (vapiError: any) {
                    console.error(`[VAPI_REASSIGN] Failed to update VAPI phone number ${phoneNumber.phone_number}:`, vapiError);
                    updateResults.push({ 
                        phoneNumber: phoneNumber.phone_number, 
                        success: false, 
                        error: vapiError.message 
                    });
                }
            } else {
                console.log(`[VAPI_REASSIGN] Phone number ${phoneNumber.phone_number} not found in VAPI`);
                updateResults.push({ 
                    phoneNumber: phoneNumber.phone_number, 
                    success: false, 
                    error: "Phone number not found in VAPI" 
                });
            }
        }

        const successCount = updateResults.filter(r => r.success).length;
        const failureCount = updateResults.filter(r => !r.success).length;
        
        console.log(`[VAPI_REASSIGN] Completed: ${successCount} successful, ${failureCount} failed`);
        
        return { 
            success: true, 
            message: `Updated ${successCount} phone numbers, ${failureCount} failed`,
            results: updateResults
        };

    } catch (error: any) {
        console.error(`[VAPI_REASSIGN] Failed to reassign agent to VAPI phone numbers:`, error);
        return { success: false, error: error.message };
    }
}
