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
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header Section */}
                <div className="mb-12">
                    <div className="flex items-start justify-between mb-6">
                        <div className="space-y-3">
                            <Skeleton className="h-10 w-80" />
                            <Skeleton className="h-5 w-96" />
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <Skeleton className="h-16 w-full rounded-lg" />
                </div>

                {/* Products Section */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-40" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="border rounded-lg p-6 space-y-6 h-full bg-card/90">
                                {/* Header */}
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <Skeleton className="h-8 w-32" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                                
                                {/* Pricing */}
                                <div className="space-y-6">
                                    <div className="text-center space-y-2 py-4">
                                        <Skeleton className="h-10 w-24 mx-auto" />
                                        <Skeleton className="h-4 w-20 mx-auto" />
                                    </div>
                                    <div className="bg-muted/30 rounded-lg p-4 space-y-1">
                                        <div className="flex justify-between py-2">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                        <div className="flex justify-between py-2 border-t border-border/30">
                                            <Skeleton className="h-4 w-20" />
                                            <Skeleton className="h-4 w-16" />
                                        </div>
                                    </div>
                                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <Skeleton className="h-4 w-28" />
                                            <Skeleton className="h-6 w-16" />
                                        </div>
                                        <Skeleton className="h-3 w-full" />
                                    </div>
                                </div>
                                
                                {/* Button */}
                                <Skeleton className="h-11 w-full mt-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
