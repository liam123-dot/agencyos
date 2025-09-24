'use server'

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { VapiClient } from "@vapi-ai/server-sdk";

export async function unassignPhoneNumberFromAgent(
    phoneNumberId: string
) {
    console.log(`[UNASSIGN_PHONE] Starting unassignment process - phoneNumberId: ${phoneNumberId}`);
    
    try {
        const supabaseServerClient = await createServerClient();
        console.log(`[UNASSIGN_PHONE] Supabase client initialized`);

        console.log(`[UNASSIGN_PHONE] Fetching phone number with agent, client and organization data...`);

        // Get the phone number with its related agent, client, and organization info
        const { data: phoneNumber, error: phoneError } = await supabaseServerClient
            .from("phone_numbers")
            .select(`
                *,
                agent:agents(
                    *,
                    client:clients!inner(
                        *,
                        organization:organizations!inner(*)
                    )
                )
            `)
            .eq("id", phoneNumberId)
            .single();

        if (phoneError || !phoneNumber) {
            console.error(`[UNASSIGN_PHONE] Phone number not found - phoneNumberId: ${phoneNumberId}`, phoneError);
            throw new Error("Phone number not found");
        }

        console.log(`[UNASSIGN_PHONE] Phone number found - number: ${phoneNumber.phone_number}, current agent_id: ${phoneNumber.agent_id}`);

        if (!phoneNumber.agent_id || !phoneNumber.agent) {
            console.error(`[UNASSIGN_PHONE] Phone number ${phoneNumber.phone_number} is not currently assigned to any agent`);
            throw new Error("Phone number is not currently assigned to any agent");
        }

        console.log(`[UNASSIGN_PHONE] Agent info - id: ${phoneNumber.agent.id}, name: ${phoneNumber.agent.data?.name}, platform_id: ${phoneNumber.agent.platform_id}`);
        console.log(`[UNASSIGN_PHONE] Client info - id: ${phoneNumber.agent.client.id}, name: ${phoneNumber.agent.client.name}`);

        // Extract organization from the joined data
        const organization = phoneNumber.agent.client.organization;
        
        if (!organization) {
            console.error(`[UNASSIGN_PHONE] Organization not found for phone number ${phoneNumber.phone_number}`);
            throw new Error("Organization not found for this phone number");
        }

        console.log(`[UNASSIGN_PHONE] Organization found - id: ${organization.id}, name: ${organization.name}`);

        if (!organization.vapi_api_key) {
            console.error(`[UNASSIGN_PHONE] Vapi API key not configured for organization ${organization.id}`);
            throw new Error("Vapi API key not configured for this organization");
        }

        console.log(`[UNASSIGN_PHONE] Vapi API key found for organization`);

        // Initialize Vapi client
        console.log(`[UNASSIGN_PHONE] Initializing Vapi client...`);
        const vapiClient = new VapiClient({ token: organization.vapi_api_key });
        console.log(`[UNASSIGN_PHONE] Vapi client initialized successfully`);

        // Step 1: Find and unassign the phone number in Vapi
        console.log(`[UNASSIGN_PHONE] Fetching Vapi phone numbers list...`);
        const vapiPhoneNumbers = await vapiClient.phoneNumbers.list();
        console.log(`[UNASSIGN_PHONE] Retrieved ${vapiPhoneNumbers.length} phone numbers from Vapi`);
        
        const existingVapiPhoneNumber = vapiPhoneNumbers.find((vn: any) => 
            vn.number === phoneNumber.phone_number
        );
        
        console.log(`[UNASSIGN_PHONE] Phone number ${phoneNumber.phone_number} ${existingVapiPhoneNumber ? 'found' : 'not found'} in Vapi`);

        if (existingVapiPhoneNumber) {
            console.log(`[UNASSIGN_PHONE] Current Vapi phone number - id: ${existingVapiPhoneNumber.id}, assistantId: ${existingVapiPhoneNumber.assistantId}, provider: ${existingVapiPhoneNumber.provider}`);
            console.log(`[UNASSIGN_PHONE] Removing assistant assignment from Vapi phone number...`);
            
            const updatePayload = {
                assistantId: null,
                name: phoneNumber.phone_number, // Reset to just the number
            };
            console.log(`[UNASSIGN_PHONE] Update payload:`, updatePayload);

            // Remove the assistant assignment from the phone number
            await vapiClient.phoneNumbers.update(existingVapiPhoneNumber.id, updatePayload);
            console.log(`[UNASSIGN_PHONE] Successfully removed assistant assignment from Vapi phone number`);
        } else {
            console.warn(`[UNASSIGN_PHONE] Phone number ${phoneNumber.phone_number} not found in Vapi during unassignment. Proceeding with local database update only.`);
        }

        // Step 2: Unassign the phone number in our database
        console.log(`[UNASSIGN_PHONE] Updating database to remove agent assignment from phone number ${phoneNumber.phone_number}...`);
        
        const { error: updateError } = await supabaseServerClient
            .from("phone_numbers")
            .update({ agent_id: null })
            .eq("id", phoneNumberId);

        if (updateError) {
            console.error(`[UNASSIGN_PHONE] Database update failed:`, updateError);
            throw new Error(updateError.message);
        }

        console.log(`[UNASSIGN_PHONE] Successfully updated database`);
        console.log(`[UNASSIGN_PHONE] Revalidating deployment page...`);
        
        revalidatePath(`/s/[orgId]/app/agents/[agentId]/deployment`);
        
        console.log(`[UNASSIGN_PHONE] Unassignment completed successfully - phoneNumber: ${phoneNumber.phone_number}, was assigned to agent: ${phoneNumber.agent.data?.name}`);
        return { success: true };
    } catch (error: any) {
        console.error(`[UNASSIGN_PHONE] Unassignment failed - phoneNumberId: ${phoneNumberId}`, error);
        console.error(`[UNASSIGN_PHONE] Error details:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return { success: false, error: error.message };
    }
}
