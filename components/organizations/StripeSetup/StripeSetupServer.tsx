'use server'

import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { StripeSetup } from "./StripeSetup"

export async function StripeSetupServer() {

    const { organization, userData } = await getOrg()

    if (!organization) {
        // Handle case where organization is not found. 
        // You might want to return a specific component or null.
        return null 
    }

    return (
        <StripeSetup 
            stripeApiKeyExists={!!organization.stripe_api_key} 
            organizationName={organization.name}
        />
    )
}

