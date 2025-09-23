'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { saveStripeApiKey, removeStripeApiKey } from "@/app/api/organizations/orgStripe"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"


export function StripeSetup({ stripeApiKeyExists, organizationName }: { stripeApiKeyExists: boolean, organizationName: string }) {

    const [hasStripeApiKey, setHasStripeApiKey] = useState(stripeApiKeyExists)
    const [stripeApiKey, setStripeApiKey] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const handleSaveStripeApiKey = async () => {
        setIsSaving(true)
        const { success, error } = await saveStripeApiKey(stripeApiKey)
        if (success) {
            setHasStripeApiKey(true)
            toast.success("Stripe API key saved successfully.")
        } else {
            toast.error(error)
        }
        setIsSaving(false)
    }

    const handleRemoveStripeApiKey = async () => {
        setIsRemoving(true)
        const { success, error } = await removeStripeApiKey()
        if (success) {
            setHasStripeApiKey(false)
            setStripeApiKey('')
            toast.success("Stripe API key removed successfully.")
        } else {
            toast.error(error)
        }
        setIsRemoving(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Stripe Integration</CardTitle>
                <CardDescription>
                    {hasStripeApiKey
                        ? `Your Stripe account is connected to ${organizationName}.`
                        : `Connect your Stripe account to ${organizationName} by providing your API key.`}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {hasStripeApiKey ? (
                    <div className="flex items-center space-x-2">
                        <CheckCircle className="text-green-500" />
                        <p className="text-sm font-medium">Stripe API Key is set.</p>
                    </div>
                ) : (
                    <Input
                        placeholder="Enter your Stripe API key"
                        value={stripeApiKey}
                        onChange={(e) => setStripeApiKey(e.target.value)}
                        disabled={isSaving}
                    />
                )}
            </CardContent>
            <CardFooter>
                {hasStripeApiKey ? (
                    <Button variant="destructive" onClick={handleRemoveStripeApiKey} disabled={isRemoving}>
                        {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Remove Key
                    </Button>
                ) : (
                    <Button onClick={handleSaveStripeApiKey} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}

export function StripeSetupSkeleton() {
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

