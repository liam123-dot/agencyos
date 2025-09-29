'use client'

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

interface KnowledgeBaseBreadcrumbProps {
    knowledgeBaseName: string
}

export function KnowledgeBaseBreadcrumb({ knowledgeBaseName }: KnowledgeBaseBreadcrumbProps) {
    const router = useRouter()

    const handleBackClick = () => {
        router.push(`/app/knowledge-base`)
    }

    return (
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
            <Button 
                variant="ghost" 
                onClick={handleBackClick}
                className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
            >
                Knowledge Bases
            </Button>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium">{knowledgeBaseName}</span>
        </nav>
    )
}
