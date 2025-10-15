'use client'

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { deleteTool } from "@/app/api/agents/tools/actions"
import { toast } from "sonner"
import { ToolsListView } from "./views/ToolsListView"
import { DeleteToolConfirmationModal } from "./components/DeleteToolConfirmationModal"
import { ToolType } from "./hooks/useToolsNavigation"

interface AgentToolsClientProps {
    agentId: string
    clientId: string
    initialTools: VapiTool[]
}

export function AgentToolsClient({ agentId, clientId, initialTools }: AgentToolsClientProps) {
    const router = useRouter()
    const pathname = usePathname()
    const [tools, setTools] = useState<VapiTool[]>(initialTools)
    const [toolToDelete, setToolToDelete] = useState<VapiTool | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const handleCreateTool = (toolType: ToolType) => {
        router.push(`${pathname}/create?type=${toolType}`)
    }

    const handleSelectTool = (tool: VapiTool) => {
        // Navigate to the edit page
        router.push(`${pathname}/edit?toolId=${tool.id}`)
    }

    const handleDeleteTool = (tool: VapiTool) => {
        setToolToDelete(tool)
    }

    const handleConfirmDelete = async (toolId: string) => {
        try {
            setIsDeleting(true)
            await deleteTool(agentId, toolId, clientId)
            
            // Remove the tool from the local state
            setTools(prevTools => prevTools.filter(tool => tool.id !== toolId))
            
            toast.success("Tool deleted successfully!", {
                description: "The tool has been removed from your agent."
            })
            
            setToolToDelete(null)
            
        } catch (error) {
            console.error('Error deleting tool:', error)
            toast.error("Failed to delete tool", {
                description: "Please try again or contact support if the issue persists."
            })
        } finally {
            setIsDeleting(false)
        }
    }

    const handleCancelDelete = () => {
        setToolToDelete(null)
    }

    return (
        <>
            <ToolsListView
                tools={tools}
                onCreateTool={handleCreateTool}
                onSelectTool={handleSelectTool}
                onDeleteTool={handleDeleteTool}
            />
            <DeleteToolConfirmationModal
                tool={toolToDelete}
                isOpen={!!toolToDelete}
                onClose={handleCancelDelete}
                onConfirm={handleConfirmDelete}
                isDeleting={isDeleting}
            />
        </>
    )
}

