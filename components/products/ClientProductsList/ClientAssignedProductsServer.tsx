import { getClientProducts } from "@/app/api/clients/getClientProducts"
import { getClient } from "@/app/api/clients/getClient"
import { BaseProductsTable } from "../BaseProductsTable"

export default async function ClientAssignedProductsServer({ id }: { id: string }) {

    const products = await getClientProducts(id)
    const client = await getClient(id)

    if (!client) {
        return <div>Client not found</div>
    }

    return (
        <BaseProductsTable
            products={products}
            title="Assigned Products"
            description={`Products currently assigned to ${client.name}.`}
            rowActionType="unassign"
            clientId={id}
            emptyStateMessage="No products assigned."
            emptyStateSubMessage="Assign products to this client to see them here."
        />
    )

}
