import { Suspense } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { PhoneRoutingRulesServer } from "./PhoneRoutingRulesServer"

interface PhoneRoutingRulesComponentProps {
    agentId: string
    agentName: string
    assignedNumbers: string[]
}

export function PhoneRoutingRulesComponent({ 
    agentId, 
    agentName, 
    assignedNumbers 
}: PhoneRoutingRulesComponentProps) {
    return (
        <Suspense
            fallback={
                <Card className="border border-dashed border-border/60">
                    <CardContent className="flex flex-col items-center gap-3 py-12 text-sm text-muted-foreground">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                        Loading routing rules…
                    </CardContent>
                </Card>
            }
        >
            <PhoneRoutingRulesServer 
                agentId={agentId}
                agentName={agentName}
                assignedNumbers={assignedNumbers}
            />
        </Suspense>
    )
}
