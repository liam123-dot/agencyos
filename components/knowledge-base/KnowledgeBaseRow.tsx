'use client'

import { TableCell, TableRow } from "@/components/ui/table"
import { useParams } from "next/navigation"
import Link from "next/link"

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
    const params = useParams()
    const orgId = params.orgId as string
    const href = `/app/knowledge-base/${knowledgeBase.id}`

    return (
        <TableRow className="group relative hover:bg-muted/50 transition-colors cursor-pointer">
            <TableCell className="font-medium">
                <Link 
                    href={href}
                    className="after:absolute after:inset-0 after:content-['']"
                    prefetch={true}
                >
                    {knowledgeBase.name}
                </Link>
            </TableCell>
            <TableCell>
                {new Date(knowledgeBase.created_at).toLocaleDateString()}
            </TableCell>
            <TableCell>
                {new Date(knowledgeBase.updated_at).toLocaleDateString()}
            </TableCell>
        </TableRow>
    )
}
