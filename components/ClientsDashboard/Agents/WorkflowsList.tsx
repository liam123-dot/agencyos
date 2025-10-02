import { Suspense } from "react"
import { WorkflowsListServer } from "./WorkflowsListServer"
import { Card, CardContent, CardHeader } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"

export default function WorkflowsList({ clientId, orgId }: { clientId?: string; orgId?: string }) {
    return (
        <Suspense fallback={<WorkflowsListSkeleton />}>
            <WorkflowsListServer clientId={clientId} orgId={orgId} />
        </Suspense>
    )
}

function WorkflowsListSkeleton() {
    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60 pb-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-10 w-44" />
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                    {[1, 2, 3].map((row) => (
                        <div key={row} className="px-6 py-4">
                            <Skeleton className="h-4 w-48" />
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

