
'use server'

import { Suspense } from "react"
import { ClientOverviewServer } from "./ClientOverviewServer"

export async function ClientOverviewComponent({ id }: { id: string }) {
    return (
        <Suspense fallback={<ClientOverviewComponentSkeleton />}>
            <ClientOverviewServer id={id} />
        </Suspense>
    )
}

function ClientOverviewComponentSkeleton() {
    return (
        <div>Loading...</div>
    )
}

