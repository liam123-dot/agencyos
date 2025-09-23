'use server'

import { createServerClient } from "@/lib/supabase/server"
import { markClientInviteAsUsed } from "./clientInvites"

export async function updateUserWithClientId(userId: string, clientId: string, fullName: string, token: string) {
    const supabase = await createServerClient()

    try {
        // Update the user with client_id and type
        const { error: updateError } = await supabase
            .from('users')
            .update({
                client_id: clientId,
                type: 'clients',
                full_name: fullName,
            })
            .eq('id', userId)

        if (updateError) {
            console.error('Error updating user with client_id:', updateError)
            throw new Error('Failed to associate user with client')
        }

        // Mark the invitation as used
        await markClientInviteAsUsed(token)

        return { success: true }
    } catch (error) {
        console.error('Error in updateUserWithClientId:', error)
        throw error
    }
}
