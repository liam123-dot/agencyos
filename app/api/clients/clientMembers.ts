'use server'

import { getOrg } from "../user/selected-organization/getOrg"
import { getClient } from "./getClient"
import { getUser } from "../user/getUser"
import { redirect } from "next/navigation"
import crypto from 'crypto'

export async function getClientMembers(id: string) {
    
    const authorized = await authorizedToAccessClient(id)
    if (!authorized) {
        throw new Error('Unauthorized')
    }
    const { organization, userData, client, supabaseServerClient } = authorized

    const { data: members, error } = await supabaseServerClient.from('users').select('*').eq('client_id', id)

    if (error) {
        throw new Error('Failed to fetch client members')
    }

    return members
}

export async function getClientInvites(clientId: string) {

    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        throw new Error('Unauthorized')
    }

    const { organization, userData, client, supabaseServerClient } = authorized

    const { data: invites, error } = await supabaseServerClient.from('client_invitations').select('*').eq('client_id', clientId).eq('status', 'pending')

    if (error) {
        throw new Error('Failed to fetch client invites')
    }

    return invites

}

export async function inviteClientMember(clientId: string, email: string) {
    const authorized = await authorizedToAccessClient(clientId)

    if (!authorized) {
        throw new Error('Unauthorized')
    }

    const { organization, userData, client, supabaseServerClient } = authorized

    const token = crypto.randomUUID()

    const { data: user, error } = await supabaseServerClient.from('client_invitations').insert({
        client_id: clientId,
        email: email,
        token: token,
        invited_by: userData.id,
        status: 'pending'
    })
    
    console.log(user, error)
        
}

export async function authorizedToAccessClient(clientId?: string) {
    let finalClientId = clientId
    
    // If no clientId provided, try to get it from the user
    if (!finalClientId) {
        try {
            const { userData } = await getUser()
            finalClientId = userData.client_id
            
            if (!finalClientId) {
                // No client_id available anywhere, redirect to off
                redirect('/auth')
            }
        } catch (error) {
            // User authentication failed, redirect to off
            redirect('/auth')
        }
    }

    const { organization, userData, supabaseServerClient } = await getOrg()
    const client = await getClient(finalClientId)
    if (!client) {
        return false
    }
    if (!organization) {
        if (userData.client_id !== finalClientId) {
            return false
        }
    } else {
        if (client.organization_id !== organization.id) {
            return false
        }
    }

    return {
        organization,
        userData,
        client,
        supabaseServerClient
    }
}
