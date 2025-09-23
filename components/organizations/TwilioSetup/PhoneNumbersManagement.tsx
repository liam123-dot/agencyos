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
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Phone Numbers Management</h2>
                    <p className="text-muted-foreground">
                        Import and manage phone numbers from your Twilio account.
                    </p>
                </div>
                <ImportPhoneNumbersDialog
                    clientId={clientId}
                    clientName={clientName}
                    twilioAccountSid={twilioAccountSid}
                    twilioAuthToken={twilioAuthToken}
                    onImportSuccess={handleImportSuccess}
                />
            </div>
            
            <PhoneNumbersTable 
                ref={tableRef}
                clientId={clientId} 
                clientName={clientName} 
            />
        </div>
    )
}
