
'use server'

import { getOrg } from "../user/selected-organization/getOrg"
import { getClient } from "../clients/getClient"

export async function assignProductToClient({productId, clientId}: {productId: string, clientId: string}) {

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

    // check if product is already assigned to client
    const {data: clientsProducts, error: clientsProductsError} = await supabaseServerClient.from('clients_products').select('*').eq('client_id', clientId).eq('product_id', productId)

    console.log(clientsProducts)

    if (clientsProductsError) {
        throw new Error('Failed to check if product is already assigned to client')
    }

    if (clientsProducts && clientsProducts.length > 0) {
        throw new Error('Product already assigned to client')
    }

    await supabaseServerClient.from('clients_products').insert({
        client_id: clientId,
        product_id: productId,
        organization_id: organization.id
    })

    return true

}

