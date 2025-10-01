import { Suspense } from "react"
import { AgentSidebarServer } from "@/components/agents/AgentSidebarServer"
import { AgentSidebarLoading } from "@/components/agents/AgentSidebarLoading"

export default async function AgentLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ orgId: string; agentId: string }>
}) {
    const { orgId, agentId } = await params

    return (
        <div className="flex h-screen overflow-hidden bg-muted/20">
            <Suspense fallback={<AgentSidebarLoading orgId={orgId} />}>
                <div className="h-full overflow-y-auto">
                    <AgentSidebarServer agentId={agentId} orgId={orgId} />
                </div>
            </Suspense>
            <div className="flex-1 overflow-y-auto bg-background px-10 py-8">
                <div className="mx-auto flex max-w-4xl flex-col gap-8 pb-16">
                    {children}
                </div>
            </div>
        </div>
    )
}
