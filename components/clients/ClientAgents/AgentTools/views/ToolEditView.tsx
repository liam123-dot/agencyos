'use client'

import { VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ToolCell } from "../ToolTypes/ToolCell"

interface ToolEditViewProps {
    tool: VapiTool
    onBack: () => void
    onSave: (toolData: any) => void
}

export function ToolEditView({ tool, onBack, onSave }: ToolEditViewProps) {
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
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onBack}
                    className="flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Tools
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Configure Tool</h1>
                    <p className="text-muted-foreground">
                        {tool.function.name} - {getToolTypeDisplayName(tool.type)}
                    </p>
                </div>
            </div>

            <ToolCell tool={tool} onSave={onSave} />
        </div>
    )
}
