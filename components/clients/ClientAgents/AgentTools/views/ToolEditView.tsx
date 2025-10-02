'use client'

import { VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft } from "lucide-react"
import { ToolCell } from "../ToolTypes/ToolCell"

interface ToolEditViewProps {
    tool: VapiTool
    onBack: () => void
    onSave: (toolData: any) => void
    onSaveSuccess?: () => void
}

export function ToolEditView({ tool, onBack, onSave, onSaveSuccess }: ToolEditViewProps) {
    const getToolTypeDisplayName = (type: string) => {
        switch (type) {
            case 'transferCall':
                return 'Transfer Call'
            case 'apiRequest':
                return 'API Request'
            case 'sms':
                return 'SMS'
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
                        onClick={onBack}
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

            <ToolCell tool={tool} onSave={onSave} onSaveSuccess={onSaveSuccess} />
        </div>
    )
}
