'use server'

import { AgentToolCreateServer } from "@/components/clients/ClientAgents/AgentTools/AgentToolCreateServer"

export default async function AgentToolCreatePage({
    params,
    searchParams,
}: {
    params: Promise<{ orgId: string; agentId: string }>
    searchParams: Promise<{ type?: string }>
}) {
    const { agentId } = await params
    const { type } = await searchParams

    return <AgentToolCreateServer agentId={agentId} toolType={type} />
}

