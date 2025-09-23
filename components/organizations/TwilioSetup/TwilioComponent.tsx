import { Suspense } from "react"
import { TwilioSetupServer } from "./TwilioSetupServer"
import { TwilioSetupSkeleton } from "./TwilioSetup"

interface TwilioComponentProps {
    clientId: string;
}

export default async function TwilioComponent({ clientId }: TwilioComponentProps) {
    return (
        <Suspense fallback={<TwilioSetupSkeleton />}>
            <TwilioSetupServer clientId={clientId} />
        </Suspense>
    )
}
