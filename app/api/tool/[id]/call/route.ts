import { createServerClient } from "@/lib/supabase/server"
import { executeAction } from "@/app/s/[orgId]/api/connect/token/pipedream-actions"

/**
 * External App Tool Execution Endpoint
 * 
 * This endpoint receives tool calls from Vapi and:
 * 1. Fetches the tool configuration from the database
 * 2. Extracts AI-provided parameters from the request
 * 3. Merges them with static configuration
 * 4. Returns the final merged parameters ready for action execution
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: toolDbId } = await params
    
    let requestData
    try {
        requestData = await request.json()
    } catch (error) {
        console.error('❌ Invalid JSON in request')
        return new Response(
            JSON.stringify({ 
                error: 'Invalid JSON in request body'
            }), 
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    console.log('🔧 Tool execution request for DB ID:', toolDbId)
    console.log('📦 Request data:', JSON.stringify(requestData, null, 2))

    // Initialize Supabase client for database access
    const supabaseServerClient = await createServerClient()

    // Fetch the specific external app tool from database
    const { data: tool, error: toolError } = await supabaseServerClient
        .from('external_app_tools')
        .select('*')
        .eq('id', toolDbId)
        .single()

    if (toolError || !tool) {
        console.error('❌ Failed to fetch external app tool:', toolError)
        return new Response(
            JSON.stringify({ 
                error: 'Tool not found',
                details: toolError?.message
            }), 
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
    }

    console.log(`✅ Found tool: ${tool.name} (${tool.app_name} - ${tool.action_name})`)

    // ===================================================================
    // EXTRACT AI-PROVIDED PARAMETERS
    // Vapi sends function arguments in message.toolCalls[0].function.arguments
    // ===================================================================
    
    // The request from Vapi contains the function call data in message.toolCalls array
    const toolCall = requestData.message?.toolCalls?.[0]
    
    if (!toolCall) {
        console.error('❌ No tool call found in request')
        return new Response(
            JSON.stringify({ 
                error: 'Invalid request format - missing message.toolCalls[0]'
            }), 
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    console.log('📞 Tool call details:', JSON.stringify(toolCall, null, 2))

    const functionArguments = toolCall.function?.arguments
    
    if (!functionArguments) {
        console.error('❌ No function arguments found in tool call')
        return new Response(
            JSON.stringify({ 
                error: 'Invalid request format - missing function.arguments in tool call'
            }), 
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    // Parse the arguments if they're a string, otherwise use them directly
    let aiProvidedParams
    try {
        aiProvidedParams = typeof functionArguments === 'string' 
            ? JSON.parse(functionArguments) 
            : functionArguments
    } catch (error) {
        console.error('❌ Failed to parse function arguments:', error)
        return new Response(
            JSON.stringify({ 
                error: 'Invalid function arguments - not valid JSON'
            }), 
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    console.log('🤖 AI-provided parameters:', JSON.stringify(aiProvidedParams, null, 2))

    // ===================================================================
    // MERGE CONFIGURATIONS
    // Combine static config (pre-configured values) with AI parameters
    // Static config takes precedence for security/business logic
    // ===================================================================
    
    const staticConfig = tool.static_config || {}
    
    // Merge configurations: AI params go first, then override with static config
    const mergedParams = {
        ...aiProvidedParams,
        ...staticConfig  // Static config overrides AI params for security
    }

    console.log('🔀 Merged parameters:', JSON.stringify(mergedParams, null, 2))

    // ===================================================================
    // PREPARE CONFIGURED PROPS FOR PIPEDREAM
    // Add authentication if account_id is present
    // ===================================================================
    
    const configuredProps: Record<string, any> = { ...mergedParams }
    
    // If the tool has an account_id, add it to the configured props
    // The app field name is stored in props_config with mode='fixed' and the accountId as value
    if (tool.account_id) {
        const propsConfig = tool.props_config || {}
        
        // Find the app field name from propsConfig
        // It's stored with the accountId as its value
        const appFieldName = Object.keys(propsConfig).find(
            key => propsConfig[key]?.value === tool.account_id
        )
        
        if (appFieldName) {
            configuredProps[appFieldName] = {
                authProvisionId: tool.account_id
            }
            console.log(`🔐 Added app auth field: ${appFieldName}`)
        } else {
            // Fallback to using app slug if field name not found (for backward compatibility)
            console.warn(`⚠️ App field name not found in props_config, using app slug: ${tool.app}`)
            configuredProps[tool.app] = {
                authProvisionId: tool.account_id
            }
        }
    }

    console.log('📋 Final parameters that will be passed to action:')
    console.log(`   Tool: ${tool.name}`)
    console.log(`   App: ${tool.app_name} (${tool.app})`)
    console.log(`   Action: ${tool.action_name} (${tool.action_key})`)
    console.log(`   Client: ${tool.client_id}`)
    console.log(`   Account: ${tool.account_id}`)
    console.log(`   Configured Props:`, JSON.stringify(configuredProps, null, 2))

    // ===================================================================
    // EXECUTE THE PIPEDREAM ACTION
    // ===================================================================
    
    if (!tool.client_id) {
        console.error('❌ Missing client_id in tool configuration')
        return new Response(
            JSON.stringify({ 
                error: 'Tool configuration error - missing client_id'
            }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }

    if (!tool.action_key) {
        console.error('❌ Missing action_key in tool configuration')
        return new Response(
            JSON.stringify({ 
                error: 'Tool configuration error - missing action_key'
            }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const executionResult = await executeAction(
        tool.client_id,
        tool.action_key,
        configuredProps
    )

    if (!executionResult.success) {
        console.error('❌ Action execution failed:', executionResult.error)
        return new Response(
            JSON.stringify({ 
                error: 'Action execution failed',
                details: executionResult.error
            }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }

    console.log('✅ Action executed successfully')

    // ===================================================================
    // RETURN EXECUTION RESULT
    // ===================================================================
    
    // Format response according to Vapi's expected format
    const response = {
        results: [
            {
                toolCallId: toolCall.id,
                result: executionResult.returnValue
            }
        ]
    }
    
    console.log('📤 Returning response:', JSON.stringify(response, null, 2))
    
    return new Response(
        JSON.stringify(response), 
        { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        }
    )
}

/**
 * GET endpoint for debugging - shows tool configuration
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id: toolDbId } = await params
    
    const supabaseServerClient = await createServerClient()
    
    const { data: tool, error } = await supabaseServerClient
        .from('external_app_tools')
        .select('*')
        .eq('id', toolDbId)
        .single()
    
    if (error || !tool) {
        return new Response(
            JSON.stringify({ error: 'Tool not found' }), 
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        )
    }
    
    return new Response(
        JSON.stringify({ 
            id: tool.id,
            name: tool.name,
            app: tool.app_name,
            action: tool.action_name,
            functionSchema: tool.function_schema,
            staticConfig: tool.static_config,
            createdAt: tool.created_at,
            status: 'ready'
        }, null, 2), 
        { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        }
    )
}