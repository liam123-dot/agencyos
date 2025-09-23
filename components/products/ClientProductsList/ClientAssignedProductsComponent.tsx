'use server'

import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ClientAssignedProductsServer from "./ClientAssignedProductsServer"

export default async function ClientAssignedProducts({ id }: { id: string }) {

    return (
        <Suspense fallback={<ClientAssignedProductsSkeleton />}>
            <ClientAssignedProductsServer id={id}/>
        </Suspense>
    )

}

function ClientAssignedProductsSkeleton() {
    return (
        <div>
            <Skeleton className="h-10 w-full" />
        </div>
   )
}
