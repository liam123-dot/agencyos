import { createServerClient } from "@/lib/supabase/server"


export async function getClients(orgId: string) {

    const supabase = await createServerClient()

    const { data: clients, error } = await supabase.from('clients').select('*').eq('organization_id', orgId)

    if (error) {
        console.error('Error fetching clients:', error)
        throw new Error('Failed to fetch clients')
    }

    return clients

}