'use client'

import { useState, useEffect } from "react"
import { getTwilioPhoneNumbers } from "@/app/api/clients/twilioCredentials"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Phone, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface PhoneNumber {
    sid: string;
    phoneNumber: string;
    friendlyName: string;
}

interface PhoneNumbersComponentProps {
    clientId: string;
    clientName: string;
}

export function PhoneNumbersComponent({ clientId, clientName }: PhoneNumbersComponentProps) {
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const fetchPhoneNumbers = async (showRefreshingState = false) => {
        if (showRefreshingState) {
            setIsRefreshing(true)
        } else {
            setIsLoading(true)
        }
        
        setError(null)

        try {
            const result = await getTwilioPhoneNumbers(clientId)
            
            if (result.success) {
                setPhoneNumbers(result.phoneNumbers || [])
            } else {
                setError(result.error || "Failed to fetch phone numbers")
                if (result.error === "Twilio credentials not configured") {
                    // This will be handled by the parent component
                    return
                }
                toast.error(result.error || "Failed to fetch phone numbers")
            }
        } catch (err) {
            const errorMessage = "An unexpected error occurred"
            setError(errorMessage)
            toast.error(errorMessage)
        } finally {
            setIsLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchPhoneNumbers()
    }, [clientId])

    const handleRefresh = () => {
        fetchPhoneNumbers(true)
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Phone Numbers
                    </CardTitle>
                    <CardDescription>Loading phone numbers for {clientName}...</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error === "Twilio credentials not configured") {
        return null // This will be handled by showing the setup component instead
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Phone Numbers
                        </CardTitle>
                        <CardDescription>
                            Twilio phone numbers for {clientName}
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        {isRefreshing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {error ? (
                    <div className="text-center py-8">
                        <p className="text-red-500 mb-4">{error}</p>
                        <Button onClick={handleRefresh} variant="outline">
                            Try Again
                        </Button>
                    </div>
                ) : phoneNumbers.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                            No phone numbers found in your Twilio account.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            You can purchase phone numbers from your Twilio Console.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {phoneNumbers.map((number) => (
                            <div
                                key={number.sid}
                                className="flex items-center justify-between p-3 border rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{number.phoneNumber}</p>
                                    {number.friendlyName && (
                                        <p className="text-sm text-muted-foreground">
                                            {number.friendlyName}
                                        </p>
                                    )}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    SID: {number.sid.substring(0, 10)}...
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
