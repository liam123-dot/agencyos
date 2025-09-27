'use client'

import { useState } from "react"
import { VapiTool, CreateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { createTool } from "@/app/api/agents/tools/actions"
import { toast } from "sonner"
import { useToolsNavigation } from "./hooks/useToolsNavigation"
import { ToolsListView } from "./views/ToolsListView"
import { ToolCreateView } from "./views/ToolCreateView"
import { ToolEditView } from "./views/ToolEditView"

interface AgentToolsClientProps {
    agentId: string
    initialTools: VapiTool[]
}

export function AgentToolsClient({ agentId, initialTools }: AgentToolsClientProps) {
    const [tools, setTools] = useState<VapiTool[]>(initialTools)
    const [isCreating, setIsCreating] = useState(false)
    
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
            
            // Switch to edit mode for the new tool
            navigateToEditAfterCreate(newTool as VapiTool)
            
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
        // We might want to refresh the tools list here if needed
    }

    // Render the appropriate view
    if (viewMode === 'list') {
        return (
            <ToolsListView
                tools={tools}
                onCreateTool={() => navigateToCreate()}
                onSelectTool={navigateToEdit}
            />
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
            />
        )
    }

    return null
}

