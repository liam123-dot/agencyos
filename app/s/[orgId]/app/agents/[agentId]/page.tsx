import { getAgent } from "@/app/api/agents/getAgent"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Clock, Phone } from "lucide-react"
import { redirect } from "next/navigation"

function formatDuration(seconds: number) {
    if (seconds === 0) return "0s"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes === 0) return `${remainingSeconds}s`
    return `${minutes}m ${remainingSeconds}s`
}

export default async function AgentOverviewPage({
    params,
}: {
    params: Promise<{ orgId: string; agentId: string }>
}) {
    const { agentId } = await params
    redirect(`/app/agents/${agentId}/configuration`)

    try {
        const agent = await getAgent(agentId)
        const displayName = agent.data?.name || agent.platform_id || "Unnamed Agent"

        const performanceStats = [
            {
                label: "Total calls",
                value: agent.calls_total ?? 0,
                icon: Activity,
            },
            {
                label: "Average duration",
                value: formatDuration(agent.average_duration_seconds ?? 0),
                icon: Clock,
            },
            {
                label: "Assigned numbers",
                value: agent.assigned_numbers_count ?? 0,
                icon: Phone,
            },
        ]

        return (
            <div className="space-y-8">
                <section className="space-y-6">
                    <div className="flex flex-col gap-3">
                        <h1 className="text-3xl font-semibold tracking-tight text-foreground">{displayName}</h1>
                        <p className="text-base text-muted-foreground">
                            Monitor performance and configure voice agent behavior.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {performanceStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl border border-border/50 bg-card p-6"
                            >
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>{stat.label}</span>
                                    <stat.icon className="h-4 w-4" />
                                </div>
                                <p className="mt-3 text-3xl font-semibold text-foreground">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        )
    } catch (error) {
        return (
            <div className="space-y-6">
                <Card className="border-destructive/20">
                    <CardContent className="py-12 text-center text-sm text-destructive">
                        Failed to load agent details. Please refresh the page and try again.
                    </CardContent>
                </Card>
            </div>
        )
    }
}
