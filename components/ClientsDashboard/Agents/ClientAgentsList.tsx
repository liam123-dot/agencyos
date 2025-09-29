import { Suspense } from "react"
import { ClientAgentsListServer } from "./ClientAgentsListServer"
import { Card, CardContent, CardHeader } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"

export default function ClientAgentsList({ clientId, orgId }: { clientId?: string; orgId?: string }) {
    return (
        <Suspense fallback={<ClientAgentsListSkeleton />}>
            <ClientAgentsListServer clientId={clientId} orgId={orgId} />
        </Suspense>
    )
}

function ClientAgentsListSkeleton() {
    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-10 w-40" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                {/* Column Headers */}
                <div className="grid grid-cols-[1fr_200px_100px_150px] gap-4 px-6 py-3 bg-muted/50 border-b border-border/60">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                    <div className="flex justify-end">
                        <Skeleton className="h-4 w-16" />
                    </div>
                </div>

                {/* Agent Rows */}
                <div className="divide-y divide-border/40">
                    {[1, 2, 3, 4].map((row) => (
                        <div key={row} className="grid grid-cols-[1fr_200px_100px_150px] gap-4 px-6 py-4">
                            <div className="flex items-center">
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-8" />
                            </div>
                            <div className="flex items-center justify-end gap-2">
                                <Skeleton className="h-4 w-4 rounded" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}