'use server'

import { CreateVapiToolDto, UpdateVapiToolDto } from "./ToolTypes";
import { getUser } from "../../user/getUser";
import { VapiClient } from "@vapi-ai/server-sdk";

export async function updateTool(toolId: string, toolData: UpdateVapiToolDto) {
    
    const { userData, supabaseServerClient } = await getUser()
    const client_id = userData.client_id;

    const {data: client, error: clientError} = await supabaseServerClient.from('clients').select('*').eq('id', client_id).single()

    const {data: organization, error: organizationError} = await supabaseServerClient.from('organizations').select('*').eq('id', client.organization_id).single()    

    const vapiClient = new VapiClient({token: organization.vapi_api_key})

    console.log('updateTool with id', toolId, 'and data', toolData)

    const tool = await vapiClient.tools.update(toolId, toolData as any)

    console.log(tool)
}

export async function createTool(agentId: string, toolData: CreateVapiToolDto) {
    const { userData, supabaseServerClient } = await getUser()
    const client_id = userData.client_id;

    // Get client and organization data
    const {data: client, error: clientError} = await supabaseServerClient.from('clients').select('*').eq('id', client_id).single()
    if (clientError) throw new Error('Failed to fetch client data')

    const {data: organization, error: organizationError} = await supabaseServerClient.from('organizations').select('*').eq('id', client.organization_id).single()    
    if (organizationError) throw new Error('Failed to fetch organization data')

    // Get the agent to access the assistant
    const {data: agent, error: agentError} = await supabaseServerClient.from('agents').select('*').eq('id', agentId).single()
    if (agentError) throw new Error('Failed to fetch agent data')

    const vapiClient = new VapiClient({token: organization.vapi_api_key})

    console.log('createTool with data', toolData)

    // Create the tool
    const tool = await vapiClient.tools.create(toolData as any)
    console.log('Created tool:', tool)

    // Get the current assistant to update its toolIds
    const assistant = await vapiClient.assistants.get(agent.platform_id)
    const currentToolIds = assistant.model?.toolIds || []
    
    // Add the new tool ID to the assistant
    const updatedToolIds = [...currentToolIds, tool.id]
    
    // Update the assistant with the new tool
    await vapiClient.assistants.update(agent.platform_id, {
        model: {
            ...assistant.model,
            toolIds: updatedToolIds
        } as any
    })

    console.log('Updated assistant with new tool ID')
    
    return tool
}
