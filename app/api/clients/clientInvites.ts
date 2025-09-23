'use server'

import { createServerClient } from "@/lib/supabase/server"


export async function checkClientInviteValid(token: string) {
    const supabase = await createServerClient()

    const { data: invite, error } = await supabase.from('client_invitations').select('*').eq('token', token)

    if (error) {
        console.error('Error checking client invite valid:', error)
        throw new Error('Failed to check client invite valid')
    }

    return invite && invite.length > 0

}

export async function getClientInviteDetails(token: string) {
    const supabase = await createServerClient()

    const { data: invite, error } = await supabase
        .from('client_invitations')
        .select(`
            *,
            clients(
                id,
                name,
                organization_id,
                organizations(
                    id,
                    name,
                    slug
                )
            )
        `)
        .eq('token', token)
        .eq('status', 'pending')
        .single()

    if (error) {
        console.error('Error getting client invite details:', error)
        throw new Error('Failed to get client invite details')
    }

    // Check if invitation is expired
    const expiresAt = new Date(invite.expires_at)
    const now = new Date()
    const isExpired = expiresAt < now

    if (isExpired) {
        // Update invitation status to expired
        await supabase
            .from('client_invitations')
            .update({ status: 'expired' })
            .eq('token', token)

        throw new Error('Invitation has expired')
    }

    return invite
}

export async function markClientInviteAsUsed(token: string) {
    const supabase = await createServerClient()

    const { error } = await supabase
        .from('client_invitations')
        .update({ status: 'accepted' })
        .eq('token', token)

    if (error) {
        console.error('Error marking client invite as used:', error)
        throw new Error('Failed to mark client invite as used')
    }
}
