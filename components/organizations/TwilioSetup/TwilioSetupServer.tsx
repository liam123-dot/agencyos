'use server'

import { authorizedToAccessClient } from "@/app/api/clients/clientMembers"
import { TwilioSetup } from "./TwilioSetup"

interface TwilioSetupServerProps {
    clientId: string;
}

export async function TwilioSetupServer({ clientId }: TwilioSetupServerProps) {
    const authorized = await authorizedToAccessClient(clientId);
    
    if (!authorized) {
        return (
            <div className="text-red-500">
                Client not found or you don't have permission to access it.
            </div>
        )
    }

    const { client } = authorized;

    return (
        <TwilioSetup 
            twilioCredentialsExist={!!(client.twilio_account_sid && client.twilio_auth_token)} 
            clientName={client.name}
            clientId={client.id}
        />
    )
}
