"use server"

import { getClientAgents } from "@/app/api/agents/getClientAgents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { headers } from "next/headers"
import { Activity, CalendarDays, ChevronRight, Phone, Users } from "lucide-react"

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

function getInitials(name?: string | null) {
    if (!name) {
        return "AG"
    }
    const cleanName = name.trim()
    if (!cleanName) {
        return "AG"
    }
    const segments = cleanName.split(/\s+/)
    const initials = segments
        .slice(0, 2)
        .map((segment) => segment[0]?.toUpperCase() ?? "")
        .join("")
    return initials || "AG"
}

function formatPhoneNumber(phone?: string | null) {
    if (!phone) {
        return "No number assigned"
    }
    return phone
}

export async function ClientAgentsListServer({ clientId, orgId }: { clientId?: string; orgId?: string }) {
    const agents = ((await getClientAgents(clientId)) ?? []) as AgentRecord[]

    const totalAgents = agents.length
    const totalCalls = agents.reduce((sum, agent) => sum + (agent.calls_count ?? 0), 0)
    const assignedNumbers = agents.filter((agent) => !!agent.phone_numbers).length
    const mostRecentUpdate = agents.reduce<Date | null>((latest, agent) => {
        const updatedAt = agent.updated_at ? new Date(agent.updated_at) : null
        if (!updatedAt || Number.isNaN(updatedAt.getTime())) {
            return latest
        }
        if (!latest || updatedAt > latest) {
            return updatedAt
        }
        return latest
    }, null)
    const lastUpdatedLabel = mostRecentUpdate ? dateFormatter.format(mostRecentUpdate) : "No activity yet"

    const headersList = await headers()
    const isMainDomain = headersList.get("x-is-main-domain") === "true"
    const shouldUsePlatformPrefix = isMainDomain && !!orgId
    const baseUrl = shouldUsePlatformPrefix ? `/s/${orgId}` : ""
    const queryString = clientId ? `?client_id=${clientId}` : ""

    return (
        <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="gap-6 pb-0">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <CardTitle className="text-3xl font-semibold tracking-tight">Agents</CardTitle>
                        <CardDescription className="max-w-2xl text-base">
                            Keep track of the people powering your conversations, their call volume, and recent updates.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-sm text-muted-foreground">
                        <CalendarDays className="h-4 w-4" />
                        <span>Last updated {lastUpdatedLabel}</span>
                    </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-background to-background p-5">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Total agents</span>
                            <Users className="h-4 w-4" />
                        </div>
                        <p className="mt-2 text-3xl font-semibold">{totalAgents}</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-muted/30 p-5">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <span>Total calls handled</span>
                            <Activity className="h-4 w-4" />
                        </div>
                        <p className="mt-2 text-3xl font-semibold">{totalCalls}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="mt-8">
                <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/30">
                                <TableHead className="w-[240px] text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Agent
                                </TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Phone number
                                </TableHead>
                                <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Calls
                                </TableHead>
                                <TableHead className="text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                    Modified
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {agents.length > 0 ? (
                                agents.map((agent) => {
                                    const displayName = agent.data?.name?.trim() || "Unnamed Agent"
                                    const agentUrl = `${baseUrl}/app/agents/${agent.id}${queryString}`
                                    const initials = getInitials(agent.data?.name)
                                    const phoneLabel = formatPhoneNumber(agent.phone_numbers)
                                    const formattedDate = agent.updated_at
                                        ? dateFormatter.format(new Date(agent.updated_at))
                                        : "—"

                                    return (
                                        <Link key={agent.id} href={agentUrl} className="contents" prefetch={true}>
                                            <TableRow className="group border-b border-border/40 transition hover:bg-muted/40 cursor-pointer">
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-4">
                                                        {/* <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-sm font-semibold shadow-sm">
                                                            {initials}
                                                        </div> */}
                                                        <div>
                                                            <p className="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">Agent ID • {agent.id.slice(0, 8)}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground transition group-hover:text-foreground">
                                                        <Phone className="h-4 w-4" />
                                                        <span>{phoneLabel}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4">
                                                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                                        <Activity className="h-4 w-4 text-muted-foreground" />
                                                        <span>{agent.calls_count ?? 0}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2 text-sm text-muted-foreground transition group-hover:text-foreground">
                                                        <CalendarDays className="h-4 w-4" />
                                                        <span>{formattedDate}</span>
                                                        <ChevronRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100" />
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        </Link>
                                    )
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="py-16">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <div className="rounded-full border border-dashed border-border/80 bg-muted/20 p-4 text-muted-foreground">
                                                <Users className="h-6 w-6" />
                                            </div>
                                            <p className="text-sm font-semibold text-foreground">No agents yet</p>
                                            <p className="max-w-sm text-sm text-muted-foreground">
                                                When you add an agent to this client workspace, their details and call activity will appear here.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}