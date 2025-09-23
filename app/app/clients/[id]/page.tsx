'use server'

import { ClientOverviewComponent } from "@/components/clients/ClientOverview/ClientOverviewComponent"

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return (
        <div>
            
            <ClientOverviewComponent id={id} />
        </div>
    )
}