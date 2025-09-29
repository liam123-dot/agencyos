'use client'

import { useState } from "react"
import { VapiTool, CreateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { createTool, deleteTool } from "@/app/api/agents/tools/actions"
import { toast } from "sonner"
import { useToolsNavigation } from "./hooks/useToolsNavigation"
import { ToolsListView } from "./views/ToolsListView"
import { ToolCreateView } from "./views/ToolCreateView"
import { ToolEditView } from "./views/ToolEditView"
import { DeleteToolConfirmationModal } from "./components/DeleteToolConfirmationModal"

interface AgentToolsClientProps {
    agentId: string
    initialTools: VapiTool[]
}

export function AgentToolsClient({ agentId, initialTools }: AgentToolsClientProps) {
    const [tools, setTools] = useState<VapiTool[]>(initialTools)
    const [isCreating, setIsCreating] = useState(false)
    const [toolToDelete, setToolToDelete] = useState<VapiTool | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    
    const {
        selectedTool,
        viewMode,
        selectedToolType,
        navigateToCreate,
        navigateToEdit,
        navigateToList,
        updateToolType,
        navigateToEditAfterCreate
    } = useToolsNavigation({ tools })

    const handleToolCreated = async (toolData: CreateVapiToolDto) => {
        try {
            setIsCreating(true)
            const newTool = await createTool(agentId, toolData)
            
            // Add the new tool to the list
            setTools(prevTools => [...prevTools, newTool as VapiTool])
            
            toast.success("Tool created successfully!", {
                description: "The new tool has been added to your agent."
            })
            
            // Navigate back to the overview table
            navigateToList()
            
        } catch (error) {
            console.error('Error creating tool:', error)
            toast.error("Failed to create tool", {
                description: "Please try again or contact support if the issue persists."
            })
        } finally {
            setIsCreating(false)
        }
    }

    const handleSave = async (toolData: any) => {
        // This will be handled by the ToolCell component
        // No need to show toast here as individual tool components handle it
    }

    const handleSaveSuccess = () => {
        // Navigate back to the overview after successful save
        navigateToList()
    }

    const handleDeleteTool = (tool: VapiTool) => {
        setToolToDelete(tool)
    }

    const handleConfirmDelete = async (toolId: string) => {
        try {
            setIsDeleting(true)
            await deleteTool(agentId, toolId)
            
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

    // Render the appropriate view
    if (viewMode === 'list') {
        return (
            <>
                <ToolsListView
                    tools={tools}
                    onCreateTool={() => navigateToCreate()}
                    onSelectTool={navigateToEdit}
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

    if (viewMode === 'create') {
        return (
            <ToolCreateView
                selectedToolType={selectedToolType}
                onToolTypeChange={updateToolType}
                onBack={navigateToList}
                onToolCreated={handleToolCreated}
                isCreating={isCreating}
            />
        )
    }

    if (viewMode === 'edit' && selectedTool) {
        return (
            <ToolEditView
                tool={selectedTool}
                onBack={navigateToList}
                onSave={handleSave}
                onSaveSuccess={handleSaveSuccess}
            />
        )
    }

    return null
}

