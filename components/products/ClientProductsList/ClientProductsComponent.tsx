'use server'

import { Suspense } from "react"
import { ClientProductsServer } from "./ClientProductsServer"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface ClientProductsComponentProps {
    clientId: string
    clientName: string
}

export default async function ClientProductsComponent({ clientId, clientName }: ClientProductsComponentProps) {
    return (
        <Suspense fallback={<ClientProductsComponentSkeleton />}>
            <ClientProductsServer clientId={clientId} clientName={clientName} />
        </Suspense>
    )
}

function ClientProductsComponentSkeleton() {
    return (
        <div className="space-y-6">
            <div className="border rounded-lg">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex space-x-4">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-12" />
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
