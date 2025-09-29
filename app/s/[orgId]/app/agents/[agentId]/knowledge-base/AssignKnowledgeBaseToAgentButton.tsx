'use client'

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { assignKnowledgeBaseToAgent } from "@/app/api/knowledge-base/assignKnowledgeToAgent";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function AssignKnowledgeBaseToAgentButton({knowledgeBaseId, agentId}: {knowledgeBaseId: string, agentId: string}) {
    
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleAssign() {
        setIsLoading(true)
        try {
            await assignKnowledgeBaseToAgent(knowledgeBaseId, agentId)
            toast.success("Knowledge base assigned successfully!")
            router.refresh() // Refresh the page to show the updated state
        } catch (error) {
            console.error('Error assigning knowledge base:', error)
            toast.error("Failed to assign knowledge base. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button onClick={handleAssign} disabled={isLoading} size="sm">
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
                <Plus className="h-4 w-4 mr-2" />
            )}
            {isLoading ? "Assigning..." : "Assign"}
        </Button>
    )
}