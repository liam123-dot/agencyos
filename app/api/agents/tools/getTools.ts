
'use server'

import { getAgent } from "../getAgent"
import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { createServerClient } from "@/lib/supabase/server"
import { VapiClient } from "@vapi-ai/server-sdk"
import { VapiTool } from "./ToolTypes"

export async function getTools(agentId: string) {
    const agent = await getAgent(agentId)

    const supabase = await createServerClient()

    const { data: organization, error: organizationError } = await supabase.from('organizations').select('*').eq('id', agent.organization_id).single()

    const vapiClient = new VapiClient({token: organization.vapi_api_key})

    const assistant = await vapiClient.assistants.get(agent.platform_id)

    const toolIds = assistant.model?.toolIds;

    // use promise.all to get the tools
    const tools = await Promise.all(toolIds?.map(async (toolId: string) => {
        const tool = await vapiClient.tools.get(toolId)
        return tool
    }) || [])

    console.log(JSON.stringify(tools, null, 2))

    return tools as VapiTool[]
    
}

