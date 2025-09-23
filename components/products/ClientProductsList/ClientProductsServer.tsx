'use server'

import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { getProducts } from "@/app/api/products/productActions"
import { getClientProducts } from "@/app/api/clients/getClientProducts"
import { BaseProductsTable } from "../BaseProductsTable"

interface ClientProductsServerProps {
    clientId: string
    clientName: string
}

export async function ClientProductsServer({ clientId, clientName }: ClientProductsServerProps) {
    const { organization } = await getOrg()

    if (!organization) {
        return <div>Organization not found</div>
    }

    const [allProducts, assignedProducts] = await Promise.all([
        getProducts(),
        getClientProducts(clientId)
    ])

    // Filter out products that are already assigned to the client
    const assignedProductIds = new Set(assignedProducts.map(product => product.id))
    const availableProducts = allProducts.filter(product => !assignedProductIds.has(product.id))

    return (
        <BaseProductsTable
            products={availableProducts}
            title="Available Products"
            description={`Assign products to ${clientName}.`}
            rowActionType="assign"
            clientId={clientId}
            emptyStateMessage="No products available to assign."
            emptyStateSubMessage="All products are already assigned to this client or no products exist."
        />
    )
}
