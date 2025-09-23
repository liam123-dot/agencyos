'use server'

import { revalidatePath } from "next/cache";
import { authorizedToAccessClient } from "../clients/clientMembers";

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

        // Insert the phone number into our database
        const { error } = await supabaseServerClient
            .from("phone_numbers")
            .insert({
                phone_number: phoneNumber,
                client_id: clientId,
                organization_id: client.organization_id,
                source: "client",
                twilio_account_sid: twilioAccountSid,
                twilio_auth_token: twilioAuthToken
            });

        if (error) {
            throw new Error(error.message);
        }

        revalidatePath('/s/[orgId]/app/phone-numbers', 'page');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
