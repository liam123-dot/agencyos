'use server'

import { getAgent } from "@/app/api/agents/getAgent"
import { AgentToolCreateClient } from "./AgentToolCreateClient"

export async function AgentToolCreateServer({ 
    agentId,
    toolType 
}: { 
    agentId: string
    toolType?: string
}) {
    const agent = await getAgent(agentId)

    return (
        <AgentToolCreateClient 
            agentId={agentId} 
            clientId={agent.client_id}
            toolType={toolType}
        />
    )
}

