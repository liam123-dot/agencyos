import { getRoutingRules } from "@/app/api/agents/routing-rules/actions"
import { PhoneRoutingRulesClient } from "./PhoneRoutingRules"
import { RoutingRule, ClientRoutingRule } from "@/lib/types/routing-rules"

interface PhoneRoutingRulesServerProps {
    agentId: string
    agentName: string
    assignedNumbers: string[]
}

// Helper function to convert database format to client format
function convertToClientFormat(dbRules: RoutingRule[]): ClientRoutingRule[] {
    return dbRules.map((rule, index) => ({
        id: rule.id,
        name: rule.name,
        enabled: rule.enabled,
        priority: index + 1, // Simple priority based on order
        timeRange: {
            start: rule.start_time.slice(0, 5), // Convert HH:MM:SS to HH:MM
            end: rule.end_time.slice(0, 5)     // Convert HH:MM:SS to HH:MM
        },
        days: rule.days,
        routeTo: rule.route_to
    }))
}

export async function PhoneRoutingRulesServer({ 
    agentId, 
    agentName, 
    assignedNumbers 
}: PhoneRoutingRulesServerProps) {
    const result = await getRoutingRules(agentId)
    
    if (!result.success) {
        return (
            <div className="text-red-500 p-4">
                Failed to load routing rules: {result.error}
            </div>
        )
    }

    const clientRules = convertToClientFormat(result.data || [])

    return (
        <PhoneRoutingRulesClient 
            agentId={agentId}
            agentName={agentName}
            assignedNumbers={assignedNumbers}
            initialRules={clientRules}
        />
    )
}
