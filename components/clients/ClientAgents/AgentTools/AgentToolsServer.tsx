
'use server'

import { getTools } from "@/app/api/agents/tools/getTools"
import { getAgent } from "@/app/api/agents/getAgent"
import { AgentToolsClient } from "./AgentToolsClient"

export async function AgentToolsServer({ agentId }: { agentId: string }) {
    console.log('agentId', agentId)
    const [tools, agent] = await Promise.all([
        getTools(agentId),
        getAgent(agentId)
    ])

    return (
        <AgentToolsClient 
            agentId={agentId} 
            clientId={agent.client_id}
            initialTools={tools} 
        />
    )
}

