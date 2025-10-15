import { clientDashboardAuth } from "@/app/api/clients/clientDashboardAuth"
import { ConnectAppsGrid } from "./ConnectAppsGrid"
import { ExistingConnections } from "./ExistingConnections"
import { Separator } from "@/components/ui/separator"

interface ConnectAccountWrapperProps {
  clientId?: string
  onSuccess?: (account: any, app: string) => void
}

export async function ConnectAccountWrapper({
  clientId: propClientId,
  onSuccess
}: ConnectAccountWrapperProps) {
  // Get client ID from auth if not provided
  let clientId = propClientId
  
  if (!clientId) {
    const auth = await clientDashboardAuth(clientId)
    clientId = auth.client.id
  }

  if (!clientId) {
    return (
      <div className="text-sm text-muted-foreground">
        Unable to determine client ID
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Existing Connections */}
      <ExistingConnections clientId={clientId} />
      
      <Separator />
      
      {/* Connect New Apps */}
      <div>
        <h3 className="text-sm font-medium mb-4">Connect New App</h3>
        <ConnectAppsGrid
          clientId={clientId}
          onSuccess={onSuccess}
        />
      </div>
    </div>
  )
}

