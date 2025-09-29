
'use server'

import { Button } from "@/components/ui/button"
import { createServerClient } from "@/lib/supabase/server"
import Link from "next/link"
import { RemoveKnowledgeBaseFromAgent } from "./RemoveKnowledgeBase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database, FileText, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export async function ExistingKnowledgeBase({vapiKnowledgeBaseId, agentId}: {vapiKnowledgeBaseId: string, agentId: string}) {
    try {
        const supabase = await createServerClient()

        const { data: knowledgeBase, error: knowledgeBaseError } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('vapi_knowledge_base_id', vapiKnowledgeBaseId)
            .single()
            
        if (knowledgeBaseError) {
            throw new Error('Failed to fetch knowledge base')
        }

        // Get the number of documents in the knowledge base
        const { data: documents, error: documentsError } = await supabase
            .from('knowledge')
            .select('id')
            .eq('knowledge_base_id', knowledgeBase.id)
            
        if (documentsError) {
            console.error('Failed to fetch documents', documentsError)
            throw new Error('Failed to fetch documents')
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-green-600" />
                        {knowledgeBase.name}
                    </CardTitle>
                    <CardDescription>
                        This agent is currently using the knowledge base below. You can manage the documents or remove the knowledge base from this agent.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4" />
                            <span>{documents.length} document{documents.length !== 1 ? 's' : ''}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <Link href={`/app/knowledge-base/${knowledgeBase.id}`} prefetch={true}>
                                <Button variant="outline" size="sm">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Manage Documents
                                </Button>
                            </Link>
                            <RemoveKnowledgeBaseFromAgent 
                                knowledgeBaseId={knowledgeBase.id} 
                                agentId={agentId} 
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    } catch (error) {
        console.error('Error in ExistingKnowledgeBase:', error)
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Error Loading Knowledge Base
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Failed to load the assigned knowledge base. The knowledge base may have been deleted or there may be a connection issue. Please try refreshing the page.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }
}

