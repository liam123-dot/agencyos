'use server'

import { getUser } from "../user/getUser"
import { authorizedToAccessClient } from "./clientMembers"
import { redirect } from "next/navigation"

export async function clientDashboardAuth(clientId?: string) {
    const { userData, supabaseServerClient } = await getUser()
    if (!userData) {
        redirect('/auth')
    }
    if (!clientId) {
        clientId = userData.client_id
    }

    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        redirect('/auth')
    }

    return authorized
    
}
