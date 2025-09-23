'use server'

import { createServerClient } from "@/lib/supabase/server"

export async function getClient(id: string) {

    if (!id) {
        throw new Error('Client ID is required')
    }
    
    const supabase = await createServerClient()

    const { data: client, error } = await supabase.from('clients').select('*').eq('id', id).single()

    console.log(client, error)

    if (error) {
        throw new Error('Failed to fetch client')
    }

    return client
}