import { OrchestrateServer } from "./OrchestrateServer"

export default async function OrchestrationPage({ 
    params 
}: { 
    params: Promise<{ id: string; orgId: string }> 
}) {
    const { id } = await params
    
    return <OrchestrateServer workflowId={id} />
}

