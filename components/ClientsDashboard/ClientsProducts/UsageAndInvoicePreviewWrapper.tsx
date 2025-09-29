'use server'

import { Suspense } from "react"
import UsageAndInvoicePreview from "./UsageAndInvoicePreview"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function UsageAndInvoicePreviewWrapper({ clientId }: { clientId?: string }) {
    return (
        <Suspense fallback={<UsageAndInvoicePreviewSkeleton />}>
            <UsageAndInvoicePreview clientId={clientId} />
        </Suspense>
    )
}

function UsageAndInvoicePreviewSkeleton() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Card Skeleton */}
            <Card className="h-fit">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                        <Skeleton className="h-5 w-32" />
                    </CardTitle>
                    <CardDescription className="text-sm">
                        <Skeleton className="h-4 w-48" />
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Usage Summary Skeleton */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                            <Skeleton className="h-8 w-12 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                        <div className="text-right">
                            <Skeleton className="h-4 w-16 mb-1" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>

                    {/* Progress Bar Skeleton */}
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <div className="flex justify-between">
                            <Skeleton className="h-3 w-8" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>

                    {/* Overage Alert Skeleton */}
                    <div className="bg-muted/20 border rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                        <Skeleton className="h-3 w-32 mt-1" />
                    </div>
                </CardContent>
            </Card>

            {/* Invoice Card Skeleton */}
            <Card className="h-fit">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                        <Skeleton className="h-5 w-24" />
                    </CardTitle>
                    <CardDescription className="text-sm">
                        <Skeleton className="h-4 w-40" />
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Total Amount Skeleton */}
                    <div className="text-center p-4 bg-muted/20 border rounded-lg">
                        <Skeleton className="h-8 w-16 mx-auto mb-1" />
                        <Skeleton className="h-3 w-20 mx-auto" />
                    </div>

                    {/* Breakdown Skeleton */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-12" />
                        </div>
                        <div className="flex justify-between items-center">
                            <div>
                                <Skeleton className="h-4 w-20 mb-1" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>

                    <div className="pt-2 border-t">
                        <Skeleton className="h-3 w-48 mx-auto" />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
