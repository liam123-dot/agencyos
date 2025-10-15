'use server'

import { AgentToolEditServer } from "@/components/clients/ClientAgents/AgentTools/AgentToolEditServer"

export default async function AgentToolEditPage({
    params,
    searchParams,
}: {
    params: Promise<{ orgId: string; agentId: string }>
    searchParams: Promise<{ toolId?: string }>
}) {
    const { agentId, orgId } = await params
    const { toolId } = await searchParams

    if (!toolId) {
        // Redirect back to tools list if no toolId
        return null
    }

    return <AgentToolEditServer agentId={agentId} toolId={toolId} orgId={orgId} />
}

