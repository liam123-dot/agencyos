import AgentsTabsWrapper from "@/components/ClientsDashboard/Agents/AgentsTabsWrapper";
import ClientAgentsList from "@/components/ClientsDashboard/Agents/ClientAgentsList";
import WorkflowsList from "@/components/ClientsDashboard/Agents/WorkflowsList";
import CredentialsPlaceholder from "@/components/ClientsDashboard/Agents/CredentialsPlaceholder";
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
        <div className="container mx-auto p-6">
            <AgentsTabsWrapper
                agentsContent={<ClientAgentsList clientId={client_id} orgId={orgId} />}
                workflowsContent={<WorkflowsList clientId={client_id} orgId={orgId} />}
                credentialsContent={<CredentialsPlaceholder clientId={client_id} />}
            />
        </div>
    )
}