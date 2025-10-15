
'use server'

import { getAgent } from "../getAgent"
import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { createServerClient } from "@/lib/supabase/server"
import { VapiClient } from "@vapi-ai/server-sdk"
import { VapiTool, ExternalAppTool } from "./ToolTypes"

export async function getTools(agentId: string) {
    const agent = await getAgent(agentId)

    const supabase = await createServerClient()

    const { data: organization, error: organizationError } = await supabase.from('organizations').select('*').eq('id', agent.organization_id).single()

    const vapiClient = new VapiClient({token: organization.vapi_api_key})

    const assistant = await vapiClient.assistants.get(agent.platform_id)

    const toolIds = assistant.model?.toolIds;

    // use promise.all to get the tools, with error handling for missing tools
    const toolPromises = toolIds?.map(async (toolId: string) => {
        try {
            const tool = await vapiClient.tools.get(toolId)
            
            // Check if this is a custom external app tool (function tool with custom_tool_ prefix)
            const isExternalAppTool = tool.type === 'function' && 
                                      (tool as any).function?.name?.startsWith('custom_tool_')
            
            if (isExternalAppTool) {
                // Fetch the external app tool from the database by external_id
                const { data: externalAppTool, error: externalAppToolsError } = await supabase
                    .from('external_app_tools')
                    .select('*')
                    .eq('external_id', toolId)
                    .single()
                
                if (externalAppToolsError || !externalAppTool) {
                    console.error('Error fetching external app tool:', externalAppToolsError)
                    // Return the tool as-is if we can't find it in the database
                    return tool
                }
                
                // Transform database record into ExternalAppTool object
                return {
                    id: toolId,
                    createdAt: tool.createdAt,
                    updatedAt: tool.updatedAt,
                    type: 'externalApp' as const,
                    function: externalAppTool.function_schema,
                    messages: (tool as any).messages || [],
                    orgId: tool.orgId,
                    dbId: externalAppTool.id,
                    name: externalAppTool.name,
                    label: externalAppTool.label,
                    description: externalAppTool.description,
                    functionSchema: externalAppTool.function_schema,
                    staticConfig: externalAppTool.static_config,
                    propsConfig: externalAppTool.props_config,
                    app: externalAppTool.app,
                    appName: externalAppTool.app_name,
                    appImgSrc: externalAppTool.app_img_src,
                    accountId: externalAppTool.account_id,
                    actionKey: externalAppTool.action_key,
                    actionName: externalAppTool.action_name,
                    externalId: externalAppTool.external_id,
                    agentId: externalAppTool.agent_id,
                    clientId: externalAppTool.client_id,
                    organizationId: externalAppTool.organization_id
                } as ExternalAppTool
            }
            
            return tool
        } catch (error) {
            // console.error(`Failed to fetch tool ${toolId}:`, error)
            // Return null for tools that no longer exist or failed to fetch
            return null
        }
    }) || []

    const toolsWithNulls = await Promise.all(toolPromises)
    
    // Filter out null values (tools that no longer exist)
    const tools = toolsWithNulls.filter(tool => tool !== null)

    // console.log(JSON.stringify(tools, null, 2))

    return tools as VapiTool[]
    
}

