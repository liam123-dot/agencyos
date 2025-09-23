'use server'

import { Suspense } from "react"
import { ClientsMembersServer } from "./ClientsMembersServer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function ClientMembersComponent({ clientId }: { clientId: string }) {
    return (
        <div className="space-y-6">
            <Suspense fallback={<ClientMembersComponentSkeleton />}>
                <ClientsMembersServer clientId={clientId} />
            </Suspense>
        </div>
    )
}

function ClientMembersComponentSkeleton() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex space-x-4">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-32" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-40" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i} className="flex space-x-4">
                                <Skeleton className="h-4 w-48" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
