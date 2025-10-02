'use server'

import { VapiClient } from "@vapi-ai/server-sdk"
import { authorizedToAccessClient } from "../../clients/clientMembers"
import { revalidatePath } from "next/cache"
import { getUser } from "../../user/getUser"

interface OrchestrationDestination {
    type: 'assistant';
    assistantName: string;
    description: string;
    message: string;
}

interface OrchestrationMember {
    assistantId: string;
    assistantDestinations: OrchestrationDestination[];
}

interface OrchestrationData {
    id: string;
    name: string;
    phoneNumber: string | null;
    phoneNumberId: string | null;
    members: OrchestrationMember[];
}

export async function saveOrchestration(id: string, data: OrchestrationData) {
    try {
        console.log('=== Orchestration Save ===');
        console.log('ID:', data.id);
        console.log('Name:', data.name);
        console.log('Phone Number:', data.phoneNumber);
        console.log('Phone Number ID:', data.phoneNumberId);
        console.log('\nMembers:');
        
        data.members.forEach((member, index) => {
            console.log(`\n  Member ${index + 1}:`);
            console.log(`    Assistant ID: ${member.assistantId}`);
            console.log(`    Destinations (${member.assistantDestinations.length}):`);
            member.assistantDestinations.forEach((dest, destIndex) => {
                console.log(`      ${destIndex + 1}. To: ${dest.assistantName}`);
                console.log(`         When: ${dest.description}`);
                console.log(`         Message: ${dest.message}`);
            });
        });
        
        console.log('\n=========================\n');

        const { supabaseServerClient } = await getUser()

        // Get the workflow from database
        const { data: workflow, error: workflowError } = await supabaseServerClient
            .from('agent_workflows')
            .select('*, organization:organizations!inner(*)')
            .eq('id', id)
            .single()

        if (workflowError || !workflow) {
            throw new Error('Workflow not found')
        }

        // Check if organization has Vapi API key
        if (!workflow.organization.vapi_api_key) {
            throw new Error('Vapi API key not configured')
        }

        const vapiClient = new VapiClient({ token: workflow.organization.vapi_api_key })

        // Update the Vapi squad with the new members configuration
        const updatedSquad = await vapiClient.squads.update(workflow.platform_id, {
            name: data.name,
            members: data.members.map(member => ({
                assistantId: member.assistantId,
                assistantDestinations: member.assistantDestinations
            }))
        })

        console.log('Updated Vapi squad:', updatedSquad.id)

        // Handle phone number assignment if provided
        if (data.phoneNumberId) {
            console.log(`[WORKFLOW_PHONE] Assigning phone number ${data.phoneNumberId} to workflow...`)
            
            // Get the phone number from database
            const { data: phoneNumber, error: phoneError } = await supabaseServerClient
                .from('phone_numbers')
                .select('*')
                .eq('id', data.phoneNumberId)
                .eq('client_id', workflow.client_id)
                .single()

            if (phoneError || !phoneNumber) {
                console.error(`[WORKFLOW_PHONE] Phone number not found or access denied`, phoneError)
                throw new Error('Phone number not found or doesn\'t belong to this client')
            }

            console.log(`[WORKFLOW_PHONE] Phone number found: ${phoneNumber.phone_number}`)

            // Check if phone number is already assigned to something else
            if (phoneNumber.agent_id && phoneNumber.agent_id !== null) {
                throw new Error('Phone number is already assigned to an agent')
            }
            if (phoneNumber.workflow_id && phoneNumber.workflow_id !== id) {
                throw new Error('Phone number is already assigned to another workflow')
            }

            // Get Vapi phone numbers list
            console.log(`[WORKFLOW_PHONE] Fetching Vapi phone numbers...`)
            const vapiPhoneNumbers = await vapiClient.phoneNumbers.list()
            let existingVapiPhoneNumber = vapiPhoneNumbers.find((vn: any) => 
                vn.number === phoneNumber.phone_number
            )

            console.log(`[WORKFLOW_PHONE] Phone number ${existingVapiPhoneNumber ? 'found' : 'not found'} in Vapi`)

            // Create or update phone number in Vapi
            if (!existingVapiPhoneNumber) {
                console.log(`[WORKFLOW_PHONE] Creating new Twilio phone number in Vapi...`)
                
                if (!phoneNumber.twilio_account_sid || !phoneNumber.twilio_auth_token) {
                    throw new Error('Twilio credentials not found for this phone number')
                }

                const createPayload = {
                    provider: "twilio" as const,
                    number: phoneNumber.phone_number,
                    name: `${phoneNumber.phone_number} - ${data.name}`,
                    twilioAccountSid: phoneNumber.twilio_account_sid,
                    twilioAuthToken: phoneNumber.twilio_auth_token,
                    squadId: workflow.platform_id, // Use squadId instead of assistantId
                }

                existingVapiPhoneNumber = await vapiClient.phoneNumbers.create(createPayload)
                console.log(`[WORKFLOW_PHONE] Created phone number in Vapi - id: ${existingVapiPhoneNumber.id}`)
            } else {
                console.log(`[WORKFLOW_PHONE] Updating existing Vapi phone number to assign to squad ${workflow.platform_id}...`)
                
                const updatePayload = {
                    squadId: workflow.platform_id, // Use squadId instead of assistantId
                    name: `${phoneNumber.phone_number} - ${data.name}`,
                    assistantId: undefined, // Clear assistantId if it was set
                }

                await vapiClient.phoneNumbers.update(existingVapiPhoneNumber.id, updatePayload)
                console.log(`[WORKFLOW_PHONE] Updated Vapi phone number`)
            }

            // Update database to link phone number to workflow
            console.log(`[WORKFLOW_PHONE] Updating database to link phone number to workflow...`)
            const { error: phoneUpdateError } = await supabaseServerClient
                .from('phone_numbers')
                .update({ 
                    workflow_id: id,
                    agent_id: null // Ensure agent_id is null
                })
                .eq('id', data.phoneNumberId)

            if (phoneUpdateError) {
                console.error(`[WORKFLOW_PHONE] Failed to update phone number in database`, phoneUpdateError)
                throw new Error('Failed to assign phone number to workflow')
            }

            console.log(`[WORKFLOW_PHONE] Phone number successfully assigned to workflow`)
        }

        // Update the workflow in our database
        const { error: updateError } = await supabaseServerClient
            .from('agent_workflows')
            .update({
                name: data.name,
                data: updatedSquad
            })
            .eq('id', id)

        if (updateError) {
            console.error('Database update error:', updateError)
            throw new Error('Failed to update workflow in database')
        }

        // Revalidate the agents page
        revalidatePath(`/s/${workflow.organization_id}/app/agents`, 'page')
        
        return { success: true };
    } catch (error) {
        console.error('Error saving orchestration:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

export async function createWorkflow(name: string, clientId?: string) {
    try {
        const authorized = await authorizedToAccessClient(clientId)
        if (!authorized) {
            throw new Error('Unauthorized')
        }

        const { client, organization, supabaseServerClient } = authorized

        // Check if organization has Vapi API key configured
        if (!organization.vapi_api_key) {
            throw new Error('Vapi API key not configured for this organization')
        }

        const vapiClient = new VapiClient({ token: organization.vapi_api_key })

        // Create a squad (workflow) in Vapi
        const squad = await vapiClient.squads.create({
            name: name,
            members: [],
            membersOverrides: {}
        })

        console.log('Created Vapi squad:', squad.id)

        // Save the workflow to our database
        const { data: workflow, error } = await supabaseServerClient
            .from('agent_workflows')
            .insert({
                client_id: client.id,
                organization_id: organization.id,
                platform_id: squad.id,
                platform: 'vapi',
                name: name,
                data: squad
            })
            .select()
            .single()

        if (error) {
            console.error('Database error creating workflow:', error)
            throw new Error('Failed to save workflow to database')
        }

        // Revalidate the agents page to show the new workflow
        revalidatePath(`/s/${organization.id}/app/agents`, 'page')
        if (clientId) {
            revalidatePath(`/app/clients`, 'page')
        }

        return { 
            success: true, 
            orchestrationId: workflow.id 
        }
    } catch (error) {
        console.error('Error creating workflow:', error)
        
        // Re-throw with user-friendly message
        if (error instanceof Error) {
            throw new Error(error.message)
        }
        
        throw new Error('Failed to create workflow. Please try again.')
    }
}

export async function getWorkflows(clientId?: string) {
    try {
        const { userData, supabaseServerClient } = await getUser()
        
        if (!clientId) {
            clientId = userData.client_id
        }

        const { data: workflows, error } = await supabaseServerClient
            .from('agent_workflows')
            .select('*')
            .eq('client_id', clientId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching workflows:', error)
            throw new Error('Failed to fetch workflows')
        }

        return workflows || []
    } catch (error) {
        console.error('Error fetching workflows:', error)
        return []
    }
}

export async function getWorkflow(workflowId: string) {
    try {
        const { supabaseServerClient } = await getUser()

        const { data: workflow, error } = await supabaseServerClient
            .from('agent_workflows')
            .select('*')
            .eq('id', workflowId)
            .single()

        const { data: organization, error: organizationError } = await supabaseServerClient
            .from('organizations')
            .select('vapi_api_key')
            .eq('id', workflow.organization_id)
            .single()
            
        if (organizationError) {
            console.error('Error fetching organization:', organizationError)
            throw new Error('Failed to fetch organization')
        }

        const vapiClient = new VapiClient({ token: organization.vapi_api_key })
        const vapiWorkflow = await vapiClient.squads.get(workflow.platform_id)

        console.log('Vapi workflow:', vapiWorkflow)

        if (error) {
            console.error('Error fetching workflow:', error)
            throw new Error('Failed to fetch workflow')
        }

        return workflow
    } catch (error) {
        console.error('Error fetching workflow:', error)
        throw error
    }
}
