import { Suspense } from "react"
import { StripeSetupServer } from "./StripeSetupServer"
import { StripeSetupSkeleton } from "./StripeSetup"

export default async function StripeComponent() {

    return (
        <Suspense fallback={<StripeSetupSkeleton />}>
            <StripeSetupServer />
        </Suspense>
    )
}

