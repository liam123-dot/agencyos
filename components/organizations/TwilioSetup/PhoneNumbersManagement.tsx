'use client'

import { useRef } from "react"
import { ImportPhoneNumbersDialog } from "./ImportPhoneNumbersDialog"
import { PhoneNumbersTable } from "./PhoneNumbersTable"

interface PhoneNumbersManagementProps {
    clientId: string;
    clientName: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
}

export function PhoneNumbersManagement({ 
    clientId, 
    clientName, 
    twilioAccountSid, 
    twilioAuthToken 
}: PhoneNumbersManagementProps) {
    const tableRef = useRef<{ refresh: () => void }>(null)

    const handleImportSuccess = () => {
        // Refresh the table when import is successful
        tableRef.current?.refresh()
    }

    return (
        <PhoneNumbersTable 
            ref={tableRef}
            clientId={clientId} 
            clientName={clientName}
            importButton={
                <ImportPhoneNumbersDialog
                    clientId={clientId}
                    clientName={clientName}
                    twilioAccountSid={twilioAccountSid}
                    twilioAuthToken={twilioAuthToken}
                    onImportSuccess={handleImportSuccess}
                />
            }
        />
    )
}
