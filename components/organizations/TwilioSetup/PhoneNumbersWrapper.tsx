import { Suspense } from "react"
import { PhoneNumbersServer } from "./PhoneNumbersServer"
import { TwilioSetupSkeleton } from "./TwilioSetup"

interface PhoneNumbersWrapperProps {
    clientId: string;
}

export default async function PhoneNumbersWrapper({ clientId }: PhoneNumbersWrapperProps) {
    return (
        <div className="space-y-6">            
            <Suspense fallback={<TwilioSetupSkeleton />}>
                <PhoneNumbersServer clientId={clientId} />
            </Suspense>
        </div>
    )
}
