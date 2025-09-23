'use server'

import { Suspense } from "react"
import { ClientProductsServerComponent } from "./ClientProductsServerComponent"
import { Skeleton } from "../../ui/skeleton"

export default async function ClientProductsComponent({ clientId }: { clientId?: string }) {
    return (
        <Suspense fallback={<ClientProductsComponentSkeleton />}>
            <ClientProductsServerComponent clientId={clientId} />
        </Suspense>
    )
}

function ClientProductsComponentSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="border rounded-lg p-6 space-y-4">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-24" />
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-10 w-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}
