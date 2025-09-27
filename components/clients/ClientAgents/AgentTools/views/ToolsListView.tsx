'use client'

import { useState } from "react"
import { VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, ChevronRight } from "lucide-react"
import { ToolType } from "../hooks/useToolsNavigation"

interface ToolsListViewProps {
    tools: VapiTool[]
    onCreateTool: () => void
    onSelectTool: (tool: VapiTool) => void
}

export function ToolsListView({ tools, onCreateTool, onSelectTool }: ToolsListViewProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<"all" | ToolType>("all")

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

    const filteredTools = tools.filter((tool) => {
        const matchesType = typeFilter === 'all' ? true : tool.type === typeFilter
        const q = searchQuery.trim().toLowerCase()
        const matchesQuery = !q
            || tool.function.name.toLowerCase().includes(q)
            || tool.function.description.toLowerCase().includes(q)
        return matchesType && matchesQuery
    })

    const totalCount = tools.length
    const showingCount = filteredTools.length
    const countTransfer = tools.filter(t => t.type === 'transferCall').length
    const countApi = tools.filter(t => t.type === 'apiRequest').length
    const countSms = tools.filter(t => t.type === 'sms').length

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Agent Tools</h1>
                    <p className="text-muted-foreground">
                        Manage tools available to your agent during conversations
                    </p>
                </div>
                <Button onClick={onCreateTool} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create Tool
                </Button>
            </div>

            <Card>
                <CardContent className="py-4 space-y-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
                        <Input
                            id="search"
                            placeholder="Search tools"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="md:flex-1"
                        />
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant={typeFilter === 'all' ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => setTypeFilter('all')}
                            >
                                All ({totalCount})
                            </Button>
                            <Button
                                type="button"
                                variant={typeFilter === 'transferCall' ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => setTypeFilter('transferCall')}
                            >
                                📞 Transfer ({countTransfer})
                            </Button>
                            <Button
                                type="button"
                                variant={typeFilter === 'apiRequest' ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => setTypeFilter('apiRequest')}
                            >
                                🌐 API ({countApi})
                            </Button>
                            <Button
                                type="button"
                                variant={typeFilter === 'sms' ? 'secondary' : 'outline'}
                                size="sm"
                                onClick={() => setTypeFilter('sms')}
                            >
                                💬 SMS ({countSms})
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground md:ml-auto whitespace-nowrap">
                            Showing {showingCount} of {totalCount}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {tools.length === 0 ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <span className="text-2xl">🔧</span>
                    </div>
                    <h3 className="text-lg font-medium mb-2">No tools yet</h3>
                    <p className="text-muted-foreground mb-6">
                        Tools let your agent take actions during calls
                    </p>
                    <Button onClick={onCreateTool}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Tool
                    </Button>
                </div>
            ) : (
                filteredTools.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No tools match your search</p>
                    </div>
                ) : (
                    <Card>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead>Tool</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Configuration</TableHead>
                                    <TableHead className="w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTools.map((tool) => (
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
                                                    <span>To {(tool as any).destinations?.[0]?.number || 'No number'}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>
                )
            )}
        </div>
    )
}
