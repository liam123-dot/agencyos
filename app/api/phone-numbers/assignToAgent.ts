'use server'

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { VapiClient } from "@vapi-ai/server-sdk";

export async function assignPhoneNumberToAgent(
    phoneNumberId: string,
    agentId: string
) {
    console.log(`[ASSIGN_PHONE] Starting assignment process - phoneNumberId: ${phoneNumberId}, agentId: ${agentId}`);
    
    try {
        const supabaseServerClient = await createServerClient();
        console.log(`[ASSIGN_PHONE] Supabase client initialized`);

        console.log(`[ASSIGN_PHONE] Fetching agent with client and organization data...`);

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
            console.error(`[ASSIGN_PHONE] Agent not found - agentId: ${agentId}`, agentError);
            throw new Error("Agent not found");
        }

        console.log(`[ASSIGN_PHONE] Agent found - name: ${agent.data?.name}, platform: ${agent.platform}, platform_id: ${agent.platform_id}`);
        console.log(`[ASSIGN_PHONE] Client info - id: ${agent.client.id}, name: ${agent.client.name}`);

        // Extract organization from the joined data
        const organization = agent.client.organization;
        
        if (!organization) {
            console.error(`[ASSIGN_PHONE] Organization not found for agent ${agentId}`);
            throw new Error("Organization not found for this agent");
        }

        console.log(`[ASSIGN_PHONE] Organization found - id: ${organization.id}, name: ${organization.name}`);

        if (!organization.vapi_api_key) {
            console.error(`[ASSIGN_PHONE] Vapi API key not configured for organization ${organization.id}`);
            throw new Error("Vapi API key not configured for this organization");
        }

        console.log(`[ASSIGN_PHONE] Vapi API key found for organization`);
        console.log(`[ASSIGN_PHONE] Fetching phone number data...`);

        // Check if phone number exists and is not already assigned
        const { data: phoneNumber, error: phoneError } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("id", phoneNumberId)
            .eq("client_id", agent.client_id)
            .single();

        if (phoneError || !phoneNumber) {
            console.error(`[ASSIGN_PHONE] Phone number not found or access denied - phoneNumberId: ${phoneNumberId}, clientId: ${agent.client.id}`, phoneError);
            throw new Error("Phone number not found or doesn't belong to this client");
        }

        console.log(`[ASSIGN_PHONE] Phone number found - number: ${phoneNumber.phone_number}, current agent_id: ${phoneNumber.agent_id}`);
        console.log(`[ASSIGN_PHONE] Twilio credentials - SID: ${phoneNumber.twilio_account_sid ? 'present' : 'missing'}, Token: ${phoneNumber.twilio_auth_token ? 'present' : 'missing'}`);

        if (phoneNumber.agent_id) {
            console.error(`[ASSIGN_PHONE] Phone number ${phoneNumber.phone_number} is already assigned to agent ${phoneNumber.agent_id}`);
            throw new Error("Phone number is already assigned to an agent");
        }

        // Initialize Vapi client
        console.log(`[ASSIGN_PHONE] Initializing Vapi client...`);
        const vapiClient = new VapiClient({ token: organization.vapi_api_key });
        console.log(`[ASSIGN_PHONE] Vapi client initialized successfully`);

        // Step 1: Check if phone number exists in Vapi
        console.log(`[ASSIGN_PHONE] Fetching Vapi phone numbers list...`);
        const vapiPhoneNumbers = await vapiClient.phoneNumbers.list();
        console.log(`[ASSIGN_PHONE] Retrieved ${vapiPhoneNumbers.length} phone numbers from Vapi`);
        
        let existingVapiPhoneNumber = vapiPhoneNumbers.find((vn: any) => 
            vn.number === phoneNumber.phone_number
        );
        
        console.log(`[ASSIGN_PHONE] Phone number ${phoneNumber.phone_number} ${existingVapiPhoneNumber ? 'found' : 'not found'} in Vapi`);
        if (existingVapiPhoneNumber) {
            console.log(`[ASSIGN_PHONE] Existing Vapi phone number - id: ${existingVapiPhoneNumber.id}, assistantId: ${existingVapiPhoneNumber.assistantId}, provider: ${existingVapiPhoneNumber.provider}`);
        }

        // Step 2: Create phone number in Vapi if it doesn't exist, then assign it
        if (!existingVapiPhoneNumber) {
            console.log(`[ASSIGN_PHONE] Creating new Twilio phone number in Vapi...`);
            
            // Create a Twilio phone number in Vapi using stored credentials
            if (!phoneNumber.twilio_account_sid || !phoneNumber.twilio_auth_token) {
                console.error(`[ASSIGN_PHONE] Missing Twilio credentials for phone number ${phoneNumber.phone_number}`);
                throw new Error("Twilio credentials not found for this phone number. Cannot create in Vapi.");
            }

            console.log(`[ASSIGN_PHONE] Creating Twilio phone number with SID: ${phoneNumber.twilio_account_sid}`);
            
            const createPayload = {
                provider: "twilio" as const,
                number: phoneNumber.phone_number,
                name: `${phoneNumber.phone_number} - ${agent.data?.name || 'Agent'}`,
                twilioAccountSid: phoneNumber.twilio_account_sid,
                twilioAuthToken: phoneNumber.twilio_auth_token,
                assistantId: agent.platform_id,
            };
            console.log(`[ASSIGN_PHONE] Create payload:`, { ...createPayload, twilioAuthToken: '[REDACTED]' });

            existingVapiPhoneNumber = await vapiClient.phoneNumbers.create(createPayload);
            console.log(`[ASSIGN_PHONE] Successfully created phone number in Vapi - id: ${existingVapiPhoneNumber.id}`);
        } else {
            console.log(`[ASSIGN_PHONE] Updating existing Vapi phone number to assign to agent ${agent.platform_id}...`);
            
            const updatePayload = {
                assistantId: agent.platform_id,
                name: `${phoneNumber.phone_number} - ${agent.data?.name || 'Agent'}`,
            };
            console.log(`[ASSIGN_PHONE] Update payload:`, updatePayload);

            // Update existing phone number to assign it to the agent's platform_id
            await vapiClient.phoneNumbers.update(existingVapiPhoneNumber.id, updatePayload);
            console.log(`[ASSIGN_PHONE] Successfully updated Vapi phone number`);
        }

        // Step 3: Assign the phone number to the agent in our database
        console.log(`[ASSIGN_PHONE] Updating database to assign phone number ${phoneNumber.phone_number} to agent ${agentId}...`);
        
        const { error: updateError } = await supabaseServerClient
            .from("phone_numbers")
            .update({ agent_id: agentId })
            .eq("id", phoneNumberId);

        if (updateError) {
            console.error(`[ASSIGN_PHONE] Database update failed:`, updateError);
            throw new Error(updateError.message);
        }

        console.log(`[ASSIGN_PHONE] Successfully updated database`);
        console.log(`[ASSIGN_PHONE] Revalidating deployment page...`);
        
        revalidatePath(`/s/[orgId]/app/agents/[agentId]/deployment`);
        
        console.log(`[ASSIGN_PHONE] Assignment completed successfully - phoneNumber: ${phoneNumber.phone_number}, agent: ${agent.data?.name}, platform_id: ${agent.platform_id}`);
        return { success: true };
    } catch (error: any) {
        console.error(`[ASSIGN_PHONE] Assignment failed - phoneNumberId: ${phoneNumberId}, agentId: ${agentId}`, error);
        console.error(`[ASSIGN_PHONE] Error details:`, {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        return { success: false, error: error.message };
    }
}
