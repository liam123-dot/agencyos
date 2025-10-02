'use server'

import { getUser } from "../user/getUser";

export async function getUnassignedPhoneNumbers(clientId?: string) {
    try {
        const { userData, supabaseServerClient } = await getUser();
        
        if (!clientId) {
            clientId = userData.client_id;
        }

        // Get all phone numbers for the client that are not assigned to any agent or workflow
        const { data: phoneNumbers, error } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("client_id", clientId)
            .is("agent_id", null)
            .is("workflow_id", null)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        return { success: true, phoneNumbers: phoneNumbers || [] };
    } catch (error: any) {
        return { success: false, error: error.message, phoneNumbers: [] };
    }
}

