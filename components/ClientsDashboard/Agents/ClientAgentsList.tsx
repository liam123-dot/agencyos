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
        <Card>
            <CardHeader>
                <div>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]"><Skeleton className="h-5 w-20" /></TableHead>
                            <TableHead><Skeleton className="h-5 w-24" /></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                            <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}