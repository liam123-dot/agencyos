'use client'

import { useEffect, useState, forwardRef, useImperativeHandle } from "react"

import { getPhoneNumbers } from "@/app/api/phone-numbers/getPhoneNumbers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Phone, Loader2 } from "lucide-react"
import { RemovePhoneNumberButton } from "./RemovePhoneNumberButton"

interface PhoneNumber {
    id: string;
    phone_number: string;
    source: string;
    twilio_account_sid: string;
    created_at: string;
}

interface PhoneNumbersTableProps {
    clientId: string;
    clientName: string;
}

interface PhoneNumbersTableHandle {
    refresh: () => void;
}

export const PhoneNumbersTable = forwardRef<PhoneNumbersTableHandle, PhoneNumbersTableProps>(
    ({ clientId, clientName }, ref) => {
        const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
        const [isLoading, setIsLoading] = useState(true)
        const [error, setError] = useState<string | null>(null)

        const fetchPhoneNumbers = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const result = await getPhoneNumbers(clientId)
                
                if (result.success) {
                    setPhoneNumbers(result.phoneNumbers || [])
                } else {
                    setError(result.error || "Failed to load phone numbers")
                }
            } catch (err) {
                setError("An unexpected error occurred")
            } finally {
                setIsLoading(false)
            }
        }

        useImperativeHandle(ref, () => ({
            refresh: fetchPhoneNumbers
        }))

        useEffect(() => {
            fetchPhoneNumbers()
        }, [clientId])

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Imported Phone Numbers
                    </CardTitle>
                    <CardDescription>Phone numbers imported from Twilio for {clientName}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Loading phone numbers...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Imported Phone Numbers
                    </CardTitle>
                    <CardDescription>Phone numbers imported from Twilio for {clientName}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-red-500">Failed to load phone numbers: {error}</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Imported Phone Numbers
                </CardTitle>
                <CardDescription>
                    Phone numbers imported from Twilio for {clientName} ({phoneNumbers.length} total)
                </CardDescription>
            </CardHeader>
            <CardContent>
                {phoneNumbers.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-2">
                            No phone numbers have been imported yet.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Use the "Import from Twilio" button above to import phone numbers.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Phone Number</TableHead>
                                    <TableHead>Account SID</TableHead>
                                    <TableHead>Imported Date</TableHead>
                                    <TableHead className="w-[100px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {phoneNumbers.map((number) => (
                                    <TableRow key={number.id}>
                                        <TableCell className="font-medium">
                                            {number.phone_number}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {number.twilio_account_sid ? 
                                                `${number.twilio_account_sid.substring(0, 10)}...` : 
                                                'N/A'
                                            }
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {new Date(number.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <RemovePhoneNumberButton 
                                                phoneNumberId={number.id}
                                                phoneNumber={number.phone_number}
                                                onRemoveSuccess={() => fetchPhoneNumbers()}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
})

PhoneNumbersTable.displayName = 'PhoneNumbersTable'
