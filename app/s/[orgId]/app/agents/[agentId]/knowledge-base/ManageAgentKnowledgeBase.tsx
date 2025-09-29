'use server'

import { getVapiAgent } from "@/app/api/agents/getVapiAgent"
import { AssignKnowledgeBaseToAgentButton } from "./AssignKnowledgeBaseToAgentButton"
import { getKnowledgeBases } from "@/app/api/knowledge-base/knowledgeBaseActions"
import { ExistingKnowledgeBase } from "./ExistingKnowledgeBase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Database } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export async function ManageAgentKnowledgeBase({agentId}: {agentId: string}) {
    try {
        const vapiAgent = await getVapiAgent(agentId)
        
        // Check if agent has an existing knowledge base
        const vapiKnowledgeBaseId = (vapiAgent.model as any)?.knowledgeBaseId;

        if (vapiKnowledgeBaseId) {
            return <ExistingKnowledgeBase vapiKnowledgeBaseId={vapiKnowledgeBaseId} agentId={agentId} />
        }

        // Get available knowledge bases
        const knowledgeBases = await getKnowledgeBases()

        if (knowledgeBases.length === 0) {
            return (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Knowledge Base
                        </CardTitle>
                        <CardDescription>
                            No knowledge bases available to assign to this agent.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Create a knowledge base first before assigning it to an agent.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            )
        }

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        Assign Knowledge Base
                    </CardTitle>
                    <CardDescription>
                        Choose a knowledge base to assign to this agent. This will provide the agent with access to the documents and information in the selected knowledge base.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {knowledgeBases.map((knowledgeBase) => (
                            <div key={knowledgeBase.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div>
                                    <h3 className="font-medium">{knowledgeBase.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Created {new Date(knowledgeBase.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <AssignKnowledgeBaseToAgentButton 
                                    knowledgeBaseId={knowledgeBase.id} 
                                    agentId={agentId} 
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    } catch (error) {
        console.error('Error in ManageAgentKnowledgeBase:', error)
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
                            Failed to load knowledge base information. Please try refreshing the page or contact support if the problem persists.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }
}
