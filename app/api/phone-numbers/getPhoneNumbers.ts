'use server'

import { authorizedToAccessClient } from "../clients/clientMembers";

export async function getPhoneNumbers(clientId: string) {
    try {
        const authorized = await authorizedToAccessClient(clientId);
        if (!authorized) {
            throw new Error("Unauthorized to access this client.");
        }

        const { supabaseServerClient } = authorized;

        const { data: phoneNumbers, error } = await supabaseServerClient
            .from("phone_numbers")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false });

        if (error) {
            throw new Error(error.message);
        }

        return { success: true, phoneNumbers: phoneNumbers || [] };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
