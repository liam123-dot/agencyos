'use client'

import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { addFileKnowledge } from "@/app/api/knowledge-base/addKnowledge"
import { FileKnowledge, FileKnowledgeDTO } from "@/lib/types/knowledge"

interface AddPdfProps {
    onSuccess?: (knowledge: FileKnowledge) => void
    knowledgeBaseId: string
}

export function AddPdf({ onSuccess, knowledgeBaseId }: AddPdfProps) {
    const [loading, setLoading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!fileInputRef.current?.files?.[0]) {
            console.error("No file selected")
            return
        }

        setLoading(true)
        try {
            const file = fileInputRef.current.files[0]
            
            const fileDTO: FileKnowledgeDTO = {
                type: 'file',
                title: file.name,
                fileName: file.name,
                // fileSize: file.size,
                // fileType: file.type.split('/')[1] || 'unknown',
                uploadStatus: 'pending',
                status: 'processing'
            }
            
            // Comment out server call for testing
            const result = await addFileKnowledge(fileDTO, file, knowledgeBaseId)
            
            // Mock response for testing
            if (onSuccess) {
                onSuccess(result)
            }
            
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Upload a file to your knowledge base</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Supported formats: PDF, CSV, TXT, DOC, DOCX (max 10MB)
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex space-x-2">
                    <Input
                        type="file"
                        accept=".pdf,.csv,.txt,.doc,.docx"
                        ref={fileInputRef}
                        disabled={loading}
                    />
                    <Button type="submit" disabled={loading}>
                        {loading ? 'Uploading...' : 'Upload'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
