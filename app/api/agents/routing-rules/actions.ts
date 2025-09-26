'use server'

import { clientDashboardAuth } from "../../clients/clientDashboardAuth"
import { RoutingRule, RoutingRuleDTO, RoutingRulesResponse, RoutingRuleResponse } from "@/lib/types/routing-rules"
import { revalidatePath } from "next/cache"
import { removeAgentFromVapiPhoneNumbers, reassignAgentToVapiPhoneNumbers } from "./vapi-management"

// Helper function to convert HH:MM to HH:MM:SS format for database
function timeToDbFormat(time: string): string {
    return time.includes(':') && time.split(':').length === 2 ? `${time}:00` : time
}

// Helper function to convert HH:MM:SS to HH:MM format for client
function timeToClientFormat(time: string): string {
    return time.includes(':') ? time.split(':').slice(0, 2).join(':') : time
}

export async function getRoutingRules(agentId: string, clientId?: string): Promise<RoutingRulesResponse> {
    try {
        const { userData, supabaseServerClient, client } = await clientDashboardAuth(clientId)

        const { data: routingRules, error } = await supabaseServerClient
            .from('agent_routing_rules')
            .select('*')
            .eq('agent_id', agentId)
            .eq('client_id', client.id)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching routing rules:', error)
            return { success: false, error: 'Failed to fetch routing rules' }
        }

        return { success: true, data: routingRules || [] }
    } catch (error) {
        console.error('Error in getRoutingRules:', error)
        return { success: false, error: 'Failed to fetch routing rules' }
    }
}

export async function createRoutingRule(ruleData: RoutingRuleDTO, clientId?: string): Promise<RoutingRuleResponse> {
    try {
        const { userData, supabaseServerClient, client } = await clientDashboardAuth(clientId)

        // Check if this is the first routing rule for this agent
        const { data: existingRules, error: checkError } = await supabaseServerClient
            .from('agent_routing_rules')
            .select('id')
            .eq('agent_id', ruleData.agent_id)
            .eq('client_id', client.id)

        if (checkError) {
            console.error('Error checking existing routing rules:', checkError)
            return { success: false, error: 'Failed to check existing routing rules' }
        }

        const isFirstRule = !existingRules || existingRules.length === 0

        // Convert time format for database storage
        const dbRule = {
            ...ruleData,
            client_id: client.id,
            organization_id: client.organization_id,
            start_time: timeToDbFormat(ruleData.start_time),
            end_time: timeToDbFormat(ruleData.end_time)
        }

        console.log('dbRule', dbRule)

        const { data: routingRule, error } = await supabaseServerClient
            .from('agent_routing_rules')
            .insert(dbRule)
            .select()
            .single()

        if (error) {
            console.error('Error creating routing rule:', error)
            return { success: false, error: 'Failed to create routing rule' }
        }

        // If this is the first routing rule for the agent, remove agent assignment from VAPI
        if (isFirstRule) {
            console.log(`Creating first routing rule for agent ${ruleData.agent_id}, removing from VAPI phone numbers...`)
            const vapiResult = await removeAgentFromVapiPhoneNumbers(ruleData.agent_id)
            
            if (!vapiResult.success) {
                console.error('Failed to remove agent from VAPI phone numbers:', vapiResult.error)
                // Note: We don't fail the entire operation if VAPI update fails
                // The routing rule is still created, but we log the error
            } else {
                console.log('Successfully removed agent from VAPI phone numbers:', vapiResult.message)
            }
        }

        // Revalidate the deployment page
        revalidatePath(`/s/[orgId]/app/agents/[agentId]/deployment`)
        
        return { success: true, data: routingRule }
    } catch (error) {
        console.error('Error in createRoutingRule:', error)
        return { success: false, error: 'Failed to create routing rule' }
    }
}

export async function updateRoutingRule(ruleId: string, ruleData: Partial<RoutingRuleDTO>, clientId?: string): Promise<RoutingRuleResponse> {
    try {
        const { userData, supabaseServerClient, client } = await clientDashboardAuth(clientId)

        // Convert time format for database storage if provided
        const dbRule: any = { ...ruleData }
        if (ruleData.start_time) {
            dbRule.start_time = timeToDbFormat(ruleData.start_time)
        }
        if (ruleData.end_time) {
            dbRule.end_time = timeToDbFormat(ruleData.end_time)
        }

        const { data: routingRule, error } = await supabaseServerClient
            .from('agent_routing_rules')
            .update(dbRule)
            .eq('id', ruleId)
            .eq('client_id', client.id)
            .select()
            .single()

        if (error) {
            console.error('Error updating routing rule:', error)
            return { success: false, error: 'Failed to update routing rule' }
        }

        // Revalidate the deployment page
        revalidatePath(`/s/[orgId]/app/agents/[agentId]/deployment`)
        
        return { success: true, data: routingRule }
    } catch (error) {
        console.error('Error in updateRoutingRule:', error)
        return { success: false, error: 'Failed to update routing rule' }
    }
}

export async function deleteRoutingRule(ruleId: string, clientId?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { userData, supabaseServerClient, client } = await clientDashboardAuth(clientId)

        // First, get the routing rule to find the agent_id
        const { data: ruleToDelete, error: fetchError } = await supabaseServerClient
            .from('agent_routing_rules')
            .select('agent_id')
            .eq('id', ruleId)
            .eq('client_id', client.id)
            .single()

        if (fetchError || !ruleToDelete) {
            console.error('Error fetching routing rule to delete:', fetchError)
            return { success: false, error: 'Routing rule not found' }
        }

        const agentId = ruleToDelete.agent_id

        // Delete the routing rule
        const { error } = await supabaseServerClient
            .from('agent_routing_rules')
            .delete()
            .eq('id', ruleId)
            .eq('client_id', client.id)

        if (error) {
            console.error('Error deleting routing rule:', error)
            return { success: false, error: 'Failed to delete routing rule' }
        }

        // Check if this was the last routing rule for this agent
        const { data: remainingRules, error: checkError } = await supabaseServerClient
            .from('agent_routing_rules')
            .select('id')
            .eq('agent_id', agentId)
            .eq('client_id', client.id)

        if (checkError) {
            console.error('Error checking remaining routing rules:', checkError)
            // Don't fail the delete operation if we can't check remaining rules
        } else {
            const isLastRule = !remainingRules || remainingRules.length === 0

            // If this was the last routing rule for the agent, reassign agent to VAPI phone numbers
            if (isLastRule) {
                console.log(`Deleted last routing rule for agent ${agentId}, reassigning to VAPI phone numbers...`)
                const vapiResult = await reassignAgentToVapiPhoneNumbers(agentId)
                
                if (!vapiResult.success) {
                    console.error('Failed to reassign agent to VAPI phone numbers:', vapiResult.error)
                    // Note: We don't fail the entire operation if VAPI update fails
                    // The routing rule is still deleted, but we log the error
                } else {
                    console.log('Successfully reassigned agent to VAPI phone numbers:', vapiResult.message)
                }
            }
        }

        // Revalidate the deployment page
        revalidatePath(`/s/[orgId]/app/agents/[agentId]/deployment`)
        
        return { success: true }
    } catch (error) {
        console.error('Error in deleteRoutingRule:', error)
        return { success: false, error: 'Failed to delete routing rule' }
    }
}

export async function toggleRoutingRule(ruleId: string, enabled: boolean, clientId?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { userData, supabaseServerClient, client } = await clientDashboardAuth(clientId)

        const { error } = await supabaseServerClient
            .from('agent_routing_rules')
            .update({ enabled })
            .eq('id', ruleId)
            .eq('client_id', client.id)

        if (error) {
            console.error('Error toggling routing rule:', error)
            return { success: false, error: 'Failed to update routing rule' }
        }

        // Revalidate the deployment page
        revalidatePath(`/s/[orgId]/app/agents/[agentId]/deployment`)
        
        return { success: true }
    } catch (error) {
        console.error('Error in toggleRoutingRule:', error)
        return { success: false, error: 'Failed to update routing rule' }
    }
}