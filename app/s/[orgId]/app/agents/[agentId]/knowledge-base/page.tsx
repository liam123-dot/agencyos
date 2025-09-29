
import { Suspense } from "react"
import { ManageAgentKnowledgeBase } from "./ManageAgentKnowledgeBase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Database } from "lucide-react"

function KnowledgeBaseLoadingSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-muted-foreground" />
                    <Skeleton className="h-6 w-48" />
                </CardTitle>
                <CardDescription>
                    <Skeleton className="h-4 w-full max-w-md" />
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {/* Simulate 2-3 knowledge base items */}
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-2">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default async function AgentKnowledgeBasePage({params}: {params: Promise<{agentId: string}>}) {

    const { agentId } = await params

    return (
        <Suspense fallback={<KnowledgeBaseLoadingSkeleton />}>
            <ManageAgentKnowledgeBase agentId={agentId} />
        </Suspense>
    )

}
