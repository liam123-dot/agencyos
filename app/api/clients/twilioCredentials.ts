'use server'

import { revalidatePath } from "next/cache";
import { authorizedToAccessClient } from "./clientMembers";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const Twilio = require('twilio');
const twilio = Twilio;

export async function validateTwilioCredentials(
    accountSid: string,
    authToken: string
): Promise<{ isValid: boolean; error?: string }> {
    // Basic validation
    if (!accountSid || typeof accountSid !== 'string') {
        return { isValid: false, error: 'Valid Twilio Account SID is required' };
    }

    if (!authToken || typeof authToken !== 'string') {
        return { isValid: false, error: 'Valid Twilio Auth Token is required' };
    }

    const trimmedSid = accountSid.trim();
    const trimmedToken = authToken.trim();

    // Format validation for Account SID
    if (!trimmedSid.startsWith('AC')) {
        return { isValid: false, error: 'Twilio Account SID must start with "AC"' };
    }

    // Test the credentials by trying to retrieve account information
    try {
        const client = twilio(trimmedSid, trimmedToken);
        await client.api.accounts(trimmedSid).fetch();
    } catch (error) {
        console.error('Twilio credentials validation failed:', error);
        return { isValid: false, error: 'Invalid Twilio credentials' };
    }

    return { isValid: true };
}

export async function saveTwilioCredentials(accountSid: string, authToken: string, clientId: string) {
    try {
        const authorized = await authorizedToAccessClient(clientId);
        if (!authorized) {
            throw new Error("Unauthorized to access this client.");
        }

        const { supabaseServerClient } = authorized;

        const validation = await validateTwilioCredentials(accountSid, authToken);

        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        const { error } = await supabaseServerClient
            .from("clients")
            .update({ 
                twilio_account_sid: accountSid,
                twilio_auth_token: authToken
            })
            .eq("id", clientId);

        if (error) {
            throw new Error(error.message);
        }

        revalidatePath('/app/phone-numbers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeTwilioCredentials(clientId: string) {
    try {
        const authorized = await authorizedToAccessClient(clientId);
        if (!authorized) {
            throw new Error("Unauthorized to access this client.");
        }

        const { supabaseServerClient } = authorized;

        const { error } = await supabaseServerClient
            .from("clients")
            .update({ 
                twilio_account_sid: null,
                twilio_auth_token: null
            })
            .eq("id", clientId);

        if (error) {
            throw new Error(error.message);
        }

        revalidatePath('/app/phone-numbers');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function getTwilioPhoneNumbers(clientId: string) {
    try {
        const authorized = await authorizedToAccessClient(clientId);
        if (!authorized) {
            throw new Error("Unauthorized to access this client.");
        }

        const { client } = authorized;

        if (!client.twilio_account_sid || !client.twilio_auth_token) {
            return { success: false, error: "Twilio credentials not configured" };
        }

        // Fetch phone numbers from Twilio
        const twilioClient = twilio(client.twilio_account_sid, client.twilio_auth_token);
        const numbers = await twilioClient.incomingPhoneNumbers.list();

        return { 
            success: true, 
            phoneNumbers: numbers.map((n: any) => ({
                sid: n.sid,
                phoneNumber: n.phoneNumber,
                friendlyName: n.friendlyName
            }))
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
