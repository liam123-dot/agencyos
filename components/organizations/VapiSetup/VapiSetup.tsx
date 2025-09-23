'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { saveVapiKey, removeVapiKey, saveVapiPublishableKey, removeVapiPublishableKey } from "@/app/api/organizations/orgVapi"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"


export function VapiSetup({ vapiKeyExists, vapiPublishableKeyExists, organizationName }: { vapiKeyExists: boolean, vapiPublishableKeyExists: boolean, organizationName: string }) {

    const [hasVapiKey, setHasVapiKey] = useState(vapiKeyExists)
    const [vapiKey, setVapiKey] = useState('')
    const [isSaving, setIsSaving] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    
    const [hasVapiPublishableKey, setHasVapiPublishableKey] = useState(vapiPublishableKeyExists)
    const [vapiPublishableKey, setVapiPublishableKey] = useState('')
    const [isSavingPublishable, setIsSavingPublishable] = useState(false)
    const [isRemovingPublishable, setIsRemovingPublishable] = useState(false)

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

    const handleSaveVapiPublishableKey = async () => {
        setIsSavingPublishable(true)
        const { success, error } = await saveVapiPublishableKey(vapiPublishableKey)
        if (success) {
            setHasVapiPublishableKey(true)
            toast.success("Vapi publishable key saved successfully.")
        } else {
            toast.error(error)
        }
        setIsSavingPublishable(false)
    }

    const handleRemoveVapiPublishableKey = async () => {
        setIsRemovingPublishable(true)
        const { success, error } = await removeVapiPublishableKey()
        if (success) {
            setHasVapiPublishableKey(false)
            setVapiPublishableKey('')
            toast.success("Vapi publishable key removed successfully.")
        } else {
            toast.error(error)
        }
        setIsRemovingPublishable(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Vapi Integration</CardTitle>
                <CardDescription>
                    Connect your Vapi account to {organizationName} by providing your API keys.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* API Key Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium">API Key</h3>
                            <p className="text-xs text-muted-foreground">Server-side API key for backend integrations</p>
                        </div>
                        {hasVapiKey && (
                            <div className="flex items-center space-x-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-green-600 font-medium">Connected</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex space-x-2">
                        {!hasVapiKey && (
                            <Input
                                placeholder="Enter your Vapi API key"
                                value={vapiKey}
                                onChange={(e) => setVapiKey(e.target.value)}
                                disabled={isSaving}
                                className="flex-1"
                            />
                        )}
                        {hasVapiKey ? (
                            <Button variant="destructive" onClick={handleRemoveVapiKey} disabled={isRemoving} size="sm">
                                {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Remove API Key
                            </Button>
                        ) : (
                            <Button onClick={handleSaveVapiKey} disabled={isSaving || !vapiKey.trim()} size="sm">
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        )}
                    </div>
                </div>

                <div className="border-t pt-6">
                    {/* Publishable Key Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-medium">Publishable Key</h3>
                                <p className="text-xs text-muted-foreground">Client-side key for frontend integrations</p>
                            </div>
                            {hasVapiPublishableKey && (
                                <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-xs text-green-600 font-medium">Connected</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex space-x-2">
                            {!hasVapiPublishableKey && (
                                <Input
                                    placeholder="Enter your Vapi publishable key"
                                    value={vapiPublishableKey}
                                    onChange={(e) => setVapiPublishableKey(e.target.value)}
                                    disabled={isSavingPublishable}
                                    className="flex-1"
                                />
                            )}
                            {hasVapiPublishableKey ? (
                                <Button variant="destructive" onClick={handleRemoveVapiPublishableKey} disabled={isRemovingPublishable} size="sm">
                                    {isRemovingPublishable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Remove Publishable Key
                                </Button>
                            ) : (
                                <Button onClick={handleSaveVapiPublishableKey} disabled={isSavingPublishable || !vapiPublishableKey.trim()} size="sm">
                                    {isSavingPublishable && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function VapiSetupSkeleton() {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3 mt-2" />
            </CardHeader>
            <CardContent className="space-y-6">
                {/* API Key Section Skeleton */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <Skeleton className="h-9 flex-1" />
                        <Skeleton className="h-9 w-16" />
                    </div>
                </div>

                <div className="border-t pt-6">
                    {/* Publishable Key Section Skeleton */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-3 w-44" />
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Skeleton className="h-9 flex-1" />
                            <Skeleton className="h-9 w-16" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}