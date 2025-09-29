'use client'

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addTextKnowledge } from "@/app/api/knowledge-base/addKnowledge"
import { TextKnowledgeDTO } from "@/lib/types/knowledge"
import { toast } from "sonner"

interface AddTextProps {
    onSuccess?: () => void
    knowledgeBaseId: string
}

export function AddText({ onSuccess, knowledgeBaseId }: AddTextProps) {
    const [text, setText] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!text.trim()) {
            console.error("No text provided")
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
        } catch (error) {
            console.error(error)
            toast.error('Failed to add text to knowledge base')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Add text to your knowledge base</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        placeholder="Enter your text content here..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={loading}
                        rows={6}
                        className="resize-none"
                    />
                    <Button type="submit" disabled={loading || !text.trim()}>
                        {loading ? 'Adding...' : 'Add Text'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
