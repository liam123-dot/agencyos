'use server'

import { AgentToolsServer } from "@/components/clients/ClientAgents/AgentTools/AgentToolsServer"

export default async function AgentToolsPage({

    params,
}: {
    params: Promise<{ orgId: string; agentId: string }>
}) {
    const { agentId } = await params
    console.log('agentId', agentId)

    return <AgentToolsServer agentId={agentId} />
}