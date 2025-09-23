import { Suspense } from "react"
import { VapiSetupServer } from "./VapiSetupServer"
import { VapiSetupSkeleton } from "./VapiSetup"

export default async function VapiComponent() {

    return (
        <Suspense fallback={<VapiSetupSkeleton />}>
            <VapiSetupServer />
        </Suspense>
    )
}