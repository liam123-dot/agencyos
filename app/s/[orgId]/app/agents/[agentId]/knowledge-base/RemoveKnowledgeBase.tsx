
'use client'

import { Button } from "@/components/ui/button"
import { Loader2, Trash } from "lucide-react"
import { useState } from "react"
import { removeKnowledgeBaseFromAgent } from "@/app/api/knowledge-base/assignKnowledgeToAgent"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function RemoveKnowledgeBaseFromAgent({knowledgeBaseId, agentId}: {knowledgeBaseId: string, agentId: string}) {
    const [isRemoving, setIsRemoving] = useState(false)
    const router = useRouter()

    const handleRemove = async () => {
        setIsRemoving(true)
        try {
            await removeKnowledgeBaseFromAgent(knowledgeBaseId, agentId)
            toast.success("Knowledge base removed successfully!")
            router.refresh() // Refresh the page to show the updated state
        } catch (error) {
            console.error('Error removing knowledge base:', error)
            toast.error("Failed to remove knowledge base. Please try again.")
        } finally {
            setIsRemoving(false)
        }
    }

    return (
        <Button 
            onClick={handleRemove} 
            disabled={isRemoving} 
            // variant="destructive" 
            size="sm"
        >
            {isRemoving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <Trash className="h-4 w-4 mr-2" />
            )}
            {isRemoving ? "Removing..." : "Remove"}
        </Button>
    )
}

