'use server'

import { createServerClient, createServiceClient } from "@/lib/supabase/server"
import { OrganizationRole } from "@/lib/types/organizations"

export async function addUserToOrg({userId, orgId, role}: {userId: string, orgId: string, role: OrganizationRole}) {

    const supabase = await createServerClient()

    const { data: organization, error } = await supabase.from('organizations').select('*').eq('id', orgId).single()

    console.log(organization)

    const { data: user, error: userError } = await supabase.from('users').select('*').eq('id', userId).single()

    console.log(user)

    const { data: userOrg, error: userOrgError } = await supabase.from('user_organizations').insert({
        user_id: userId,
        organization_id: orgId,
        role: role
    })

    return true

}