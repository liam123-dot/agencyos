'use server'

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { authorizedToAccessClient } from "../clients/clientMembers";
import { getUser } from "../user/getUser";
import { VapiClient } from "@vapi-ai/server-sdk";

export async function removePhoneNumber(phoneNumberId: string) {
    try {
    
        const {userData, supabaseServerClient} = await getUser();

        const { data: phoneNumber, error: phoneNumberError } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("id", phoneNumberId)
            .single();

        if (phoneNumberError || !phoneNumber) {
            throw new Error("Phone number not found");
        }
            
        const authorized = await authorizedToAccessClient(phoneNumber.client_id);
        if (!authorized) {
            throw new Error("Unauthorized to access this client.");
        }

        // Delete the phone number from our database
        const { error } = await supabaseServerClient
            .from("phone_numbers")
            .delete()
            .eq("id", phoneNumberId);

        const orgId = phoneNumber.organization_id;

        const {data: org, error: orgError} = await supabaseServerClient
            .from("organizations")
            .select("*")
            .eq("id", orgId)
            .single();
            
        if (orgError || !org) {
            throw new Error("Organization not found");
        }

        // Delete from VAPI if it's a VAPI phone number
        if (phoneNumber.platform === 'vapi' && phoneNumber.platform_id) {
            const vapiClient = new VapiClient({ token: org.vapi_api_key });
            
            try {
                await vapiClient.phoneNumbers.delete(phoneNumber.platform_id);
            } catch (vapiError: any) {
                console.error('Failed to delete phone number from VAPI:', vapiError);
                // Continue with database deletion even if VAPI deletion fails
            }
        }

        if (error) {
            throw new Error(error.message);
        }

        revalidatePath('/s/[orgId]/app/phone-numbers', 'page');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
