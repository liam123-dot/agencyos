'use client'

import { useState } from "react"
import { VapiTool, CreateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { ToolCell } from "./ToolTypes/ToolCell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Plus, ArrowLeft, Settings, Wrench } from "lucide-react"
import { createTool } from "@/app/api/agents/tools/actions"
import { toast } from "sonner"

type ToolType = 'transferCall' | 'apiRequest' | 'sms'
type ViewMode = 'list' | 'create' | 'edit'

interface AgentToolsClientProps {
    agentId: string
    initialTools: VapiTool[]
}

export function AgentToolsClient({ agentId, initialTools }: AgentToolsClientProps) {
    const [tools, setTools] = useState<VapiTool[]>(initialTools)
    const [selectedTool, setSelectedTool] = useState<VapiTool | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [selectedToolType, setSelectedToolType] = useState<ToolType>('transferCall')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreateTool = () => {
        setViewMode('create')
        setSelectedTool(null)
    }

    const handleSelectTool = (tool: VapiTool) => {
        setSelectedTool(tool)
        setViewMode('edit')
    }

    const handleBackToList = () => {
        setViewMode('list')
        setSelectedTool(null)
    }

    const handleToolCreated = async (toolData: CreateVapiToolDto) => {
        try {
            setIsCreating(true)
            const newTool = await createTool(agentId, toolData)
            
            // Add the new tool to the list
            setTools(prevTools => [...prevTools, newTool as VapiTool])
            
            toast.success("Tool created successfully!", {
                description: "The new tool has been added to your agent."
            })
            
            // Switch to edit mode for the new tool
            setSelectedTool(newTool as VapiTool)
            setViewMode('edit')
            
        } catch (error) {
            console.error('Error creating tool:', error)
            toast.error("Failed to create tool", {
                description: "Please try again or contact support if the issue persists."
            })
        } finally {
            setIsCreating(false)
        }
    }

    const handleSave = async (toolData: any) => {
        // This will be handled by the ToolCell component
        // We might want to refresh the tools list here if needed
    }

    const getToolTypeDisplayName = (type: string) => {
        switch (type) {
            case 'transferCall':
                return 'Transfer Call'
            case 'apiRequest':
                return 'API Request'
            case 'sms':
                return 'SMS'
            default:
                return type
        }
    }

    const getToolTypeIcon = (type: string) => {
        switch (type) {
            case 'transferCall':
                return '📞'
            case 'apiRequest':
                return '🌐'
            case 'sms':
                return '💬'
            default:
                return '🔧'
        }
    }

    // List view
    if (viewMode === 'list') {
        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Agent Tools</h1>
                        <p className="text-muted-foreground">
                            Manage tools available to your agent during conversations
                        </p>
                    </div>
                    <Button onClick={handleCreateTool} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Create Tool
                    </Button>
                </div>

                {tools.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No tools configured</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Get started by creating your first tool for this agent
                            </p>
                            <Button onClick={handleCreateTool} className="flex items-center gap-2">
                                <Plus className="h-4 w-4" />
                                Create Your First Tool
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {tools.map((tool) => (
                            <Card key={tool.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{getToolTypeIcon(tool.type)}</span>
                                            <div>
                                                <CardTitle className="text-lg">{tool.function.name}</CardTitle>
                                                <CardDescription className="text-sm">
                                                    {getToolTypeDisplayName(tool.type)} Tool
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleSelectTool(tool)}
                                            className="flex items-center gap-2"
                                        >
                                            <Settings className="h-4 w-4" />
                                            Configure
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-sm text-muted-foreground">
                                        {tool.function.description}
                                    </p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        )
    }

    // Create view
    if (viewMode === 'create') {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBackToList}
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
                    <CardHeader>
                        <CardTitle>Select Tool Type</CardTitle>
                        <CardDescription>
                            Choose the type of tool you want to create
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="tool-type">Tool Type</Label>
                            <Select value={selectedToolType} onValueChange={(value) => setSelectedToolType(value as ToolType)}>
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
                    </CardContent>
                </Card>

                {/* Render the appropriate tool creation form */}
                <CreateToolForm
                    toolType={selectedToolType}
                    onSave={handleToolCreated}
                    onCancel={handleBackToList}
                    isCreating={isCreating}
                />
            </div>
        )
    }

    // Edit view
    if (viewMode === 'edit' && selectedTool) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleBackToList}
                        className="flex items-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Tools
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Configure Tool</h1>
                        <p className="text-muted-foreground">
                            {selectedTool.function.name} - {getToolTypeDisplayName(selectedTool.type)}
                        </p>
                    </div>
                </div>

                <ToolCell tool={selectedTool} onSave={handleSave} />
            </div>
        )
    }

    return null
}

// Component to render the appropriate creation form based on tool type
function CreateToolForm({ 
    toolType, 
    onSave, 
    onCancel, 
    isCreating 
}: { 
    toolType: ToolType
    onSave: (toolData: CreateVapiToolDto) => void
    onCancel: () => void
    isCreating: boolean
}) {
    // Create a mock tool object for the creation form
    const mockTool = createMockTool(toolType)
    
    const handleSave = async (toolData: any) => {
        // Convert the update format to create format
        const createData = convertToCreateFormat(toolType, toolData)
        await onSave(createData)
    }

    return (
        <div className="space-y-4">
            <ToolCell 
                tool={mockTool} 
                onSave={handleSave}
                isCreateMode={true}
            />
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isCreating}
                >
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
