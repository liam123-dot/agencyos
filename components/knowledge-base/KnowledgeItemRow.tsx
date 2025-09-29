'use client'

import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, ExternalLink, FileText, Globe, Type, Loader2 } from "lucide-react"
import { Knowledge, KnowledgeType, KnowledgeStatus } from "@/lib/types/knowledge"
import { useState } from "react"
import { deleteKnowledge } from "@/app/api/knowledge-base/deleteActions"

interface KnowledgeItemRowProps {
    knowledge: Knowledge
    onDelete?: (knowledgeId: string) => void
}

export function KnowledgeItemRow({ knowledge, onDelete }: KnowledgeItemRowProps) {

    const [isDeleting, setIsDeleting] = useState(false)

    async function handleDelete() {
        setIsDeleting(true)
        await deleteKnowledge(knowledge.id)
        onDelete?.(knowledge.id)
        setIsDeleting(false)
    }

    const getKnowledgeIcon = (type: KnowledgeType) => {
        switch (type) {
            case 'website':
                return <Globe className="h-4 w-4" />
            case 'file':
                return <FileText className="h-4 w-4" />
            case 'text':
                return <Type className="h-4 w-4" />
            default:
                return <FileText className="h-4 w-4" />
        }
    }

    const getFileExtension = (fileName: string) => {
        const extension = fileName.split('.').pop()?.toUpperCase()
        return extension || 'FILE'
    }

    const getStatusBadgeVariant = (status: KnowledgeStatus) => {
        switch (status) {
            case 'processing':
                return 'default' as const
            case 'failed':
                return 'destructive' as const
            case 'succeeded':
                return 'secondary' as const
            default:
                return 'outline' as const
        }
    }

    const getTypeInfo = (item: Knowledge) => {
        const statusBadge = {
            text: item.status,
            variant: getStatusBadgeVariant(item.status)
        }

        switch (item.type) {
            case 'website':
                return {
                    name: item.url,
                    badges: [
                        statusBadge,
                        // ...(item.scraped ? [{ text: 'Scraped', variant: 'outline' as const }] : [])
                    ]
                }
            case 'file':
                return {
                    name: `${item.fileName}`,
                    badges: [
                        statusBadge,
                        { text: getFileExtension(item.fileName), variant: 'outline' as const },
                        { text: item.uploadStatus, variant: 'outline' as const }
                    ]
                }
            case 'text':
                return {
                    name: item.title,
                    badges: [
                        statusBadge,
                        // { text: `${item.wordCount} words`, variant: 'outline' as const }
                    ]
                }
        }
    }

    const typeInfo = getTypeInfo(knowledge)

    return (
        <TableRow key={knowledge.id}>
            <TableCell>
                <div className="flex items-center gap-2">
                    {getKnowledgeIcon(knowledge.type)}
                </div>
            </TableCell>
            <TableCell className="font-medium">
                <div className="truncate max-w-[300px]" title={typeInfo.name}>
                    {typeInfo.name}
                </div>
            </TableCell>
            <TableCell>
                <div className="flex gap-1 flex-wrap">
                    {typeInfo.badges.map((badge, index) => (
                        <Badge 
                            key={index} 
                            variant={badge.variant} 
                            className="text-xs"
                        >
                            {badge.text}
                        </Badge>
                    ))}
                </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
                {new Date(knowledge.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
                <div className="flex gap-1">
                    {knowledge.type === 'website' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open((knowledge as any).url, '_blank')}
                        >
                            <ExternalLink className="h-3 w-3" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="text-destructive hover:text-destructive"
                        >
                            {isDeleting ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                        </Button>
                    )}
                </div>
            </TableCell>
        </TableRow>
    )
}
