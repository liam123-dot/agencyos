'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { saveVapiKey, removeVapiKey } from "@/app/api/organizations/orgVapi"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"


export function VapiSetup({ vapiKeyExists, organizationName }: { vapiKeyExists: boolean, organizationName: string }) {

    const [hasVapiKey, setHasVapiKey] = useState(vapiKeyExists)
    const [vapiKey, setVapiKey] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const handleSaveVapiKey = async () => {
        setIsSaving(true)
        const { success, error } = await saveVapiKey(vapiKey)
        if (success) {
            setHasVapiKey(true)
            toast.success("Vapi API key saved successfully.")
        } else {
            toast.error(error)
        }
        setIsSaving(false)
    }

    const handleRemoveVapiKey = async () => {
        setIsRemoving(true)
        const { success, error } = await removeVapiKey()
        if (success) {
            setHasVapiKey(false)
            setVapiKey('')
            toast.success("Vapi API key removed successfully.")
        } else {
            toast.error(error)
        }
        setIsRemoving(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vapi Integration</CardTitle>
                <CardDescription>
                    {hasVapiKey
                        ? `Your Vapi account is connected to ${organizationName}.`
                        : `Connect your Vapi account to ${organizationName} by providing your API key.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {hasVapiKey ? (
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="text-green-500" />
                        <p className="text-sm font-medium">Vapi API Key is set.</p>
                    </div>
                ) : (
                    <Input
                        placeholder="Enter your Vapi API key"
                        value={vapiKey}
                        onChange={(e) => setVapiKey(e.target.value)}
                        disabled={isSaving}
                    />
                )}
            </CardContent>
            <CardFooter>
                {hasVapiKey ? (
                    <Button variant="destructive" onClick={handleRemoveVapiKey} disabled={isRemoving}>
                        {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Remove Key
                    </Button>
                ) : (
                    <Button onClick={handleSaveVapiKey} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

export function VapiSetupSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-3/4 mt-2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-10 w-full" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-10 w-24" />
            </CardFooter>
        </Card>
    )
}