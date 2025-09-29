import { Suspense } from "react"
import { getAgent } from "@/app/api/agents/getAgent"
import { getAgentPhoneNumbers } from "@/app/api/phone-numbers/getAgentPhoneNumbers"
import { AgentPhoneNumbers } from "@/components/agents/AgentPhoneNumbers"
import { PhoneRoutingRulesComponent } from "@/components/agents/PhoneRoutingRulesComponent"
import { Card, CardContent } from "@/components/ui/card"

export default async function AgentDeploymentPage({
    params,
}: {
    params: Promise<{ orgId: string; agentId: string }>
}) {
    const { agentId } = await params
    const agent = await getAgent(agentId)
    const phoneNumbersResult = await getAgentPhoneNumbers(agentId)

    const assignedNumbers = phoneNumbersResult.success 
        ? (phoneNumbersResult.assignedToThisAgent || []).map(num => num.phone_number)
        : []

    return (
        <div className="space-y-8">
            <section className="space-y-4">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground">Deployment</h1>
                    <p className="text-base text-muted-foreground">
                        Manage phone number assignments and routing rules for {agent.data?.name || agent.platform_id || "this agent"}.
                    </p>
                </div>
            </section>

            <Suspense
                fallback={
                    <Card className="border border-dashed border-border/60">
                        <CardContent className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                            Loading phone number assignments…
                        </CardContent>
                    </Card>
                }
            >
                <AgentPhoneNumbers agentId={agentId} />
            </Suspense>

            {/* Phone Routing Rules - Only show if at least one number is connected */}
            {assignedNumbers.length > 0 && (
                <PhoneRoutingRulesComponent 
                    agentId={agentId}
                    agentName={agent.data?.name || agent.platform_id || "Agent"}
                    assignedNumbers={assignedNumbers}
                />
            )}
        </div>
    )
}
