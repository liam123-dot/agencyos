'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createKnowledgeBase } from "@/app/api/knowledge-base/knowledgeBaseActions"

export function CreateKnowledgeBaseDialog() {
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [newKnowledgeBaseName, setNewKnowledgeBaseName] = useState('')
    const [isCreating, setIsCreating] = useState(false)

    const handleCreateKnowledgeBase = async () => {
        if (!newKnowledgeBaseName.trim()) return
        
        setIsCreating(true)
        try {
            await createKnowledgeBase(newKnowledgeBaseName.trim())
            setNewKnowledgeBaseName('')
            setIsCreateDialogOpen(false)
        } catch (error) {
            console.error('Error creating knowledge base:', error)
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create new knowledge base</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            placeholder="Enter knowledge base name"
                            value={newKnowledgeBaseName}
                            onChange={(e) => setNewKnowledgeBaseName(e.target.value)}
                            disabled={isCreating}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsCreateDialogOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleCreateKnowledgeBase}
                            disabled={!newKnowledgeBaseName.trim() || isCreating}
                        >
                            {isCreating ? 'Creating...' : 'Create'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
