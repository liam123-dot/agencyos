import { getAgent } from "@/app/api/agents/getAgent";
import { Card, CardContent } from "@/components/ui/card";
import { AgentPhoneNumbers } from "@/components/agents/AgentPhoneNumbers";
import { Suspense } from "react";

export default async function AgentDeploymentPage({
  params,
}: {
  params: Promise<{ orgId: string; agentId: string }>;
}) {
  const { agentId } = await params;
  
  const agent = await getAgent(agentId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{agent.data?.name} Deployment</h1>
        <p className="text-muted-foreground">
          Configure phone numbers and deployment settings for this agent
        </p>
      </div>
      
      <Suspense fallback={
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <span className="ml-2">Loading phone numbers...</span>
            </div>
          </CardContent>
        </Card>
      }>
        <AgentPhoneNumbers agentId={agentId} />
      </Suspense>
    </div>
  )

}
