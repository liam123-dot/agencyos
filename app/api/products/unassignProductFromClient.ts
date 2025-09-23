'use server'

import { getOrg } from "../user/selected-organization/getOrg"
import { getClient } from "../clients/getClient"

export async function unassignProductFromClient({productId, clientId}: {productId: string, clientId: string}) {

    const {organization, supabaseServerClient} = await getOrg()

    if (!organization) {
        throw new Error('Organization not found')
    }

    const client = await getClient(clientId)

    if (!client) {
        throw new Error('Client not found')
    }

    if (client.organization_id !== organization.id) {
        throw new Error('Client does not belong to organization')
    }

    // check if product is assigned to client
    const {data: clientsProducts, error: clientsProductsError} = await supabaseServerClient.from('clients_products').select('*').eq('client_id', clientId).eq('product_id', productId)

    if (clientsProductsError) {
        throw new Error('Failed to check if product is assigned to client')
    }

    if (!clientsProducts || clientsProducts.length === 0) {
        throw new Error('Product is not assigned to client')
    }

    // Remove the assignment
    const {error: deleteError} = await supabaseServerClient
        .from('clients_products')
        .delete()
        .eq('client_id', clientId)
        .eq('product_id', productId)
        .eq('organization_id', organization.id)

    if (deleteError) {
        throw new Error('Failed to unassign product from client')
    }

    return true
}
