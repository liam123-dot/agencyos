import { ConnectAppsInterface } from "@/components/workflows/connect"
import { ExistingConnections } from "@/components/workflows/connect/ExistingConnections"

export default async function CredentialsPlaceholder({ clientId }: { clientId: string }) {
    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-border/60">
                <div>
                    <h2 className="text-xl font-semibold">App Credentials</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Connect apps to use with your agents and workflows
                    </p>
                </div>
            </div>
            {/* <div>
                <ExistingConnections />
            </div> */}
            <div className="px-6 py-6">
                <ConnectAppsInterface clientId={clientId} />
            </div>
        </>
    )
}

