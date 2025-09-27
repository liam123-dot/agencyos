'use client'

import { TransferCallTool, UpdateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { Loader2, AlertCircle, Plus, Trash2, Phone } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Define the destination type for better type safety
interface DestinationState {
    type: "number" | "assistant" | "sip"
    number?: string
    message?: string
    description?: string
    transferPlan?: {
        mode: "warm-transfer-say-message" | "warm-transfer-say-summary" | "cold-transfer" | "blind-transfer"
        message?: string
        sipVerb?: string
        summaryPlan?: {
            enabled: boolean
            messages: Array<{
                role: string
                content: string
            }>
            timeoutSeconds: number
            useAssistantLlm: boolean
        }
    }
    numberE164CheckEnabled?: boolean
}

export function VapiTransferCallTool({ tool, onSave }: { tool: TransferCallTool, onSave: (toolData: UpdateVapiToolDto) => void }) {
    
    const [name, setName] = useState(tool.function.name)
    const [description, setDescription] = useState(tool.function.description)
    const [destinations, setDestinations] = useState<DestinationState[]>(() => {
        if (tool.destinations && tool.destinations.length > 0) {
            return tool.destinations.map(dest => ({
                type: dest.type,
                number: dest.number || "",
                message: dest.message || "",
                description: dest.description || "",
                transferPlan: dest.transferPlan ? {
                    mode: dest.transferPlan.mode,
                    message: dest.transferPlan.message,
                    sipVerb: dest.transferPlan.sipVerb || "refer",
                    summaryPlan: dest.transferPlan.summaryPlan
                } : {
                    mode: "warm-transfer-say-message",
                    sipVerb: "refer"
                },
                numberE164CheckEnabled: dest.numberE164CheckEnabled ?? true
            }))
        }
        // Default single destination for new tools
        return [{
            type: "number",
            number: "",
            message: "",
            description: "",
            transferPlan: {
                mode: "warm-transfer-say-message",
                sipVerb: "refer"
            },
            numberE164CheckEnabled: true
        }]
    })
    
    const [saving, setSaving] = useState(false)
    const [openAccordionItems, setOpenAccordionItems] = useState<string[]>([]) // Start with all closed

    // Helper functions for managing destinations
    const addDestination = () => {
        const newIndex = destinations.length
        setDestinations(prev => [...prev, {
            type: "number",
            number: "",
            message: "",
            description: "",
            transferPlan: {
                mode: "warm-transfer-say-message",
                sipVerb: "refer"
            },
            numberE164CheckEnabled: true
        }])
        // Open the new destination accordion
        setOpenAccordionItems(prev => [...prev, `destination-${newIndex}`])
    }

    const removeDestination = (index: number) => {
        if (destinations.length > 1) {
            setDestinations(prev => prev.filter((_, i) => i !== index))
            // Remove the accordion item and update the remaining ones
            setOpenAccordionItems(prev => {
                const filtered = prev.filter(item => item !== `destination-${index}`)
                // Update indices for remaining items
                return filtered.map(item => {
                    const itemIndex = parseInt(item.split('-')[1])
                    return itemIndex > index ? `destination-${itemIndex - 1}` : item
                })
            })
        }
    }

    const updateDestination = (index: number, updates: Partial<DestinationState>) => {
        setDestinations(prev => prev.map((dest, i) => 
            i === index ? { ...dest, ...updates } : dest
        ))
    }

    const updateDestinationTransferPlan = (index: number, updates: Partial<DestinationState['transferPlan']>) => {
        setDestinations(prev => prev.map((dest, i) => 
            i === index ? { 
                ...dest, 
                transferPlan: { 
                    mode: "warm-transfer-say-message",
                    sipVerb: "refer",
                    ...dest.transferPlan, 
                    ...updates 
                }
            } : dest
        ))
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            
            // Convert destinations to the format expected by the API
            const formattedDestinations = destinations.map(dest => ({
                type: dest.type,
                number: dest.number,
                message: dest.message,
                description: dest.description,
                transferPlan: {
                    mode: dest.transferPlan?.mode || "warm-transfer-say-message",
                    ...(dest.transferPlan?.message ? { message: dest.transferPlan.message } : {}),
                    sipVerb: dest.transferPlan?.sipVerb || "refer",
                    ...(dest.transferPlan?.summaryPlan ? { summaryPlan: dest.transferPlan.summaryPlan } : {})
                },
                numberE164CheckEnabled: dest.numberE164CheckEnabled
            }))
            
            const updatedTool = {
                function: {
                    name,
                    description
                },
                destinations: formattedDestinations
            }
            
            await onSave(updatedTool)
            
            toast.success("Transfer call tool configuration saved successfully!", {
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

    const isFormValid = name.trim() && description.trim() && destinations.every(dest => 
        dest.number?.trim() && dest.message?.trim()
    )
    const isFormDisabled = saving

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Transfer Call Tool</CardTitle>
                <CardDescription>
                    Redirect calls to one or more destination numbers
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertDescription>
                        Configure multiple transfer destinations. Each destination can have its own transfer mode and settings.
                    </AlertDescription>
                </Alert>

                {/* Tool Basic Information */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tool-name">Tool Name</Label>
                        <Input
                            id="tool-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter tool name (e.g., Transfer Call)"
                            disabled={isFormDisabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tool-description">Tool Description</Label>
                        <Textarea
                            id="tool-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe when this tool should be used"
                            disabled={isFormDisabled}
                            rows={2}
                        />
                        <p className="text-xs text-muted-foreground">Explain when the agent should transfer a caller.</p>
                    </div>
                </div>

                <Separator />

                {/* Destinations Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Transfer Destinations</h3>
                            <p className="text-sm text-muted-foreground">Configure where calls can be transferred</p>
                        </div>
                        <Button
                            onClick={addDestination}
                            variant="outline"
                            size="sm"
                            disabled={isFormDisabled}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Destination
                        </Button>
                    </div>

                    <Accordion 
                        type="multiple" 
                        value={openAccordionItems} 
                        onValueChange={setOpenAccordionItems}
                        className="space-y-2"
                    >
                        {destinations.map((destination, index) => (
                            <AccordionItem key={index} value={`destination-${index}`} className="border rounded-lg">
                                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                    <div className="flex items-center justify-between w-full mr-4">
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4" />
                                            <span className="text-base font-medium">
                                                Destination {index + 1}
                                            </span>
                                            {destination.number && (
                                                <Badge variant="outline" className="text-xs">
                                                    {destination.number}
                                                </Badge>
                                            )}
                                            {destination.transferPlan?.mode && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {destination.transferPlan.mode === 'blind-transfer' && 'Blind'}
                                                    {destination.transferPlan.mode === 'cold-transfer' && 'Cold'}
                                                    {destination.transferPlan.mode === 'warm-transfer-say-message' && 'Warm'}
                                                    {destination.transferPlan.mode === 'warm-transfer-say-summary' && 'Smart'}
                                                </Badge>
                                            )}
                                        </div>
                                        {destinations.length > 1 && (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    removeDestination(index)
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                disabled={isFormDisabled}
                                                className="text-destructive hover:text-destructive mr-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="px-4 pb-4">
                                    <div className="space-y-4">
                                {/* Phone Number */}
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        value={destination.number || ""}
                                        onChange={(e) => updateDestination(index, { number: e.target.value })}
                                        placeholder="Enter phone number (e.g., +1234567890)"
                                        disabled={isFormDisabled}
                                    />
                                    <p className="text-xs text-muted-foreground">Use E.164 format for best compatibility.</p>
                                </div>

                                {/* Transfer Message */}
                                <div className="space-y-2">
                                    <Label>Transfer Message</Label>
                                    <Input
                                        value={destination.message || ""}
                                        onChange={(e) => updateDestination(index, { message: e.target.value })}
                                        placeholder="Message to play before transferring"
                                        disabled={isFormDisabled}
                                    />
                                    <p className="text-xs text-muted-foreground">What the caller hears before the transfer begins.</p>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        value={destination.description || ""}
                                        onChange={(e) => updateDestination(index, { description: e.target.value })}
                                        placeholder="When to use this destination"
                                        disabled={isFormDisabled}
                                        rows={2}
                                    />
                                </div>

                                {/* Transfer Mode */}
                                <div className="space-y-3">
                                    <Label>Transfer Mode</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { value: 'blind-transfer', title: 'Blind Transfer', description: 'Transfer immediately without any interaction' },
                                            { value: 'cold-transfer', title: 'Cold Transfer', description: 'Connect immediately without introduction' },
                                            { value: 'warm-transfer-say-message', title: 'Warm Transfer', description: 'Introduce the caller with a custom message' },
                                            { value: 'warm-transfer-say-summary', title: 'Smart Transfer', description: 'AI summarizes the conversation before transfer' }
                                        ].map((mode) => (
                                            <div 
                                                key={mode.value}
                                                className={`border rounded-lg p-3 cursor-pointer transition-all ${
                                                    destination.transferPlan?.mode === mode.value 
                                                        ? 'border-primary bg-primary/5' 
                                                        : 'border-border hover:border-border/80'
                                                }`}
                                                onClick={() => updateDestinationTransferPlan(index, { mode: mode.value as any })}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${
                                                        destination.transferPlan?.mode === mode.value 
                                                            ? 'border-primary bg-primary' 
                                                            : 'border-muted-foreground'
                                                    }`}>
                                                        {destination.transferPlan?.mode === mode.value && (
                                                            <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-sm">{mode.title}</div>
                                                        <div className="text-xs text-muted-foreground">{mode.description}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Conditional fields based on transfer mode */}
                                {destination.transferPlan?.mode === "warm-transfer-say-message" && (
                                    <div className="space-y-2">
                                        <Label>Transfer Plan Message</Label>
                                        <Input
                                            value={destination.transferPlan?.message || ""}
                                            onChange={(e) => updateDestinationTransferPlan(index, { message: e.target.value })}
                                            placeholder="Internal transfer message"
                                            disabled={isFormDisabled}
                                        />
                                        <p className="text-xs text-muted-foreground">A brief message to introduce the caller to the recipient.</p>
                                    </div>
                                )}

                                {destination.transferPlan?.mode === "warm-transfer-say-summary" && (
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-medium text-muted-foreground">Summary Configuration</h4>
                                        
                                        <div className="space-y-2">
                                            <Label>System Message</Label>
                                            <Textarea
                                                value={destination.transferPlan?.summaryPlan?.messages?.find(m => m.role === "system")?.content || "You must effectively summarise the transcript"}
                                                onChange={(e) => {
                                                    const currentMessages = destination.transferPlan?.summaryPlan?.messages || []
                                                    const otherMessages = currentMessages.filter(m => m.role !== "system")
                                                    const newMessages = [
                                                        { role: "system", content: e.target.value },
                                                        ...otherMessages
                                                    ]
                                                    updateDestinationTransferPlan(index, {
                                                        summaryPlan: {
                                                            enabled: true,
                                                            messages: newMessages,
                                                            timeoutSeconds: destination.transferPlan?.summaryPlan?.timeoutSeconds || 5,
                                                            useAssistantLlm: true
                                                        }
                                                    })
                                                }}
                                                placeholder="Instructions for AI model on how to summarize the call"
                                                disabled={isFormDisabled}
                                                rows={3}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label>User Message Template</Label>
                                            <Textarea
                                                value={destination.transferPlan?.summaryPlan?.messages?.find(m => m.role === "user")?.content || "Look at the transcript below and just summarise their name and what they are interested in: \n\n{{transcript}}"}
                                                onChange={(e) => {
                                                    const currentMessages = destination.transferPlan?.summaryPlan?.messages || []
                                                    const otherMessages = currentMessages.filter(m => m.role !== "user")
                                                    const newMessages = [
                                                        ...otherMessages,
                                                        { role: "user", content: e.target.value }
                                                    ]
                                                    updateDestinationTransferPlan(index, {
                                                        summaryPlan: {
                                                            enabled: true,
                                                            messages: newMessages,
                                                            timeoutSeconds: destination.transferPlan?.summaryPlan?.timeoutSeconds || 5,
                                                            useAssistantLlm: true
                                                        }
                                                    })
                                                }}
                                                placeholder="Template for the content to be summarized"
                                                disabled={isFormDisabled}
                                                rows={3}
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Use placeholders like {"{{transcript}}"} for dynamic content.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Timeout (seconds)</Label>
                                            <Input
                                                type="number"
                                                value={destination.transferPlan?.summaryPlan?.timeoutSeconds || 5}
                                                onChange={(e) => updateDestinationTransferPlan(index, {
                                                    summaryPlan: {
                                                        enabled: true,
                                                        messages: destination.transferPlan?.summaryPlan?.messages || [],
                                                        timeoutSeconds: parseInt(e.target.value) || 5,
                                                        useAssistantLlm: true
                                                    }
                                                })}
                                                placeholder="5"
                                                disabled={isFormDisabled}
                                                min="1"
                                                max="300"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* E164 Check */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={destination.numberE164CheckEnabled ?? true}
                                        onCheckedChange={(checked) => updateDestination(index, { numberE164CheckEnabled: !!checked })}
                                        disabled={isFormDisabled}
                                    />
                                    <Label className="text-sm font-normal">
                                        Enable E.164 number format validation
                                    </Label>
                                </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
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
                        'Save Transfer Call Configuration'
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}