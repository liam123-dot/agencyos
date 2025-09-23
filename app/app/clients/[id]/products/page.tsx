'use server'

import { getClient } from "@/app/api/clients/getClient"
import { ClientProductsComponent } from "@/components/products/ClientProductsList"
import ClientAssignedProducts from "@/components/products/ClientProductsList/ClientAssignedProductsComponent"

export default async function ClientProducts({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    // Get client information to display in the component
    const client = await getClient(id)

    return (
        <div className="space-y-6">
            <ClientAssignedProducts id={id} />
            <ClientProductsComponent clientId={id} clientName={client.name} />
        </div>
    )
}