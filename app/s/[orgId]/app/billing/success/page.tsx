import { getUser } from "@/app/api/user/getUser"
import { authorizedToAccessClient } from "@/app/api/clients/clientMembers"
import { syncClientSubscriptions } from "@/app/api/clients/clientSubscriptions"
import { redirect } from "next/navigation"

export default async function SuccessPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ switched?: string }> 
}) {

    const { userData } = await getUser()
    const clientId = userData.client_id
    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        throw new Error('Unauthorized')
    }
    const { supabaseServerClient, client } = authorized

    await syncClientSubscriptions(client.id)

    const { data: organization } = await supabaseServerClient.from('organizations').select('*').eq('id', client.organization_id).single()

    const { switched } = await searchParams
    
    // Redirect with success parameter to show toast on the billing page
    const redirectUrl = switched 
        ? `https://${organization.domain}/app/billing?success=switched`
        : `https://${organization.domain}/app/billing?success=subscribed`
    
    redirect(redirectUrl)
    
}
