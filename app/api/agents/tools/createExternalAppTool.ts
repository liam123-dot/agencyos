'use server'

import { clientDashboardAuth } from "../../clients/clientDashboardAuth";
import { getTools } from "./getTools";
import { VapiClient } from "@vapi-ai/server-sdk";
import { buildVapiToolConfigForCreate, buildVapiToolConfigForUpdate } from "./toolDataFormatter";

export async function createExternalAppTool(toolData: any, agentId: string, clientId?: string) {
    const {userData, supabaseServerClient, client, organization} = await clientDashboardAuth(clientId)

    console.log('agentId', agentId, 'clientId', clientId)

    // Get the agent to access the assistant
    const {data: agent, error: agentError} = await supabaseServerClient.from('agents').select('*').eq('id', agentId).single()
    if (agentError) {
        throw new Error('Failed to fetch agent data')
    }

    const agentTools = await getTools(agentId)

    // Helper function to convert label to internal name (lowercase with underscores)
    const generateToolName = (label: string): string => {
        return label
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
            .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    }

    // Generate base name from label
    const toolLabel = toolData.label || toolData.functionSchema.name
    const baseName = generateToolName(toolLabel)
    
    // Check for uniqueness and add increment if needed
    let toolName = baseName
    let increment = 2
    
    while (true) {
        const {data: existingTool} = await supabaseServerClient
            .from('external_app_tools')
            .select('id')
            .eq('name', toolName)
            .eq('client_id', clientId || null)
            .eq('agent_id', agentId)
            .single()
        
        if (!existingTool) {
            // Name is unique, we can use it
            break
        }
        
        // Name exists, try with increment
        toolName = `${baseName}_${increment}`
        increment++
    }
    
    console.log(`Generated unique tool name: ${toolName} from label: ${toolLabel}`)

    // Print the structured tool data to the console
    console.log('\n' + '='.repeat(80))
    console.log('🔧 EXTERNAL APP TOOL CREATED')
    console.log('='.repeat(80))
    
    console.log('\n📋 FUNCTION SCHEMA (What the AI Agent Sees)')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(toolData.functionSchema, null, 2))
    
    console.log('\n🔒 STATIC CONFIG (Pre-configured Values - Hidden from AI)')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(toolData.staticConfig, null, 2))
    
    console.log('\n🔌 PIPEDREAM METADATA (Execution Context)')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(toolData.pipedreamMetadata, null, 2))
    
    console.log('\n👤 CLIENT INFO')
    console.log('-'.repeat(80))
    console.log(`Client ID: ${clientId}`)
    console.log(`Client Name: ${client?.name || 'N/A'}`)
    
    console.log('\n' + '='.repeat(80))
    console.log('END OF TOOL DATA')
    console.log('='.repeat(80) + '\n')

    // Add isAsync to props_config for storage
    const propsConfigWithMeta = {
        ...toolData.propsConfig,
        _isAsync: toolData.isAsync || false
    }

    // Save the external app tool to the database first to get the ID
    const {error: insertError} = await supabaseServerClient
        .from('external_app_tools')
        .insert({
            name: toolName, // Use the generated unique name
            label: toolLabel, // Store the display label
            description: toolData.functionSchema.description || null,
            function_schema: toolData.functionSchema,
            static_config: toolData.staticConfig || null,
            props_config: propsConfigWithMeta,
            app: toolData.pipedreamMetadata?.app || null,
            app_name: toolData.pipedreamMetadata?.appName || null,
            app_img_src: toolData.pipedreamMetadata?.appImgSrc || null,
            account_id: toolData.pipedreamMetadata?.accountId || null,
            action_key: toolData.pipedreamMetadata?.actionKey || null,
            action_name: toolData.pipedreamMetadata?.actionName || null,
            external_id: null, // Will be updated with Vapi tool ID
            agent_id: agentId,
            client_id: clientId || null,
            organization_id: organization.id
        })

    if (insertError) {
        console.error('Failed to save external app tool:', insertError)
        throw new Error('Failed to save external app tool to database')
    }

    // Fetch the newly created tool
    const {data: externalAppTool, error: fetchError} = await supabaseServerClient
        .from('external_app_tools')
        .select('*')
        .eq('name', toolName)
        .eq('client_id', clientId || null)
        .eq('agent_id', agentId)
        .single()

    if (fetchError || !externalAppTool) {
        console.error('Failed to fetch external app tool after insert:', fetchError)
        throw new Error('Failed to fetch external app tool after insert')
    }

    console.log('✅ External app tool saved to database:', externalAppTool)

    // Now create a Vapi function tool that points to this database record
    const vapiClient = new VapiClient({token: organization.vapi_api_key})
    
    // Get the assistant to add the tool
    const assistant = await vapiClient.assistants.get(agent.platform_id)
    const currentToolIds = assistant.model?.toolIds || []
    
    // Construct the tool endpoint URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL or VERCEL_URL is not configured')
    }
    const toolUrl = `${baseUrl}/api/tool/${externalAppTool.id}/call`
    
    // Create a unique tool name with custom_tool_ prefix using the generated name
    const vapiToolName = `custom_tool_${toolName}`
    
    console.log(`Creating Vapi function tool: ${vapiToolName}`)
    console.log(`Tool URL: ${toolUrl}`)
    
    // Build the Vapi tool configuration for creating (use generated name for function)
    const { config: vapiToolConfig } = buildVapiToolConfigForCreate(
        toolName, // Use the generated unique name
        toolData.functionSchema,
        toolUrl,
        toolData.isAsync || false
    )
    
    console.log('Creating tool with config:', JSON.stringify(vapiToolConfig, null, 2))
    
    // Create the function tool in Vapi
    const functionTool = await vapiClient.tools.create(vapiToolConfig as any)
    
    console.log('Created Vapi function tool:', functionTool)
    
    // Update the database with the Vapi tool ID
    await supabaseServerClient
        .from('external_app_tools')
        .update({ external_id: functionTool.id })
        .eq('id', externalAppTool.id)
    
    // Add the function tool to the assistant
    await vapiClient.assistants.update(agent.platform_id, {
        model: {
            ...assistant.model,
            toolIds: [...currentToolIds, functionTool.id]
        } as any
    })
    
    console.log('Added function tool to assistant')

    // Return success response
    return {
        success: true,
        data: externalAppTool
    }
}

export async function updateExternalAppTool(
    toolDbId: string, 
    toolData: {
        functionSchema: any;
        staticConfig?: any;
        propsConfig?: any;
        label: string;
        description?: string;
        isAsync?: boolean;
    },
    agentId: string,
    clientId?: string
) {
    const {userData, supabaseServerClient, client, organization} = await clientDashboardAuth(clientId)

    console.log('Updating external app tool:', toolDbId)

    // First, fetch the existing tool to get the external_id and other metadata
    const {data: existingTool, error: fetchError} = await supabaseServerClient
        .from('external_app_tools')
        .select('*')
        .eq('id', toolDbId)
        .single()

    if (fetchError || !existingTool) {
        console.error('Failed to fetch existing external app tool:', fetchError)
        throw new Error('Failed to fetch existing external app tool')
    }

    if (!existingTool.external_id) {
        console.error('External app tool does not have an external_id')
        throw new Error('External app tool does not have an external_id (Vapi tool ID)')
    }

    // Helper function to convert label to internal name (lowercase with underscores)
    const generateToolName = (label: string): string => {
        return label
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric with underscore
            .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    }

    // Check if label changed and generate new name if needed
    let toolName = existingTool.name // Keep existing name by default
    if (toolData.label !== existingTool.label) {
        // Label changed, generate new name
        const baseName = generateToolName(toolData.label)
        toolName = baseName
        let increment = 2
        
        // Check for uniqueness (excluding current tool)
        while (true) {
            const {data: conflictingTool} = await supabaseServerClient
                .from('external_app_tools')
                .select('id')
                .eq('name', toolName)
                .eq('client_id', clientId || null)
                .eq('agent_id', agentId)
                .neq('id', toolDbId) // Exclude current tool
                .single()
            
            if (!conflictingTool) {
                // Name is unique, we can use it
                break
            }
            
            // Name exists, try with increment
            toolName = `${baseName}_${increment}`
            increment++
        }
        
        console.log(`Generated new unique tool name: ${toolName} from label: ${toolData.label}`)
    }

    // Print the structured tool data to the console
    console.log('\n' + '='.repeat(80))
    console.log('🔧 EXTERNAL APP TOOL UPDATED')
    console.log('='.repeat(80))
    
    console.log('\n📋 FUNCTION SCHEMA (What the AI Agent Sees)')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(toolData.functionSchema, null, 2))
    
    console.log('\n🔒 STATIC CONFIG (Pre-configured Values - Hidden from AI)')
    console.log('-'.repeat(80))
    console.log(JSON.stringify(toolData.staticConfig, null, 2))
    
    console.log('\n👤 CLIENT INFO')
    console.log('-'.repeat(80))
    console.log(`Client ID: ${clientId}`)
    console.log(`Client Name: ${client?.name || 'N/A'}`)
    
    console.log('\n' + '='.repeat(80))
    console.log('END OF TOOL DATA')
    console.log('='.repeat(80) + '\n')

    // Add isAsync to props_config for storage
    const propsConfigWithMeta = {
        ...toolData.propsConfig,
        _isAsync: toolData.isAsync || false
    }

    // Update the tool in the database
    const {data: updatedTool, error: updateError} = await supabaseServerClient
        .from('external_app_tools')
        .update({
            name: toolName, // Use the generated or existing name
            label: toolData.label, // Update the display label
            description: toolData.description || null,
            function_schema: toolData.functionSchema,
            static_config: toolData.staticConfig || null,
            props_config: propsConfigWithMeta,
            updated_at: new Date().toISOString()
        })
        .eq('id', toolDbId)
        .select()
        .single()

    if (updateError) {
        console.error('Failed to update external app tool:', updateError)
        throw new Error('Failed to update external app tool in database')
    }

    console.log('✅ External app tool updated in database:', updatedTool)

    // Now update the Vapi function tool
    const vapiClient = new VapiClient({token: organization.vapi_api_key})
    
    // Construct the tool endpoint URL (remains the same)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    if (!baseUrl) {
        throw new Error('NEXT_PUBLIC_APP_URL or VERCEL_URL is not configured')
    }
    const toolUrl = `${baseUrl}/api/tool/${existingTool.id}/call`
    
    // Build the Vapi tool configuration for updating (use the generated or existing name)
    const { vapiToolName, config: vapiToolConfig } = buildVapiToolConfigForUpdate(
        toolName, // Use the generated or existing unique name
        toolData.functionSchema,
        toolUrl,
        toolData.isAsync || false
    )
    
    console.log(`Updating Vapi function tool: ${vapiToolName}`)
    console.log(`Tool URL: ${toolUrl}`)
    console.log(`External ID: ${existingTool.external_id}`)
    
    // Update the function tool in Vapi using the external_id
    try {
        console.log('Updating tool with config (no type field):', JSON.stringify(vapiToolConfig, null, 2))
        const functionTool = await vapiClient.tools.update(existingTool.external_id, vapiToolConfig as any)
        
        console.log('✅ Vapi function tool updated:', functionTool)
    } catch (vapiError) {
        console.error('Failed to update Vapi tool:', vapiError)
        // Don't throw - database is already updated, just log the error
        console.warn('Database was updated but Vapi tool update failed')
    }

    // Return success response
    return {
        success: true,
        data: updatedTool
    }
}

export async function deleteExternalAppTool(
    toolId: string,
    agentId: string,
    clientId?: string
) {
    const {userData, supabaseServerClient, client, organization} = await clientDashboardAuth(clientId)

    console.log('Deleting external app tool:', toolId, 'for agent:', agentId)

    // Get the agent to access the assistant
    const {data: agent, error: agentError} = await supabaseServerClient
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()
    
    if (agentError) {
        throw new Error('Failed to fetch agent data')
    }

    // Check if this is an external app tool (by checking if it exists in external_app_tools table)
    const { data: externalAppTool, error: externalAppToolError } = await supabaseServerClient
        .from('external_app_tools')
        .select('*')
        .eq('external_id', toolId)
        .single()

    if (!externalAppTool || externalAppToolError) {
        console.error('External app tool not found in database:', externalAppToolError)
        throw new Error('External app tool not found')
    }

    console.log('Found external app tool in database:', externalAppTool)

    // Initialize Vapi client
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

    console.log('✅ Updated assistant - removed tool ID')

    // Delete the tool from Vapi
    try {
        await vapiClient.tools.delete(toolId)
        console.log('✅ Deleted tool from Vapi')
    } catch (vapiError) {
        console.error('Failed to delete tool from Vapi:', vapiError)
        // Continue to delete from database even if Vapi deletion fails
        console.warn('Continuing to delete from database despite Vapi error')
    }

    // Delete the external app tool from the database
    const { error: deleteError } = await supabaseServerClient
        .from('external_app_tools')
        .delete()
        .eq('id', externalAppTool.id)
    
    if (deleteError) {
        console.error('Failed to delete external app tool from database:', deleteError)
        throw new Error('Failed to delete external app tool from database')
    }

    console.log('✅ Deleted external app tool from database')

    console.log('\n' + '='.repeat(80))
    console.log('🗑️  EXTERNAL APP TOOL DELETED')
    console.log('='.repeat(80))
    console.log(`Tool Name: ${externalAppTool.name}`)
    console.log(`Tool ID: ${externalAppTool.id}`)
    console.log(`External ID (Vapi): ${externalAppTool.external_id}`)
    console.log(`Client ID: ${clientId || 'N/A'}`)
    console.log(`Client Name: ${client?.name || 'N/A'}`)
    console.log('='.repeat(80) + '\n')

    return {
        success: true
    }
}
