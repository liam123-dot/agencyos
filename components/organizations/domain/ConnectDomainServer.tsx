
'use server'

import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import VerifyDomain from "./VerifyDomain"
import ConnectDomain from "./ConnectDomain"

export async function ConnectDomainServer() {
    const { organization } = await getOrg()

    if (!organization) {
        return null
    }

    if (organization.domain) {
        return <VerifyDomain organizationName={organization.name} />
    }

    return (
        <ConnectDomain organizationName={organization.name} />
    )
}
