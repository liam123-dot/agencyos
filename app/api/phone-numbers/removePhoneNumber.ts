'use server'

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function removePhoneNumber(phoneNumberId: string) {
    try {
        const supabaseServerClient = await createServerClient();

        // Delete the phone number from our database
        const { error } = await supabaseServerClient
            .from("phone_numbers")
            .delete()
            .eq("id", phoneNumberId);

        if (error) {
            throw new Error(error.message);
        }

        revalidatePath('/s/[orgId]/app/phone-numbers', 'page');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
