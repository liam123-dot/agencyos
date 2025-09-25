'use client'

import { SmsTool, UpdateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getPhoneNumbers } from "@/app/api/phone-numbers/getPhoneNumbers"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface PhoneNumber {
    id: string
    phone_number: string
    source?: string
}

export function VapiSmsToolCall({ tool, onSave }: { tool: SmsTool, onSave: (toolData: UpdateVapiToolDto) => void }) {
    const searchParams = useSearchParams()
    const clientId = searchParams.get('client_id')
    
    const [name, setName] = useState(tool.function.name)
    const [description, setDescription] = useState(tool.function.description)
    const [from, setFrom] = useState(tool.metadata.from)
    const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPhoneNumbers = async () => {
            try {
                setLoading(true)
                setError(null)
                
                const result = await getPhoneNumbers(clientId || undefined)
                
                if (result.success) {
                    setPhoneNumbers(result.phoneNumbers || [])
                } else {
                    throw new Error(result.error || "Failed to fetch phone numbers")
                }
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchPhoneNumbers()
    }, [clientId])

    const handleSave = async () => {
        try {
            setSaving(true)
            
            const updatedTool = {
                function: {
                    name,
                    description
                },
                metadata: {
                    from
                }
            }
            
            await onSave(updatedTool)
            
            toast.success("SMS tool configuration saved successfully!", {
                description: "Your changes have been applied to the agent."
            })
            
        } catch (error) {
            console.error('Error saving tool:', error)
            toast.error("Failed to save configuration", {
                description: "Please try again or contact support if the issue persists."
            })
        } finally {
            setSaving(false)
        }
    }

    const isFormValid = name.trim() && description.trim() && from
    const isFormDisabled = loading || saving

    if (loading) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>SMS Tool Configuration</CardTitle>
                <CardDescription>
                    Configure your SMS tool to send text messages during calls
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-700">{error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="tool-name">Tool Name</Label>
                    <Input
                        id="tool-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter tool name (e.g., Send SMS)"
                        disabled={isFormDisabled}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="tool-description">Description</Label>
                    <Input
                        id="tool-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what this tool does"
                        disabled={isFormDisabled}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="from-number">From Phone Number</Label>
                    <Select value={from} onValueChange={setFrom} disabled={isFormDisabled}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a phone number" />
                        </SelectTrigger>
                        <SelectContent>
                            {phoneNumbers.length === 0 ? (
                                <SelectItem value="" disabled>
                                    No phone numbers available
                                </SelectItem>
                            ) : (
                                    phoneNumbers.map((phoneNumber) => (
                                        <SelectItem key={phoneNumber.id} value={phoneNumber.phone_number}>
                                            {phoneNumber.phone_number}
                                        </SelectItem>
                                    ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <Button 
                    onClick={handleSave} 
                    disabled={!isFormValid || isFormDisabled}
                    className="w-full"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Configuration...
                        </>
                    ) : (
                        'Save SMS Tool Configuration'
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}