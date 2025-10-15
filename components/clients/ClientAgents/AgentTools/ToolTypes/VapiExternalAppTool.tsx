'use client'

import { ExternalAppTool } from "@/app/api/agents/tools/ToolTypes"
import { ExternalAppToolCreate } from "../ExternalAppTool/ExternalAppToolCreate"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { PropConfig } from "../ExternalAppTool/FieldConfiguration"

interface VapiExternalAppToolProps {
  tool: ExternalAppTool
  onSave?: (toolData: any) => void
}

export function VapiExternalAppTool({ tool, onSave }: VapiExternalAppToolProps) {
  const router = useRouter()
  
  const initialTool = {
    dbId: tool.dbId!,
    name: tool.name,
    label: tool.label,
    description: tool.description,
    functionSchema: tool.functionSchema,
    staticConfig: tool.staticConfig,
    propsConfig: tool.propsConfig || {},
    app: tool.app,
    appName: tool.appName,
    appImgSrc: tool.appImgSrc,
    accountId: tool.accountId,
    actionKey: tool.actionKey,
    actionName: tool.actionName
  }

  const handleToolUpdated = (updatedTool: any) => {
    onSave?.(updatedTool)
    // Refresh the page to show updated data
    router.refresh()
  }

  // Get clientId from the tool or use a default
  const clientId = tool.clientId || ''

  return (
    <ExternalAppToolCreate
      clientId={clientId}
      agentId={tool.agentId || ''}
      editMode={true}
      initialTool={initialTool}
      onToolUpdated={handleToolUpdated}
    />
  )
}
