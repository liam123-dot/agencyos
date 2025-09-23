'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Phone, Download, CheckCircle } from "lucide-react"
import { toast } from "sonner"
import { getTwilioPhoneNumbers } from "@/app/api/clients/twilioCredentials"
import { importPhoneNumber } from "@/app/api/phone-numbers/importPhoneNumber"
import { getPhoneNumbers } from "@/app/api/phone-numbers/getPhoneNumbers"

interface PhoneNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
}

interface ImportPhoneNumbersDialogProps {
    clientId: string;
    clientName: string;
    twilioAccountSid: string;
    twilioAuthToken: string;
    onImportSuccess?: () => void;
}

export function ImportPhoneNumbersDialog({ 
    clientId, 
    clientName, 
    twilioAccountSid, 
    twilioAuthToken,
    onImportSuccess 
}: ImportPhoneNumbersDialogProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
    const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [importingNumbers, setImportingNumbers] = useState<Set<string>>(new Set())
    const [importedNumbers, setImportedNumbers] = useState<Set<string>>(new Set())
    const [error, setError] = useState<string | null>(null)

    const fetchPhoneNumbers = async () => {
        setIsLoading(true)
        setError(null)

        try {
            // Fetch both Twilio numbers and existing imported numbers
            const [twilioResult, existingResult] = await Promise.all([
                getTwilioPhoneNumbers(clientId),
                getPhoneNumbers(clientId)
            ])
            
            if (twilioResult.success && existingResult.success) {
                const twilioNumbers = twilioResult.phoneNumbers || []
                const existingNumbers = existingResult.phoneNumbers || []
                
                // Create a set of existing phone numbers for quick lookup
                const existingPhoneNumbersSet = new Set(
                    existingNumbers.map(num => num.phone_number)
                )
                
                // Filter out already imported numbers
                const availableForImport = twilioNumbers.filter(
                    (num: any) => !existingPhoneNumbersSet.has(num.phoneNumber)
                )
                
                setPhoneNumbers(twilioNumbers)
                setAvailableNumbers(availableForImport)
            } else {
                const error = twilioResult.error || existingResult.error || "Failed to fetch phone numbers"
                setError(error)
                toast.error(error)
            }
        } catch (err) {
            const errorMessage = "An unexpected error occurred"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (open) {
            fetchPhoneNumbers()
        } else {
            // Reset state when closing
            setPhoneNumbers([])
            setAvailableNumbers([])
            setImportingNumbers(new Set())
            setImportedNumbers(new Set())
            setError(null)
        }
    }

    const handleImportNumber = async (phoneNumber: PhoneNumber) => {
        setImportingNumbers(prev => new Set(prev).add(phoneNumber.sid))

        try {
            const result = await importPhoneNumber(
                phoneNumber.phoneNumber,
                clientId,
                twilioAccountSid,
                twilioAuthToken
            )

            if (result.success) {
                setImportedNumbers(prev => new Set(prev).add(phoneNumber.sid))
                // Remove from available numbers
                setAvailableNumbers(prev => prev.filter(num => num.sid !== phoneNumber.sid))
                toast.success(`Successfully imported ${phoneNumber.phoneNumber}`)
                onImportSuccess?.()
            } else {
                toast.error(result.error || "Failed to import phone number")
            }
        } catch (err) {
            toast.error("An unexpected error occurred")
        } finally {
            setImportingNumbers(prev => {
                const newSet = new Set(prev)
                newSet.delete(phoneNumber.sid)
                return newSet
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Import from Twilio
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Import Phone Numbers from Twilio
                    </DialogTitle>
                    <DialogDescription>
                        Select phone numbers from your Twilio account to import into {clientName}.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin mr-2" />
                            <span>Loading phone numbers...</span>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8">
                            <p className="text-red-500 mb-4">{error}</p>
                            <Button onClick={fetchPhoneNumbers} variant="outline">
                                Try Again
                            </Button>
                        </div>
                    ) : availableNumbers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-muted-foreground mb-4">
                                {phoneNumbers.length === 0 
                                    ? "No phone numbers found in your Twilio account."
                                    : "All phone numbers from your Twilio account have already been imported."
                                }
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {phoneNumbers.length === 0 
                                    ? "You can purchase phone numbers from your Twilio Console."
                                    : "You can purchase additional phone numbers from your Twilio Console."
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {availableNumbers.map((number) => {
                                const isImporting = importingNumbers.has(number.sid)
                                const isImported = importedNumbers.has(number.sid)
                                
                                return (
                                    <Card key={number.sid}>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-medium">{number.phoneNumber}</p>
                                                    {number.friendlyName && (
                                                        <p className="text-sm text-muted-foreground">
                                                            {number.friendlyName}
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        SID: {number.sid}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {isImported ? (
                                                        <div className="flex items-center gap-2 text-green-600">
                                                            <CheckCircle className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Imported</span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleImportNumber(number)}
                                                            disabled={isImporting}
                                                        >
                                                            {isImporting ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                                    Importing...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Download className="h-4 w-4 mr-2" />
                                                                    Import
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
