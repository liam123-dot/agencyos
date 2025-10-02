'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { FileText, Loader2 } from "lucide-react"
import { Knowledge, KnowledgeStatus } from "@/lib/types/knowledge"
import { KnowledgeItemRow } from "./KnowledgeItemRow"

interface KnowledgeOverviewProps {
    knowledge: Knowledge[]
    onDelete?: (id: string) => void
    isLoading?: boolean
    isCheckingStatus?: boolean
}

export function KnowledgeOverview({ knowledge, onDelete, isLoading = false, isCheckingStatus = false }: KnowledgeOverviewProps) {

    // Show loading skeleton
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-4 w-4" />
                        Knowledge Base Contents
                    </CardTitle>
                    {isCheckingStatus && (
                        <Badge variant="outline" className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking status
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12">Type</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Added</TableHead>
                                <TableHead className="w-24">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {Array.from({ length: 3 }).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Skeleton className="h-4 w-4 rounded" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-[180px]" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-16" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-8 w-8 rounded" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )
    }

    if (knowledge.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <FileText className="h-4 w-4" />
                        Knowledge Base Contents (0 items)
                    </CardTitle>
                    {isCheckingStatus && (
                        <Badge variant="outline" className="flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Checking status
                        </Badge>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground font-medium">No knowledge items yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Connect an integration or manually add content above</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4" />
                    Knowledge Base Contents ({knowledge.length} {knowledge.length === 1 ? 'item' : 'items'})
                </CardTitle>
                {isCheckingStatus && (
                    <Badge variant="outline" className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Checking status
                    </Badge>
                )}
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Added</TableHead>
                            <TableHead className="w-24">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {knowledge.map((item) => (
                            <KnowledgeItemRow
                                key={item.id}
                                knowledge={item}
                                onDelete={onDelete}
                            />
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
