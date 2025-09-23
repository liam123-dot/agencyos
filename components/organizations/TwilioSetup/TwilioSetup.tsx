'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { saveTwilioCredentials, removeTwilioCredentials } from "@/app/api/clients/twilioCredentials"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Label } from "@/components/ui/label"

interface TwilioSetupProps {
    twilioCredentialsExist: boolean;
    clientName: string;
    clientId: string;
}

export function TwilioSetup({ twilioCredentialsExist, clientName, clientId }: TwilioSetupProps) {
    const [hasTwilioCredentials, setHasTwilioCredentials] = useState(twilioCredentialsExist)
    const [accountSid, setAccountSid] = useState('')
    const [authToken, setAuthToken] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const handleSaveTwilioCredentials = async () => {
        if (!accountSid.trim() || !authToken.trim()) {
            toast.error("Please provide both Account SID and Auth Token")
            return
        }

        setIsSaving(true)
        const { success, error } = await saveTwilioCredentials(accountSid.trim(), authToken.trim(), clientId)
        if (success) {
            setHasTwilioCredentials(true)
            setAccountSid('')
            setAuthToken('')
            toast.success("Twilio credentials saved successfully.")
        } else {
            toast.error(error || "Failed to save Twilio credentials")
        }
        setIsSaving(false)
    }

    const handleRemoveTwilioCredentials = async () => {
        setIsRemoving(true)
        const { success, error } = await removeTwilioCredentials(clientId)
        if (success) {
            setHasTwilioCredentials(false)
            setAccountSid('')
            setAuthToken('')
            toast.success("Twilio credentials removed successfully.")
        } else {
            toast.error(error || "Failed to remove Twilio credentials")
        }
        setIsRemoving(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Twilio Integration</CardTitle>
                <CardDescription>
                    {hasTwilioCredentials
                        ? `Twilio account is connected to ${clientName}.`
                        : `Connect your Twilio account to ${clientName} by providing your Account SID and Auth Token.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {hasTwilioCredentials ? (
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="text-green-500" />
                        <p className="text-sm font-medium">Twilio credentials are configured.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="accountSid">Account SID</Label>
                            <Input
                                id="accountSid"
                                placeholder="Enter your Twilio Account SID (starts with AC)"
                                value={accountSid}
                                onChange={(e) => setAccountSid(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="authToken">Auth Token</Label>
                            <Input
                                id="authToken"
                                type="password"
                                placeholder="Enter your Twilio Auth Token"
                                value={authToken}
                                onChange={(e) => setAuthToken(e.target.value)}
                                disabled={isSaving}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <p>You can find your Account SID and Auth Token in your Twilio Console under Account Settings.</p>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                {hasTwilioCredentials ? (
                    <Button variant="destructive" onClick={handleRemoveTwilioCredentials} disabled={isRemoving}>
                        {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Remove Credentials
                    </Button>
                ) : (
                    <Button onClick={handleSaveTwilioCredentials} disabled={isSaving || !accountSid.trim() || !authToken.trim()}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Credentials
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

export function TwilioSetupSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-32" />
            </CardFooter>
        </Card>
    )
}
