
'use server'

import { getClient } from "@/app/api/clients/getClient"

export async function ClientOverviewServer({ id }: { id: string }) {
    const client = await getClient(id)
    return (
        <div>
            <h1>Client Details</h1>
            <p>Details for client with ID: {client.name}</p>
        </div>
    )
}

