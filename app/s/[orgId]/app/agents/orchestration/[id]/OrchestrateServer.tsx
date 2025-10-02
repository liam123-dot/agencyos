'use server'

import { getClientAgents } from "@/app/api/agents/getClientAgents"
import { getUnassignedPhoneNumbers } from "@/app/api/phone-numbers/getUnassignedPhoneNumbers"
import { getWorkflow } from "@/app/api/agents/orchestration/orchestrationActions"
import { getUser } from "@/app/api/user/getUser"
import Orchestrate from "./Orchestrate"

export async function OrchestrateServer({ workflowId }: { workflowId: string }) {
    const workflow = await getWorkflow(workflowId)
    const agents = await getClientAgents(workflow.client_id) ?? []
    const phoneNumbersResult = await getUnassignedPhoneNumbers(workflow.client_id)
    let phoneNumbers = phoneNumbersResult.success ? phoneNumbersResult.phoneNumbers : []

    // Also fetch the phone number assigned to this workflow (if any)
    const { supabaseServerClient } = await getUser()
    const { data: assignedPhoneNumber } = await supabaseServerClient
        .from('phone_numbers')
        .select('*')
        .eq('workflow_id', workflowId)
        .single()

    // Add the assigned phone number to the list if it exists
    if (assignedPhoneNumber) {
        phoneNumbers = [assignedPhoneNumber, ...phoneNumbers]
    }

    return <Orchestrate 
        orchestrationId={workflow.id}
        agents={agents} 
        phoneNumbers={phoneNumbers} 
        workflow={workflow}
    />
}