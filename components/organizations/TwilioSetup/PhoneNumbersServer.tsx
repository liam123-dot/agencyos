'use server'

import { authorizedToAccessClient } from "@/app/api/clients/clientMembers"
import { TwilioSetup } from "./TwilioSetup"
import { PhoneNumbersClientWrapper } from "./PhoneNumbersClientWrapper"

interface PhoneNumbersServerProps {
    clientId: string;
}

export async function PhoneNumbersServer({ clientId }: PhoneNumbersServerProps) {
    const authorized = await authorizedToAccessClient(clientId);
    
    if (!authorized) {
        return (
            <div className="text-red-500">
                Client not found or you don't have permission to access it.
            </div>
        )
    }

    const { client } = authorized;

    const hasCredentials = !!(client.twilio_account_sid && client.twilio_auth_token)

    if (!hasCredentials) {
        // Show setup component if credentials are not configured
        return (
            <TwilioSetup 
                twilioCredentialsExist={false} 
                clientName={client.name}
                clientId={client.id}
            />
        )
    }

    // Show phone numbers management component if credentials are configured
    return (
        <PhoneNumbersClientWrapper 
            clientId={client.id}
            clientName={client.name}
            twilioAccountSid={client.twilio_account_sid}
            twilioAuthToken={client.twilio_auth_token}
        />
    )
}
