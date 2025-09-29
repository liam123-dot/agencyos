"use server"

import { getClientAgents } from "@/app/api/agents/getClientAgents"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import Link from "next/link"
import { headers } from "next/headers"
import { Activity, CalendarDays, ChevronRight, Phone, Users } from "lucide-react"
import { CreateAgentButton } from "./CreateAgentButton"

type AgentRecord = {
    id: string
    data?: { name?: string }
    updated_at: string
    phone_numbers?: string | null
    calls_count?: number
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
})

function formatPhoneNumber(phone?: string | null) {
    if (!phone) {
        return "No number assigned"
    }
    return phone
}

export async function ClientAgentsListServer({ clientId, orgId }: { clientId?: string; orgId?: string }) {
    const agents = ((await getClientAgents(clientId)) ?? []) as AgentRecord[]

    const totalAgents = agents.length

    const headersList = await headers()
    const isMainDomain = headersList.get("x-is-main-domain") === "true"
    const shouldUsePlatformPrefix = isMainDomain && !!orgId
    const baseUrl = shouldUsePlatformPrefix ? `/s/${orgId}` : ""
    const queryString = clientId ? `?client_id=${clientId}` : ""

    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Agent Directory</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {totalAgents} agent{totalAgents === 1 ? '' : 's'}
                        </p>
                    </div>
                    <CreateAgentButton clientId={clientId} />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Column Headers */}
                <div className="grid grid-cols-[1fr_200px_100px_150px] gap-4 px-6 py-3 border-b border-border/60">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Agent
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Phone Number
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Calls
                    </div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                        Modified
                    </div>
                </div>

                {/* Agent Rows */}
                {agents.length > 0 ? (
                    <div className="divide-y divide-border/40">
                        {agents.map((agent) => {
                            const displayName = agent.data?.name?.trim() || "Unnamed Agent"
                            const agentUrl = `${baseUrl}/app/agents/${agent.id}${queryString}`
                            const phoneLabel = formatPhoneNumber(agent.phone_numbers)
                            const formattedDate = agent.updated_at
                                ? dateFormatter.format(new Date(agent.updated_at))
                                : "—"

                            return (
                                <Link 
                                    key={agent.id} 
                                    href={agentUrl} 
                                    prefetch={true}
                                    className="grid grid-cols-[1fr_200px_100px_150px] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group"
                                >
                                    <div className="flex items-center min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                            {displayName}
                                        </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        <Phone className="h-4 w-4 flex-shrink-0" />
                                        <span className="truncate">{phoneLabel}</span>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        <span>{agent.calls_count ?? 0}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                        <CalendarDays className="h-4 w-4 flex-shrink-0" />
                                        <span>{formattedDate}</span>
                                        <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="py-16 px-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="rounded-full border border-dashed border-border/80 bg-muted/20 p-4 text-muted-foreground">
                                <Users className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No agents yet</p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                When you add an agent to this client workspace, their details and call activity will appear here.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}