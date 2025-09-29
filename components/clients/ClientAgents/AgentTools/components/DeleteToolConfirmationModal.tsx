'use client'

import { VapiTool } from "@/app/api/agents/tools/ToolTypes"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Loader2 } from "lucide-react"

interface DeleteToolConfirmationModalProps {
    tool: VapiTool | null
    isOpen: boolean
    onClose: () => void
    onConfirm: (toolId: string) => Promise<void>
    isDeleting: boolean
}

export function DeleteToolConfirmationModal({
    tool,
    isOpen,
    onClose,
    onConfirm,
    isDeleting
}: DeleteToolConfirmationModalProps) {
    if (!tool) return null

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

    const handleConfirm = async () => {
        await onConfirm(tool.id)
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                        Delete Tool
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this tool? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="rounded-lg border p-4 space-y-2">
                        <div className="font-medium text-sm">
                            {tool.function.name || 'Untitled Tool'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Type: {getToolTypeDisplayName(tool.type)}
                        </div>
                        {tool.function.description && (
                            <div className="text-xs text-muted-foreground">
                                {tool.function.description}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleConfirm}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            'Delete Tool'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
