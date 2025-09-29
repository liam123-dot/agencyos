'use client'

import { useRouter, useParams } from "next/navigation"
import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"

interface KnowledgeBase {
    id: string
    name: string
    client_id: string
    organization_id: string
    created_at: string
    updated_at: string
}

interface KnowledgeBaseRowProps {
    knowledgeBase: KnowledgeBase
}

export function KnowledgeBaseRow({ knowledgeBase }: KnowledgeBaseRowProps) {
    const router = useRouter()
    const params = useParams()
    const orgId = params.orgId as string

    const handleViewClick = () => {
        router.push(`/app/knowledge-base/${knowledgeBase.id}`)
    }

    const handleRowClick = () => {
        router.push(`/app/knowledge-base/${knowledgeBase.id}`)
    }

    return (
        <TableRow 
            className="cursor-pointer hover:bg-muted/50" 
            onClick={handleRowClick}
        >
            <TableCell className="font-medium">
                {knowledgeBase.name}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {new Date(knowledgeBase.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
                {new Date(knowledgeBase.updated_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => {
                        e.stopPropagation()
                        handleViewClick()
                    }}
                >
                    View
                </Button>
            </TableCell>
        </TableRow>
    )
}
