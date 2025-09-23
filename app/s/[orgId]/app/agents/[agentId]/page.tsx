import { getAgent } from "@/app/api/agents/getAgent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AgentOverviewPage({
  params,
}: {
  params: Promise<{ orgId: string; agentId: string }>;
}) {
  const { agentId } = await params;
  
  try {
    const agent = await getAgent(agentId);
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Overview</h1>
          <p className="text-muted-foreground">
            View and manage agent details and configuration
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Agent Information</CardTitle>
            <CardDescription>Basic agent details and overview</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <p className="text-sm text-muted-foreground">
                {agent.data?.name || agent.platform_id || 'Unnamed Agent'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Created</label>
              <p className="text-sm text-muted-foreground">
                {new Date(agent.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Last Updated</label>
              <p className="text-sm text-muted-foreground">
                {new Date(agent.updated_at).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Overview</h1>
          <p className="text-muted-foreground">
            View and manage agent details and configuration
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load agent details. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
