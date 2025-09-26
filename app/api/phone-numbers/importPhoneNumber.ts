'use server'

import { revalidatePath } from "next/cache";
import { authorizedToAccessClient } from "../clients/clientMembers";
import { VapiClient } from "@vapi-ai/server-sdk";

export async function importPhoneNumber(
    phoneNumber: string,
    clientId: string,
    twilioAccountSid: string,
    twilioAuthToken: string
) {
    try {
        const authorized = await authorizedToAccessClient(clientId);
        if (!authorized) {
            throw new Error("Unauthorized to access this client.");
        }

        const { supabaseServerClient, client } = authorized;

        // Check if phone number already exists for this client
        const { data: existingNumber } = await supabaseServerClient
            .from("phone_numbers")
            .select("id")
            .eq("phone_number", phoneNumber)
            .eq("client_id", clientId)
            .single();

        if (existingNumber) {
            return { success: false, error: "Phone number already imported" };
        }

        // Get organization to access VAPI API key
        const { data: org, error: orgError } = await supabaseServerClient
            .from("organizations")
            .select("*")
            .eq("id", client.organization_id)
            .single();

        if (orgError || !org) {
            throw new Error("Organization not found");
        }

        // Create phone number in VAPI
        let vapiPhoneNumber;
        try {
            const vapiClient = new VapiClient({ token: org.vapi_api_key });
            
            const createPayload = {
                provider: "twilio" as const,
                number: phoneNumber,
                name: `${phoneNumber} - ${client.name || 'Client'}`,
                twilioAccountSid: twilioAccountSid,
                twilioAuthToken: twilioAuthToken
            };

            vapiPhoneNumber = await vapiClient.phoneNumbers.create(createPayload);
        } catch (vapiError: any) {
            console.error('Failed to create phone number in VAPI:', vapiError);
            throw new Error(`Failed to create phone number in VAPI: ${vapiError.message}`);
        }

        // Insert the phone number into our database with VAPI platform information
        const { error } = await supabaseServerClient
            .from("phone_numbers")
            .insert({
                phone_number: phoneNumber,
                client_id: clientId,
                organization_id: client.organization_id,
                source: "client",
                twilio_account_sid: twilioAccountSid,
                twilio_auth_token: twilioAuthToken,
                platform: "vapi",
                platform_id: vapiPhoneNumber.id
            });

        if (error) {
            throw new Error(error.message);
        }

        const { data: newPhoneNumber } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("platform_id", vapiPhoneNumber.id)
            .single();

        await assignWebhookToVapiAgent(org.vapi_api_key, newPhoneNumber?.id || '', vapiPhoneNumber.id);

        revalidatePath('/s/[orgId]/app/phone-numbers', 'page');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

async function assignWebhookToVapiAgent(vapiKey: string, phoneNumberId: string, vapiPhoneNumberId: string) {

    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/phone-numbers/${phoneNumberId}/webhook`

    const vapi = new VapiClient({token: vapiKey})

    await vapi.phoneNumbers.update(vapiPhoneNumberId, {
        server: {
          url: webhookUrl
        }
    });
}