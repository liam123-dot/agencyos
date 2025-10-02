'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createWorkflow } from "@/app/api/agents/orchestration/orchestrationActions"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateWorkflowButtonProps {
    clientId?: string
}

export function CreateWorkflowButton({ clientId }: CreateWorkflowButtonProps) {
    const [open, setOpen] = useState(false)
    const [workflowName, setWorkflowName] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!workflowName.trim()) {
            toast.error("Please enter a workflow name")
            return
        }

        setIsLoading(true)
        
        try {
            const result = await createWorkflow(workflowName.trim(), clientId)
            
            if (result.success && result.orchestrationId) {
                toast.success("Workflow created successfully!")
                setOpen(false)
                setWorkflowName("")
                // Navigate to the orchestration page
                router.push(`/app/agents/orchestration/${result.orchestrationId}`)
                router.refresh()
            }
        } catch (error) {
            console.error("Error creating workflow:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create workflow")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!isLoading) {
            setOpen(newOpen)
            if (!newOpen) {
                setWorkflowName("")
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Workflow
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create New Workflow</DialogTitle>
                    <DialogDescription>
                        Enter a name for your agent workflow orchestration.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="workflow-name">Workflow Name</Label>
                            <Input
                                id="workflow-name"
                                value={workflowName}
                                onChange={(e) => setWorkflowName(e.target.value)}
                                placeholder="Enter workflow name..."
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !workflowName.trim()}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Workflow"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

