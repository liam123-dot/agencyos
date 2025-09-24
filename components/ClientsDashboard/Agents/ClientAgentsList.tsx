import { Suspense } from "react"
import { ClientAgentsListServer } from "./ClientAgentsListServer"
import { Card, CardContent, CardHeader } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"

export default function ClientAgentsList({ clientId, orgId }: { clientId?: string; orgId?: string }) {
    return (
        <Suspense fallback={<ClientAgentsListSkeleton />}>
            <ClientAgentsListServer clientId={clientId} orgId={orgId} />
        </Suspense>
    )
}

function ClientAgentsListSkeleton() {
    return (
        <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="gap-6 pb-0">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-10 w-48 rounded-full" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                    {[1, 2, 3].map((item) => (
                        <div key={item} className="rounded-2xl border border-border/80 bg-muted/20 p-5">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="mt-3 h-8 w-20" />
                            <Skeleton className="mt-2 h-3 w-32" />
                        </div>
                    ))}
                </div>
            </CardHeader>
            <CardContent className="mt-8">
                <div className="overflow-hidden rounded-2xl border border-border/60">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/60 bg-muted/30">
                                <TableHead className="w-[240px]"><Skeleton className="h-4 w-24" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                                <TableHead><Skeleton className="h-4 w-16" /></TableHead>
                                <TableHead className="text-right"><Skeleton className="ml-auto h-4 w-24" /></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[1, 2, 3, 4].map((row) => (
                                <TableRow key={row} className="border-b border-border/40">
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <Skeleton className="h-12 w-12 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-32" />
                                                <Skeleton className="h-3 w-24" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-40" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-16" />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end">
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    )
}