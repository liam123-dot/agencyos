'use client'

import { VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronRight, Trash2 } from "lucide-react"
import { ToolType } from "../hooks/useToolsNavigation"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface ToolsListViewProps {
    tools: VapiTool[]
    onCreateTool: (toolType: ToolType) => void
    onSelectTool: (tool: VapiTool) => void
    onDeleteTool: (tool: VapiTool) => void
}

const toolOptions: Array<{ value: ToolType; icon: string; title: string; description: string }> = [
    {
        value: 'transferCall',
        icon: '📞',
        title: 'Transfer Call',
        description: 'Connect callers to another line.'
    },
    {
        value: 'apiRequest',
        icon: '🌐',
        title: 'API Request',
        description: 'Call an external service mid-convo.'
    },
    {
        value: 'sms',
        icon: '💬',
        title: 'SMS',
        description: 'Send a follow-up text message.'
    }
]

export function ToolsListView({ tools, onCreateTool, onSelectTool, onDeleteTool }: ToolsListViewProps) {
    const renderCreateDropdown = (buttonClassName?: string) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className={`flex items-center gap-2 ${buttonClassName ?? ''}`}>
                    <Plus className="h-4 w-4" />
                    New tool
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                {toolOptions.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onCreateTool(option.value)}
                        className="flex flex-col items-start gap-1"
                    >
                        <span className="flex items-center gap-2 text-sm font-medium">
                            <span>{option.icon}</span>
                            {option.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )

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
                return <span className="text-base">📞</span>
            case 'apiRequest':
                return <span className="text-base">🌐</span>
            case 'sms':
                return <span className="text-base">💬</span>
            default:
                return <span className="text-base">🔧</span>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                {renderCreateDropdown()}
            </div>

            {tools.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">🔧</span>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No tools yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Tools let your agent take actions during calls
                    </p>
                    {renderCreateDropdown("ml-auto mr-auto")}
                </div>
            ) : (
                <Card className="shadow-sm">
                    <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Configuration</TableHead>
                                    <TableHead className="w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tools.map((tool) => (
                                    <TableRow 
                                        key={tool.id} 
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => onSelectTool(tool)}
                                    >
                                        <TableCell className="py-3">
                                            <div className="w-6 h-6 flex items-center justify-center">
                                                {getToolTypeIcon(tool.type)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div>
                                                <div className="font-medium text-sm">
                                                    {tool.function.name || 'Untitled Tool'}
                                                </div>
                                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                                    {tool.function.description || 'No description'}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <Badge variant="outline" className="text-xs">
                                                {getToolTypeDisplayName(tool.type)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="text-xs text-muted-foreground">
                                                {tool.type === 'apiRequest' && (
                                                    <span>{(tool as any).method} {(tool as any).url || 'No URL'}</span>
                                                )}
                                                {tool.type === 'sms' && (
                                                    <span>From {(tool as any).metadata?.from || 'No number'}</span>
                                                )}
                                                {tool.type === 'transferCall' && (
                                                    <div className="space-y-1">
                                                        {(tool as any).destinations && (tool as any).destinations.length > 0 ? (
                                                            (tool as any).destinations.length === 1 ? (
                                                                <span>To {(tool as any).destinations[0]?.number || 'No number'}</span>
                                                            ) : (
                                                                <div>
                                                                    <span className="font-medium">{(tool as any).destinations.length} destinations:</span>
                                                                    <div className="mt-1 space-y-0.5">
                                                                        {(tool as any).destinations.slice(0, 3).map((dest: any, index: number) => (
                                                                            <div key={index} className="flex items-center gap-2">
                                                                                <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                                                                                <span>{dest.number || 'No number'}</span>
                                                                                {dest.transferPlan?.mode && (
                                                                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                                                                        {dest.transferPlan.mode === 'blind-transfer' && 'Blind'}
                                                                                        {dest.transferPlan.mode === 'cold-transfer' && 'Cold'}
                                                                                        {dest.transferPlan.mode === 'warm-transfer-say-message' && 'Warm'}
                                                                                        {dest.transferPlan.mode === 'warm-transfer-say-summary' && 'Smart'}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                        {(tool as any).destinations.length > 3 && (
                                                                            <div className="text-xs text-muted-foreground">
                                                                                +{(tool as any).destinations.length - 3} more...
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span>No destinations</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onDeleteTool(tool)
                                                    }}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
            )}
        </div>
    )
}
