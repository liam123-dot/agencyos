'use client'

// import { Vapi } from "@vapi-ai/server-sdk"
import { VapiTool, UpdateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
// import { VapiTransferToolCall } from "./VapiTransferToolCall"
import { VapiSmsToolCall } from "./VapiSmsToolCall"
import { VapiTransferCallTool } from "./VapiTransferCallTool"
import { VapiApiRequestTool } from "./VapiApiRequestTool"
import { VapiExternalAppTool } from "./VapiExternalAppTool"
// import { VapiEndCallToolCall } from "./VapiEndCallToolCall"
import {Vapi} from '@vapi-ai/server-sdk'
import { useState } from "react"
import { updateTool } from "@/app/api/agents/tools/actions"


interface ToolCellProps {
  tool: VapiTool
  isCreateMode?: boolean
  onSave: (toolData: UpdateVapiToolDto) => void
  onSaveSuccess?: () => void
}

export function ToolCell({ tool, isCreateMode = false, onSave, onSaveSuccess }: ToolCellProps) {

    const [isEditing, setIsEditing] = useState(false)

    const handleSave = async (toolData: UpdateVapiToolDto) => {
        console.log('handleSave with data', toolData)
        try {
            // External app tools handle their own updates through updateExternalAppTool
            // So we skip calling updateTool for them
            if (!isCreateMode && tool.type !== 'externalApp') {
                await updateTool(tool.id, toolData)
            }
            // Always call the parent's onSave callback
            await onSave(toolData)
            setIsEditing(false)
            // Call success callback if provided
            onSaveSuccess?.()
        } catch (error) {
            // Error handling is done by individual tool components
            throw error
        }
    }

    switch (tool.type) {
        case 'transferCall':
            return <VapiTransferCallTool tool={tool} onSave={handleSave} />
        case 'sms':
            return <VapiSmsToolCall tool={tool} onSave={handleSave} />
        case 'apiRequest':
            return <VapiApiRequestTool tool={tool} onSave={handleSave} />
        case 'externalApp':
            return <VapiExternalAppTool tool={tool} onSave={handleSave} />
        // case 'endCall':
        //     return <VapiEndCallToolCall tool={tool} onSave={onSave} />
        default:
            return <div>Unknown tool type: {(tool as any).type}</div>
    }
}