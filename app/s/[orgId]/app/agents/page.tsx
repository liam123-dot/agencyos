import ClientAgentsList from "@/components/ClientsDashboard/Agents/ClientAgentsList";

// extract the client_id from the search params
export default async function AgentsPage({ 
    searchParams,
    params 
}: { 
    searchParams: Promise<{ client_id: string }>;
    params: Promise<{ orgId: string }>;
}) {
    const { client_id } = await searchParams
    
    const { orgId } = await params

    return (
        <div className="p-4 md:p-6">
            <ClientAgentsList clientId={client_id} orgId={orgId} />
        </div>
    )
}