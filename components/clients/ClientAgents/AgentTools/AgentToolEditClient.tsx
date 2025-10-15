'use client'

import { useRouter, usePathname } from "next/navigation"
import { VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ToolCell } from "./ToolTypes/ToolCell"

interface AgentToolEditClientProps {
    tool: VapiTool
    agentId: string
    orgId: string
}

export function AgentToolEditClient({ tool, agentId, orgId }: AgentToolEditClientProps) {
    const router = useRouter()
    const pathname = usePathname()

    const handleBack = () => {
        // Navigate back to tools list
        const toolsPath = pathname.replace('/edit', '')
        router.push(toolsPath)
    }

    const handleSave = async (toolData: any) => {
        // This will be handled by the ToolCell component
        // No need to show toast here as individual tool components handle it
    }

    const handleSaveSuccess = () => {
        // Navigate back to the tools list after successful save
        handleBack()
    }

    const getToolTypeDisplayName = (type: string) => {
        switch (type) {
            case 'transferCall':
                return 'Transfer Call'
            case 'apiRequest':
                return 'API Request'
            case 'sms':
                return 'SMS'
            case 'externalApp':
                return 'External App'
            default:
                return type
        }
    }

    return (
        <div className="space-y-10">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBack}
                        className="flex items-center gap-2 px-0 text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to all tools
                    </Button>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold">Configure tool</h1>
                        <p className="text-sm text-muted-foreground">
                            Adjust instructions or update destinations so this tool keeps working exactly how you expect.
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="self-start text-xs uppercase tracking-wide">
                    {getToolTypeDisplayName(tool.type)}
                </Badge>
            </header>

            <ToolCell tool={tool} onSave={handleSave} onSaveSuccess={handleSaveSuccess} />
        </div>
    )
}

