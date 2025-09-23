'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { unassignVapiAgentFromClient } from "@/app/api/agents/unassignAgentFromClient"

interface UnassignAgentButtonProps {
    agentId: string
    agentName: string
    onUnassigned?: () => void
}

export function UnassignAgentButton({ agentId, agentName, onUnassigned }: UnassignAgentButtonProps) {
    const [isUnassigning, setIsUnassigning] = useState(false)
    const router = useRouter()

    const handleUnassign = async () => {
        setIsUnassigning(true)
        try {
            await unassignVapiAgentFromClient(agentId)
            
            toast.success(`${agentName} unassigned successfully!`)
            onUnassigned?.()
            router.refresh()
        } catch (error) {
            console.error('Error unassigning agent:', error)
            toast.error(error instanceof Error ? error.message : "Failed to unassign agent. Please try again.")
        } finally {
            setIsUnassigning(false)
        }
    }

    return (
        <Button 
            size="sm" 
            variant="outline"
            onClick={handleUnassign}
            disabled={isUnassigning}
            className="w-full"
        >
            {isUnassigning ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <X className="h-4 w-4" />
            )}
            {isUnassigning ? "Unassigning..." : "Unassign"}
        </Button>
    )
}
