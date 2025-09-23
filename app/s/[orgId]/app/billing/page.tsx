'use server'

import ClientProductsComponent from "@/components/ClientsDashboard/ClientsProducts/ClientProductsComponent"

// client id is in the search params
export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ client_id: string }> }) {

    const { client_id } = await searchParams

    return (
        <div>
            <ClientProductsComponent clientId={client_id} />
        </div>
    )
}