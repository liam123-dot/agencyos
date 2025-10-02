'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { addTextKnowledge } from "@/app/api/knowledge-base/addKnowledge"
import { TextKnowledgeDTO } from "@/lib/types/knowledge"
import { toast } from "sonner"

interface AddTextDialogProps {
    onSuccess?: () => void
    knowledgeBaseId: string
}

// Text Icon
const TextIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 6h16M4 12h16M4 18h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="2" y="3" width="20" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    </svg>
)

export function AddTextDialog({ onSuccess, knowledgeBaseId }: AddTextDialogProps) {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!text.trim()) {
            return
        }

        setLoading(true)
        try {
            const textDTO: TextKnowledgeDTO = {
                type: 'text',
                title: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
                content: text,
                wordCount: text.trim().split(/\s+/).length,
                status: 'processing'
            }
            
            const result = await addTextKnowledge(knowledgeBaseId, textDTO)
            if (result?.success) {
                toast.success('Text submitted. Processing has started.')
            } else {
                toast.success('Text submitted.')
            }
            if (onSuccess) {
                onSuccess()
            }
            
            setText('')
            setOpen(false)
        } catch (error) {
            console.error(error)
            toast.error('Failed to add text to knowledge base')
        } finally {
            setLoading(false)
        }
    }

    const handleSuccess = () => {
        setOpen(false)
        if (onSuccess) {
            onSuccess()
        }
    }

    return (
        <>
            <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                            <TextIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg">
                                Text Content
                            </CardTitle>
                            <CardDescription className="mt-1.5">
                                Manually add text content to your knowledge base
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Button
                        onClick={() => setOpen(true)}
                        className="w-full"
                    >
                        Add Text
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add Text Content</DialogTitle>
                        <DialogDescription>
                            Manually add text content to your knowledge base. This will be processed and made searchable.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                        <Textarea
                            placeholder="Enter your text content here..."
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={loading}
                            rows={10}
                            className="resize-none"
                        />
                        <div className="flex justify-end gap-2">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading || !text.trim()}>
                                {loading ? 'Adding...' : 'Add to Knowledge Base'}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    )
}

