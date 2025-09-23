'use server'

import { Suspense } from "react"
import ProductsServerComponent from "./ProductsServerComponent"
import { Skeleton } from "../ui/skeleton"

// client id is in the search params
export default async function ProductsComponent() {

    return (
        <Suspense fallback={<ProductsComponentSkeleton />}>
            <ProductsServerComponent/>
        </Suspense>
    )

}

function ProductsComponentSkeleton() {
    return (
        <div className="space-y-6">
            <div className="border rounded-lg">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-center">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                        <Skeleton className="h-10 w-32" />
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
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}


    