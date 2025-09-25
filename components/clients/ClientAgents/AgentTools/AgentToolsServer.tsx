
'use server'

import { getAgent } from "@/app/api/agents/getAgent"
import { getTools } from "@/app/api/agents/tools/getTools"
import { AgentToolsClient } from "./AgentToolsClient"

export async function AgentToolsServer({ agentId }: { agentId: string }) {
    const agent = await getAgent(agentId)
    const tools = await getTools(agentId)

    return (
        <AgentToolsClient agentId={agentId} initialTools={tools} />
    )
}

