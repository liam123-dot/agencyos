'use client'

import { useMemo } from "react"
import { CreateVapiToolDto, VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, XCircle } from "lucide-react"
import { ToolCell } from "../ToolTypes/ToolCell"
import { ToolType } from "../hooks/useToolsNavigation"
import { ExternalAppToolCreate } from "../ExternalAppTool"
import { createExternalAppTool } from "@/app/api/agents/tools/createExternalAppTool"
import { toast } from "sonner"

interface ToolCreateViewProps {
    selectedToolType: ToolType
    clientId: string
    agentId: string
    onBack: () => void
    onToolCreated: (tool: VapiTool) => void
    isCreating: boolean
}

export function ToolCreateView({ 
    selectedToolType, 
    clientId,
    agentId,
    onBack, 
    onToolCreated,
    isCreating 
}: ToolCreateViewProps) {

    const handleSave = async (toolData: any) => {
        // For external app tools, call the server action first
        if (selectedToolType === 'externalApp') {
            try {
                const result = await createExternalAppTool(toolData, agentId, clientId)
                if (result.success) {
                    toast.success('Tool data logged successfully! Check your console.')
                    console.log('Server response:', result)
                    // Don't call onToolCreated yet - stay on the same screen
                    return
                }
            } catch (error) {
                toast.error('Failed to process tool data')
                console.error('Error:', error)
                return
            }
        }
        
        // Convert the update format to create format for other tool types
        const createData = convertToCreateFormat(selectedToolType, toolData)
        await onToolCreated(createData as VapiTool)
    }

    // Only create mock tool for non-external app types
    const mockTool = useMemo(() => {
        if (selectedToolType === 'externalApp') {
            return null
        }
        return createMockTool(selectedToolType)
    }, [selectedToolType])

    const toolTypeLabel = useMemo(() => {
        switch (selectedToolType) {
            case 'transferCall':
                return 'Transfer Call'
            case 'apiRequest':
                return 'API Request'
            case 'sms':
                return 'SMS'
            case 'externalApp':
                return 'External App'
            default:
                return 'Tool'
        }
    }, [selectedToolType])

    const toolTypeSummary = useMemo(() => {
        switch (selectedToolType) {
            case 'transferCall':
                return 'Help the agent seamlessly hand off a caller to a teammate or number you specify.'
            case 'apiRequest':
                return 'Let the agent call an HTTP endpoint during a conversation to sync or fetch data.'
            case 'sms':
                return 'Allow the agent to text the caller with links, confirmations, or next steps.'
            case 'externalApp':
                return 'Connect your agent to external apps like Google, Slack, GitHub, and more.'
            default:
                return ''
        }
    }, [selectedToolType])

    // For external app, use the custom component
    if (selectedToolType === 'externalApp') {
        return (
            <div className="space-y-6">
                <header className="space-y-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onBack}
                        className="flex items-center gap-2 px-0 text-muted-foreground hover:text-foreground -ml-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to tools
                    </Button>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-semibold">Create External App Tool</h1>
                        <Badge variant="outline" className="text-xs">
                            {toolTypeLabel}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Connect your agent to external apps like Google, Slack, GitHub, and more.
                    </p>
                </header>

                <ExternalAppToolCreate
                    clientId={clientId}
                    agentId={agentId}
                    onAppSelected={(app) => {
                        console.log('App selected:', app)
                    }}
                    onAccountSelected={(accountId) => {
                        console.log('Account selected:', accountId)
                    }}
                    onActionSelected={(action) => {
                        console.log('Action selected:', action)
                    }}
                    onToolCreated={(tool) => {
                        console.log('Tool created:', tool)
                        toast.success('External app tool created successfully!')
                        onBack()
                    }}
                />
            </div>
        )
    }

    // For other tool types, use the standard ToolCell component
    return (
        <div className="space-y-8">
            <header className="space-y-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2 px-0 text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to all tools
                </Button>
                <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-semibold">Create a new tool</h1>
                    <Badge variant="outline" className="text-xs uppercase tracking-wide">
                        {toolTypeLabel}
                    </Badge>
                </div>
                <p className="max-w-xl text-sm text-muted-foreground">
                    Fill in the details your agent will rely on. Once saved, it will appear in the tools list right away.
                </p>
                {toolTypeSummary && (
                    <div className="mt-2 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                        {toolTypeSummary}
                    </div>
                )}
            </header>

            {mockTool && (
                <ToolCell 
                    tool={mockTool} 
                    onSave={handleSave}
                    isCreateMode={true}
                />
            )}

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                    variant="outline"
                    onClick={onBack}
                    disabled={isCreating}
                    className="flex items-center gap-2"
                >
                    <XCircle className="h-4 w-4" />
                    Cancel
                </Button>
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
        case 'externalApp':
            // For external app, the data is already in the right format from ExternalAppToolCreate
            // We'll need to transform this into an API request that calls Pipedream
            // For now, just pass through - actual implementation will depend on how you want to structure it
            return updateData as any
        default:
            throw new Error(`Unknown tool type: ${toolType}`)
    }
}
