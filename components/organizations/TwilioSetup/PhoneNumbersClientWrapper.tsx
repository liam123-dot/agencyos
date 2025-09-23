'use client'

import { PhoneNumbersManagement } from "./PhoneNumbersManagement"

interface PhoneNumbersClientWrapperProps {
    clientId: string;
    clientName: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
}

export function PhoneNumbersClientWrapper({ 
    clientId, 
    clientName, 
    twilioAccountSid, 
    twilioAuthToken 
}: PhoneNumbersClientWrapperProps) {
    return (
        <PhoneNumbersManagement 
            clientId={clientId}
            clientName={clientName}
            twilioAccountSid={twilioAccountSid}
            twilioAuthToken={twilioAuthToken}
        />
    )
}
