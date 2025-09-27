'use client'

import { TransferCallTool, UpdateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useState } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function VapiTransferCallTool({ tool, onSave }: { tool: TransferCallTool, onSave: (toolData: UpdateVapiToolDto) => void }) {
    
    // Get the first destination for editing (assuming single destination for simplicity)
    const destination = tool.destinations[0] || {
        type: "number" as const,
        number: "",
        message: "",
        description: "",
        transferPlan: {
            mode: "warm-transfer-say-message",
            message: "",
            sipVerb: "refer"
        },
        numberE164CheckEnabled: true
    }

    const [name, setName] = useState(tool.function.name)
    const [description, setDescription] = useState(tool.function.description)
    const [transferNumber, setTransferNumber] = useState(destination.number || "")
    const [transferMessage, setTransferMessage] = useState(destination.message || "")
    const [transferDescription, setTransferDescription] = useState(destination.description || "")
    const [transferMode, setTransferMode] = useState<"warm-transfer-say-message" | "warm-transfer-say-summary" | "cold-transfer">(destination.transferPlan?.mode || "warm-transfer-say-message")
    const [transferPlanMessage, setTransferPlanMessage] = useState(destination.transferPlan?.message || "")
    const [numberE164CheckEnabled, setNumberE164CheckEnabled] = useState<boolean>(destination.numberE164CheckEnabled || true)
    
    // Summary plan state
    const [systemMessage, setSystemMessage] = useState(
        destination.transferPlan?.summaryPlan?.messages?.find(m => m.role === "system")?.content || "summary generation"
    )
    const [userMessageTemplate, setUserMessageTemplate] = useState(
        destination.transferPlan?.summaryPlan?.messages?.find(m => m.role === "user")?.content || "bey there"
    )
    const [summaryTimeout, setSummaryTimeout] = useState(destination.transferPlan?.summaryPlan?.timeoutSeconds || 5)
    
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        try {
            setSaving(true)
            
            const updatedTool = {
                function: {
                    name,
                    description
                },
                destinations: [{
                    type: "number" as const,
                    number: transferNumber,
                    message: transferMessage,
                    description: transferDescription,
                    transferPlan: {
                        mode: transferMode as "warm-transfer-say-message" | "warm-transfer-say-summary" | "cold-transfer",
                        ...(transferMode === "warm-transfer-say-message" ? { message: transferPlanMessage } : {}),
                        sipVerb: "refer",
                        ...(transferMode === "warm-transfer-say-summary" ? {
                            summaryPlan: {
                                enabled: true,
                                messages: [
                                    { role: "system", content: systemMessage },
                                    { role: "user", content: userMessageTemplate }
                                ],
                                timeoutSeconds: summaryTimeout,
                                useAssistantLlm: true
                            }
                        } : {})
                    },
                    numberE164CheckEnabled
                }]
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

    const isFormValid = name.trim() && description.trim() && transferNumber.trim() && transferMessage.trim()
    const isFormDisabled = saving

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Transfer Call Tool</CardTitle>
                <CardDescription>
                    Redirect calls to another number
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertDescription>
                        Set the destination number and what the caller hears before transfer. Choose warm transfer to introduce the call or cold transfer to connect immediately.
                    </AlertDescription>
                </Alert>

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

                <div className="space-y-2">
                    <Label htmlFor="transfer-number">Transfer To Number</Label>
                    <Input
                        id="transfer-number"
                        value={transferNumber}
                        onChange={(e) => setTransferNumber(e.target.value)}
                        placeholder="Enter phone number to transfer to (e.g., +1234567890)"
                        disabled={isFormDisabled}
                    />
                    <p className="text-xs text-muted-foreground">Use E.164 format for best compatibility.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="transfer-message">Transfer Message</Label>
                    <Input
                        id="transfer-message"
                        value={transferMessage}
                        onChange={(e) => setTransferMessage(e.target.value)}
                        placeholder="Message to play before transferring (e.g., Please wait while I transfer you)"
                        disabled={isFormDisabled}
                    />
                    <p className="text-xs text-muted-foreground">What the caller hears before the transfer begins.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="transfer-description">Transfer Description</Label>
                    <Textarea
                        id="transfer-description"
                        value={transferDescription}
                        onChange={(e) => setTransferDescription(e.target.value)}
                        placeholder="Describe when to use this transfer (e.g., If the user asks to be transferred)"
                        disabled={isFormDisabled}
                        rows={2}
                    />
                </div>

                <div className="space-y-3">
                    <Label>Transfer Mode</Label>
                    <div className="grid grid-cols-1 gap-3">
                        <div className={`border rounded-lg p-3 cursor-pointer transition-all ${transferMode === 'cold-transfer' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`} 
                             onClick={() => setTransferMode('cold-transfer')}>
                            <div className="flex items-start gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${transferMode === 'cold-transfer' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                    {transferMode === 'cold-transfer' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Instant Transfer</div>
                                    <div className="text-xs text-muted-foreground">Connect immediately without introduction</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`border rounded-lg p-3 cursor-pointer transition-all ${transferMode === 'warm-transfer-say-message' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`} 
                             onClick={() => setTransferMode('warm-transfer-say-message')}>
                            <div className="flex items-start gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${transferMode === 'warm-transfer-say-message' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                    {transferMode === 'warm-transfer-say-message' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Warm Transfer</div>
                                    <div className="text-xs text-muted-foreground">Introduce the caller with a custom message</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`border rounded-lg p-3 cursor-pointer transition-all ${transferMode === 'warm-transfer-say-summary' ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}`} 
                             onClick={() => setTransferMode('warm-transfer-say-summary')}>
                            <div className="flex items-start gap-3">
                                <div className={`w-4 h-4 rounded-full border-2 mt-0.5 ${transferMode === 'warm-transfer-say-summary' ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                                    {transferMode === 'warm-transfer-say-summary' && <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>}
                                </div>
                                <div>
                                    <div className="font-medium text-sm">Smart Transfer</div>
                                    <div className="text-xs text-muted-foreground">AI summarizes the conversation before transfer</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {transferMode === "warm-transfer-say-message" && (
                    <div className="space-y-2">
                        <Label htmlFor="transfer-plan-message">Transfer Plan Message</Label>
                        <Input
                            id="transfer-plan-message"
                            value={transferPlanMessage}
                            onChange={(e) => setTransferPlanMessage(e.target.value)}
                            placeholder="Internal transfer message"
                            disabled={isFormDisabled}
                        />
                        <p className="text-xs text-muted-foreground">A brief message to introduce the caller to the recipient.</p>
                    </div>
                )}

                {transferMode === "warm-transfer-say-summary" && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-muted-foreground">Summary Messages</h4>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="system-message">System Message</Label>
                                        <Textarea
                                            id="system-message"
                                            value={systemMessage}
                                            onChange={(e) => setSystemMessage(e.target.value)}
                                            placeholder="Instructions for AI model on how to summarize the call"
                                            disabled={isFormDisabled}
                                            rows={3}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This guides the AI on how to create the summary but is not spoken to the recipient.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="user-message-template">User Message Template</Label>
                                        <Textarea
                                            id="user-message-template"
                                            value={userMessageTemplate}
                                            onChange={(e) => setUserMessageTemplate(e.target.value)}
                                            placeholder="Template for the content to be summarized (e.g., transcript data)"
                                            disabled={isFormDisabled}
                                            rows={3}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            This provides the actual content for the AI to summarize. Use placeholders like {"{{transcript}}"} for dynamic content.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="summary-timeout">Timeout (seconds)</Label>
                                        <Input
                                            id="summary-timeout"
                                            type="number"
                                            value={summaryTimeout}
                                            onChange={(e) => setSummaryTimeout(parseInt(e.target.value) || 5)}
                                            placeholder="5"
                                            disabled={isFormDisabled}
                                            min="1"
                                            max="300"
                                        />
                                    </div>
                                </div>
                )}

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="e164-check"
                        checked={numberE164CheckEnabled}
                        onCheckedChange={(checked) => setNumberE164CheckEnabled(!!checked)}
                        disabled={isFormDisabled}
                    />
                    <Label htmlFor="e164-check" className="text-sm font-normal">
                        Enable E.164 number format validation
                    </Label>
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