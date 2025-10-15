'use server'

import { getTools } from "@/app/api/agents/tools/getTools"
import { AgentToolEditClient } from "./AgentToolEditClient"
import { notFound } from "next/navigation"

export async function AgentToolEditServer({ 
    agentId, 
    toolId,
    orgId 
}: { 
    agentId: string
    toolId: string
    orgId: string
}) {
    const tools = await getTools(agentId)
    const tool = tools.find(t => t.id === toolId)

    if (!tool) {
        notFound()
    }

    return (
        <AgentToolEditClient 
            tool={tool}
            agentId={agentId}
            orgId={orgId}
        />
    )
}

