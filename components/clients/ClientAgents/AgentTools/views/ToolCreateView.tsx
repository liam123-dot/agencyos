'use client'

import { useState } from "react"
import { CreateVapiToolDto, VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ToolCell } from "../ToolTypes/ToolCell"
import { ToolType } from "../hooks/useToolsNavigation"

interface ToolCreateViewProps {
    selectedToolType: ToolType
    onToolTypeChange: (toolType: ToolType) => void
    onBack: () => void
    onToolCreated: (tool: VapiTool) => void
    isCreating: boolean
}

export function ToolCreateView({ 
    selectedToolType, 
    onToolTypeChange, 
    onBack, 
    onToolCreated,
    isCreating 
}: ToolCreateViewProps) {

    const handleSave = async (toolData: any) => {
        // Convert the update format to create format
        const createData = convertToCreateFormat(selectedToolType, toolData)
        await onToolCreated(createData as VapiTool)
    }

    // Create a mock tool object for the creation form
    const mockTool = createMockTool(selectedToolType)

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tools
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Create New Tool</h1>
                    <p className="text-muted-foreground">
                        Choose a tool type and configure it for your agent
                    </p>
                </div>
            </div>

            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="rounded-full">1</Badge>
                        <span className="text-sm font-medium">Select tool type</span>
                        <span className="text-muted-foreground">→</span>
                        <Badge variant="outline" className="rounded-full">2</Badge>
                        <span className="text-sm">Configure details</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Select Tool Type</CardTitle>
                    <CardDescription>
                        Choose the type of tool you want to create
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="tool-type">Tool Type</Label>
                        <Select value={selectedToolType} onValueChange={(value) => onToolTypeChange(value as ToolType)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="transferCall">
                                    <div className="flex items-center gap-2">
                                        <span>📞</span>
                                        <span>Transfer Call - Transfer calls to another number</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="apiRequest">
                                    <div className="flex items-center gap-2">
                                        <span>🌐</span>
                                        <span>API Request - Make HTTP requests to external APIs</span>
                                    </div>
                                </SelectItem>
                                <SelectItem value="sms">
                                    <div className="flex items-center gap-2">
                                        <span>💬</span>
                                        <span>SMS - Send text messages during calls</span>
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="text-sm text-muted-foreground">
                        {selectedToolType === 'transferCall' && (
                            <p>Use when your agent should seamlessly connect a caller to a human or another number.</p>
                        )}
                        {selectedToolType === 'apiRequest' && (
                            <p>Use to fetch or send data to your systems during a conversation.</p>
                        )}
                        {selectedToolType === 'sms' && (
                            <p>Use to send a follow-up text with links, summaries, or confirmations.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Render the appropriate tool creation form */}
            <div className="space-y-4">
                <ToolCell 
                    tool={mockTool} 
                    onSave={handleSave}
                    isCreateMode={true}
                />
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        disabled={isCreating}
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    )
}

function createMockTool(toolType: ToolType): VapiTool {
    const baseProps = {
        id: 'new',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        orgId: '',
        function: {
            name: '',
            description: ''
        },
        messages: []
    }

    switch (toolType) {
        case 'transferCall':
            return {
                ...baseProps,
                type: 'transferCall',
                destinations: [{
                    type: 'number',
                    number: '',
                    message: '',
                    description: '',
                    transferPlan: {
                        mode: 'warm-transfer-say-message',
                        message: '',
                        sipVerb: 'refer'
                    },
                    numberE164CheckEnabled: true
                }]
            }
        case 'apiRequest':
            return {
                ...baseProps,
                type: 'apiRequest',
                name: '',
                url: '',
                method: 'GET',
                variableExtractionPlan: {
                    schema: {
                        type: 'object',
                        required: [],
                        properties: {}
                    },
                    aliases: []
                }
            }
        case 'sms':
            return {
                ...baseProps,
                type: 'sms',
                metadata: {
                    from: ''
                }
            }
        default:
            throw new Error(`Unknown tool type: ${toolType}`)
    }
}

function convertToCreateFormat(toolType: ToolType, updateData: any): CreateVapiToolDto {
    const baseCreateData = {
        function: updateData.function,
        messages: updateData.messages || []
    }

    switch (toolType) {
        case 'transferCall':
            return {
                ...baseCreateData,
                type: 'transferCall',
                destinations: updateData.destinations
            }
        case 'apiRequest':
            return {
                ...baseCreateData,
                type: 'apiRequest',
                name: updateData.name,
                url: updateData.url,
                method: updateData.method,
                headers: updateData.headers,
                body: updateData.body,
                variableExtractionPlan: updateData.variableExtractionPlan
            }
        case 'sms':
            return {
                ...baseCreateData,
                type: 'sms',
                metadata: updateData.metadata
            }
        default:
            throw new Error(`Unknown tool type: ${toolType}`)
    }
}
