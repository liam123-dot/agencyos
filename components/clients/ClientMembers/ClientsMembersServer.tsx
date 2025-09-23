
import AddNewMember from "./AddNewMember"
import ClientsMembersTable from "./ClientsMembersTable"
import ClientsInvitesTable from "./ClientsInvitesTable"
import { getClientInvites } from "@/app/api/clients/clientMembers"
import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { Skeleton } from "@/components/ui/skeleton"
import { Suspense } from "react"

export async function ClientsMembersServer({ clientId }: { clientId: string }) {
    return (
        <div className="space-y-6">
            <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                <ClientsMembersTable clientId={clientId} />
            </Suspense>
            <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                <ClientsInvitesTableWrapper clientId={clientId} />
            </Suspense>
        </div>
    )
}

async function ClientsInvitesTableWrapper({ clientId }: { clientId: string }) {
    const invites = await getClientInvites(clientId)
    const { organization } = await getOrg()
    
    if (!organization) {
        throw new Error('Organization not found')
    }
    
    return <ClientsInvitesTable 
        invites={invites} 
        organizationId={organization.id}
        organizationDomain={organization.domain}
    />
}