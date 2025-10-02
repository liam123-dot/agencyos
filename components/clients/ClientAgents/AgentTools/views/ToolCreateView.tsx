'use client'

import { useMemo } from "react"
import { CreateVapiToolDto, VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, XCircle } from "lucide-react"
import { ToolCell } from "../ToolTypes/ToolCell"
import { ToolType } from "../hooks/useToolsNavigation"

interface ToolCreateViewProps {
    selectedToolType: ToolType
    onBack: () => void
    onToolCreated: (tool: VapiTool) => void
    isCreating: boolean
}

export function ToolCreateView({ 
    selectedToolType, 
    onBack, 
    onToolCreated,
    isCreating 
}: ToolCreateViewProps) {

    const handleSave = async (toolData: any) => {
        // Convert the update format to create format
        const createData = convertToCreateFormat(selectedToolType, toolData)
        await onToolCreated(createData as VapiTool)
    }

    const mockTool = useMemo(() => createMockTool(selectedToolType), [selectedToolType])

    const toolTypeLabel = useMemo(() => {
        switch (selectedToolType) {
            case 'transferCall':
                return 'Transfer Call'
            case 'apiRequest':
                return 'API Request'
            case 'sms':
                return 'SMS'
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
            default:
                return ''
        }
    }, [selectedToolType])

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

            <ToolCell 
                tool={mockTool} 
                onSave={handleSave}
                isCreateMode={true}
            />

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
        default:
            throw new Error(`Unknown tool type: ${toolType}`)
    }
}
