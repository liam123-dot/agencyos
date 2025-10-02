import ClientAgentsList from "@/components/ClientsDashboard/Agents/ClientAgentsList";
import WorkflowsList from "@/components/ClientsDashboard/Agents/WorkflowsList";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agents",
}

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
        <div className="container mx-auto p-6 space-y-6">
            <ClientAgentsList clientId={client_id} orgId={orgId} />
            <WorkflowsList clientId={client_id} orgId={orgId} />
        </div>
    )
}