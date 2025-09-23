'use server'

import { createServerClient } from "@/lib/supabase/server"
import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { VapiSetup } from "./VapiSetup"

export async function VapiSetupServer() {

    const { organization, userData } = await getOrg()

    if (!organization) {
        // Handle case where organization is not found. 
        // You might want to return a specific component or null.
        return null 
    }

    return (
        <VapiSetup 
            vapiKeyExists={!!organization.vapi_api_key} 
            organizationName={organization.name}
        />
    )
}
