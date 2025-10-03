"use server"

import { CreateWorkflowButton } from "./CreateWorkflowButton"
import { getWorkflows } from "@/app/api/agents/orchestration/orchestrationActions"
import { getUser } from "@/app/api/user/getUser"
import Link from "next/link"
import { headers } from "next/headers"
import { CalendarDays, ChevronRight, Phone, Users, Workflow } from "lucide-react"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
})

export async function WorkflowsListServer({ clientId, orgId }: { clientId?: string; orgId?: string }) {
    const workflows = await getWorkflows(clientId)
    const totalWorkflows = workflows.length

    // Fetch phone numbers for all workflows
    const { supabaseServerClient } = await getUser()
    const { data: phoneNumbers } = await supabaseServerClient
        .from('phone_numbers')
        .select('id, phone_number, workflow_id')
        .not('workflow_id', 'is', null)

    // Create a map of workflow_id to phone_number
    const phoneNumberMap = new Map(
        phoneNumbers?.map(pn => [pn.workflow_id, pn.phone_number]) || []
    )

    const headersList = await headers()
    const isMainDomain = headersList.get("x-is-main-domain") === "true"
    const shouldUsePlatformPrefix = isMainDomain && !!orgId
    const baseUrl = shouldUsePlatformPrefix ? `/s/${orgId}` : ""

    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-border/60">
                <div>
                    <h2 className="text-xl font-semibold">Agent Workflows</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {totalWorkflows} workflow{totalWorkflows === 1 ? '' : 's'}
                    </p>
                </div>
                <CreateWorkflowButton clientId={clientId} />
            </div>

            <div>
                {totalWorkflows === 0 ? (
                    <div className="py-16 px-6">
                        <div className="flex flex-col items-center gap-3 text-center">
                            <div className="rounded-full border border-dashed border-border/80 bg-muted/20 p-4 text-muted-foreground">
                                <Workflow className="h-6 w-6" />
                            </div>
                            <p className="text-sm font-semibold text-foreground">No workflows yet</p>
                            <p className="max-w-sm text-sm text-muted-foreground">
                                Create your first agent workflow to orchestrate multi-agent conversations.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Column Headers */}
                        <div className="grid grid-cols-[1fr_200px_100px_150px] gap-4 px-6 py-3 border-b border-border/60">
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Workflow
                            </div>
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Phone Number
                            </div>
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Agents
                            </div>
                            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-right">
                                Modified
                            </div>
                        </div>

                        {/* Workflow Rows */}
                        <div className="divide-y divide-border/40">
                            {workflows.map((workflow) => {
                                const workflowUrl = `${baseUrl}/app/agents/orchestration/${workflow.id}`
                                const formattedDate = workflow.updated_at
                                    ? dateFormatter.format(new Date(workflow.updated_at))
                                    : "—"
                                const agentCount = workflow.data?.members?.length || 0
                                const phoneNumber = phoneNumberMap.get(workflow.id)

                                return (
                                    <Link
                                        key={workflow.id}
                                        href={workflowUrl}
                                        prefetch={true}
                                        className="grid grid-cols-[1fr_200px_100px_150px] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors group"
                                    >
                                        <div className="flex items-center min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {workflow.name}
                                            </p>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                                            <Phone className="h-4 w-4 flex-shrink-0" />
                                            <span className="truncate">{phoneNumber || 'No number assigned'}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span>{agentCount}</span>
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
                    </>
                )}
            </div>
        </>
    )
}

