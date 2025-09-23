'use server'

import { getOrg } from "../user/selected-organization/getOrg"

export async function createClient({name}: {name: string}) {
    const { organization, userData, supabaseServerClient } = await getOrg()

    if (!organization) {
        throw new Error('Organization not found');
    }

    const { data: client, error } = await supabaseServerClient.from('clients').insert({
        name: name,
        organization_id: organization.id
    }).select().single();

    if (error) {
        console.error('Error creating client', error)
        throw new Error('Failed to create client');
    }

    return client;
}
