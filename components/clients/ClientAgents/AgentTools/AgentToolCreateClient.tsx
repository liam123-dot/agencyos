'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { VapiTool, CreateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { createTool } from "@/app/api/agents/tools/actions"
import { toast } from "sonner"
import { ToolCreateView } from "./views/ToolCreateView"
import { ToolType } from "./hooks/useToolsNavigation"

interface AgentToolCreateClientProps {
    agentId: string
    clientId: string
    toolType?: string
}

export function AgentToolCreateClient({ agentId, clientId, toolType }: AgentToolCreateClientProps) {
    const router = useRouter()
    const [isCreating, setIsCreating] = useState(false)
    
    // Default to 'transferCall' if not specified or invalid
    const selectedToolType = (toolType && ['transferCall', 'apiRequest', 'sms', 'externalApp'].includes(toolType) 
        ? toolType 
        : 'transferCall') as ToolType

    const handleToolCreated = async (toolOrData: VapiTool | CreateVapiToolDto) => {
        try {
            setIsCreating(true)
            
            // External app tools are already created and return VapiTool
            // Other tools need to be created and pass CreateVapiToolDto
            if (selectedToolType !== 'externalApp') {
                await createTool(agentId, toolOrData as CreateVapiToolDto)
            }
            
            toast.success("Tool created successfully!", {
                description: "The new tool has been added to your agent."
            })
            
            // Navigate back to the tools list
            router.push(`../tools`)
            
        } catch (error) {
            console.error('Error creating tool:', error)
            toast.error("Failed to create tool", {
                description: "Please try again or contact support if the issue persists."
            })
        } finally {
            setIsCreating(false)
        }
    }

    const handleBack = () => {
        router.push(`../tools`)
    }

    return (
        <ToolCreateView
            selectedToolType={selectedToolType}
            clientId={clientId}
            agentId={agentId}
            onBack={handleBack}
            onToolCreated={handleToolCreated}
            isCreating={isCreating}
        />
    )
}

