import { getVapiAgent } from "@/app/api/agents/getVapiAgent"
import { AgentConfigurationTabs } from "@/components/agents/AgentConfigurationTabs"

export default async function AgentConfigurationPage({
  params,
}: {
  params: Promise<{ orgId: string; agentId: string }>;
}) {
  const { agentId } = await params;
  
  try {
    const vapiAgent = await getVapiAgent(agentId);
    console.log(vapiAgent);
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Configuration</h1>
          <p className="text-muted-foreground">
            Configure your agent's behavior, messages, and settings
          </p>
        </div>
        
        <AgentConfigurationTabs agentId={agentId} vapiAgent={vapiAgent} />
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Configuration</h1>
          <p className="text-muted-foreground">
            Configure your agent's behavior, messages, and settings
          </p>
        </div>
        
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6">
          <p className="text-destructive">Failed to load agent configuration. Please try again.</p>
        </div>
      </div>
    );
  }
}
