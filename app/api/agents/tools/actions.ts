'use server'

import { CreateVapiToolDto, UpdateVapiToolDto } from "./ToolTypes";
import { getUser } from "../../user/getUser";
import { VapiClient } from "@vapi-ai/server-sdk";
import { deleteExternalAppTool } from "./createExternalAppTool";

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

export async function deleteTool(agentId: string, toolId: string, clientId?: string) {
    const { userData, supabaseServerClient } = await getUser()
    const effective_client_id = clientId || userData.client_id;

    console.log('deleteTool with id', toolId)

    // Check if this is an external app tool (by checking if it exists in external_app_tools table)
    const { data: externalAppTool, error: externalAppToolError } = await supabaseServerClient
        .from('external_app_tools')
        .select('*')
        .eq('external_id', toolId)
        .single()

    // If it's an external app tool, use the dedicated delete function
    if (externalAppTool && !externalAppToolError) {
        console.log('Detected external app tool, using deleteExternalAppTool')
        return await deleteExternalAppTool(toolId, agentId, effective_client_id)
    }

    // Otherwise, handle as a regular Vapi tool
    console.log('Handling as regular Vapi tool')

    // Get client and organization data
    const {data: client, error: clientError} = await supabaseServerClient.from('clients').select('*').eq('id', effective_client_id).single()
    if (clientError) throw new Error('Failed to fetch client data')

    const {data: organization, error: organizationError} = await supabaseServerClient.from('organizations').select('*').eq('id', client.organization_id).single()    
    if (organizationError) throw new Error('Failed to fetch organization data')

    // Get the agent to access the assistant
    const {data: agent, error: agentError} = await supabaseServerClient.from('agents').select('*').eq('id', agentId).single()
    if (agentError) throw new Error('Failed to fetch agent data')

    const vapiClient = new VapiClient({token: organization.vapi_api_key})

    // Get the current assistant to update its toolIds
    const assistant = await vapiClient.assistants.get(agent.platform_id)
    const currentToolIds = assistant.model?.toolIds || []
    
    // Remove the tool ID from the assistant
    const updatedToolIds = currentToolIds.filter(id => id !== toolId)
    
    // Update the assistant without the tool
    await vapiClient.assistants.update(agent.platform_id, {
        model: {
            ...assistant.model,
            toolIds: updatedToolIds
        } as any
    })

    console.log('Updated assistant - removed tool ID')

    // Delete the tool from Vapi
    await vapiClient.tools.delete(toolId)
    console.log('Deleted tool from Vapi')
    
    return { success: true }
}
