'use server'

import { createServerClient } from "@/lib/supabase/server"

export async function validateClientSignIn(email: string, organizationId: string) {
    const supabase = await createServerClient()

    try {
        // Get user data by email
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, client_id, type, email')
            .eq('email', email)
            .single()

        if (userError || !userData) {
            throw new Error('User not found')
        }

        // Check if user is a client user (not platform user)
        if (userData.type !== 'clients' || !userData.client_id) {
            throw new Error('User is not authorized to access this client portal')
        }

        // Verify that the client belongs to the specified organization
        const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('id, organization_id, name')
            .eq('id', userData.client_id)
            .eq('organization_id', organizationId)
            .single()

        if (clientError || !clientData) {
            throw new Error('User does not have access to this organization')
        }

        return {
            isValid: true,
            clientId: userData.client_id,
            clientName: clientData.name,
            userId: userData.id
        }
    } catch (error) {
        console.error('Error validating client sign in:', error)
        return {
            isValid: false,
            error: error instanceof Error ? error.message : 'Validation failed'
        }
    }
}
