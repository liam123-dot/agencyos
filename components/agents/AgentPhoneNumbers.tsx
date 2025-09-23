'use server'

import { getAgentPhoneNumbers } from "@/app/api/phone-numbers/getAgentPhoneNumbers";
import { AgentPhoneNumbersClient } from "./AgentPhoneNumbersClient";

interface AgentPhoneNumbersProps {
    agentId: string;
}

export async function AgentPhoneNumbers({ agentId }: AgentPhoneNumbersProps) {
    const result = await getAgentPhoneNumbers(agentId);
    
    if (!result.success) {
        return (
            <div className="text-red-500">
                Failed to load phone numbers: {result.error}
            </div>
        );
    }

    return (
        <AgentPhoneNumbersClient 
            agentId={agentId}
            assignedNumbers={result.assignedToThisAgent || []}
            availableNumbers={result.availableToAssign || []}
            agentName={result.agent?.data?.name || 'Agent'}
        />
    );
}
