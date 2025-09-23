import { Suspense } from "react"
import { ClientAgentsListServer } from "./ClientAgentsListServer"
import { Card, CardContent, CardHeader } from "../../ui/card"
import { Skeleton } from "../../ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"

export default function ClientAgentsList({ clientId }: { clientId: string }) {
    return (
        <Suspense fallback={<ClientAgentsListSkeleton />}>
            <ClientAgentsListServer clientId={clientId} />
        </Suspense>
    )
}

function ClientAgentsListSkeleton() {
    return (
        <Card>
            <CardHeader>
                <div>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]"><Skeleton className="h-5 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                            <TableHead className="w-[100px]"><Skeleton className="h-5 w-16" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}