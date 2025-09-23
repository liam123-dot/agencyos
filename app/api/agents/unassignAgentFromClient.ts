'use server'

import { VapiClient } from "@vapi-ai/server-sdk"
import { authorizedToAccessClient } from "../clients/clientMembers"
import { getOrg } from "../user/selected-organization/getOrg"
import { revalidatePath } from "next/cache"

export async function unassignVapiAgentFromClient(agentId: string) {
    const { organization, supabaseServerClient } = await getOrg()
    if (!organization) {
        throw new Error('Organization not found')
    }
    
    // Get the agent to verify it exists and get client_id
    const { data: agent, error: agentError } = await supabaseServerClient
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single()
    
    if (agentError || !agent) {
        throw new Error('Agent not found')
    }
    
    const authorized = await authorizedToAccessClient(agent.client_id)
    if (!authorized) {
        throw new Error('Unauthorized')
    }

    // First, unassign all phone numbers from this agent
    console.log('Finding phone numbers assigned to agent:', agentId)
    const { data: phoneNumbers, error: phoneError } = await supabaseServerClient
        .from('phone_numbers')
        .select('*')
        .eq('agent_id', agentId)
    
    if (phoneError) {
        console.error('Error fetching phone numbers:', phoneError)
        throw new Error('Failed to fetch agent phone numbers')
    }

    // Unassign all phone numbers from Vapi and database
    if (phoneNumbers && phoneNumbers.length > 0) {
        console.log(`Found ${phoneNumbers.length} phone numbers to unassign`)
        
        if (agent.platform === 'vapi' && agent.platform_id && organization.vapi_api_key) {
            try {
                const vapiClient = new VapiClient({token: organization.vapi_api_key})
                
                // Get all Vapi phone numbers to find matches
                const vapiPhoneNumbers = await vapiClient.phoneNumbers.list()
                
                // Unassign each phone number from Vapi
                for (const phoneNumber of phoneNumbers) {
                    const existingVapiPhoneNumber = vapiPhoneNumbers.find((vn: any) => 
                        vn.number === phoneNumber.phone_number
                    )
                    
                    if (existingVapiPhoneNumber) {
                        console.log(`Unassigning phone number ${phoneNumber.phone_number} from Vapi`)
                        await vapiClient.phoneNumbers.update(existingVapiPhoneNumber.id, {
                            assistantId: undefined,
                            name: phoneNumber.phone_number
                        })
                    }
                }
            } catch (error) {
                console.warn('Failed to unassign phone numbers from Vapi:', error)
                // Continue with database operations even if Vapi fails
            }
        }
        
        // Unassign phone numbers in database
        const { error: phoneUpdateError } = await supabaseServerClient
            .from('phone_numbers')
            .update({ agent_id: null })
            .eq('agent_id', agentId)
        
        if (phoneUpdateError) {
            console.error('Failed to unassign phone numbers from database:', phoneUpdateError)
            throw new Error('Failed to unassign phone numbers from agent')
        }
        
        // console.log(`Successfully unassigned ${phoneNumbers.length} phone numbers`)
    }

    // Remove webhook URL from Vapi agent if it's a Vapi agent
    if (agent.platform === 'vapi' && agent.platform_id && organization.vapi_api_key) {
        try {
            const vapiClient = new VapiClient({token: organization.vapi_api_key})
            
            // Remove the webhook URL by updating the agent
            await vapiClient.assistants.update(agent.platform_id, {
                server: undefined
            })
        } catch (error) {
            console.warn('Failed to remove webhook from Vapi agent:', error)
            // Continue with database deletion even if Vapi update fails
        }
    }
    
    // Delete the agent from our database
    console.log('Attempting to delete agent:', { agentId, organizationId: organization.id, clientId: agent.client_id })
    const { error: deleteError } = await supabaseServerClient
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('organization_id', organization.id)
    
    if (deleteError) {
        console.error('Database deletion error:', deleteError)
        throw new Error(`Failed to unassign agent from client: ${deleteError.message}`)
    }

    revalidatePath(`/app/clients/${agent.client_id}/agents`)
    
    // Return a plain object instead of the database result
    return { success: true }
}