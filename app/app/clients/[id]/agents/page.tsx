import ClientAgentsComponent from "@/components/clients/ClientAgents/ClientAgentsComponent"

export default async function Agents({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Client Agents</h1>
                <p className="text-muted-foreground">
                    Manage agents assigned to this client
                </p>
            </div>
            <ClientAgentsComponent clientId={id} />
        </div>
    )
}