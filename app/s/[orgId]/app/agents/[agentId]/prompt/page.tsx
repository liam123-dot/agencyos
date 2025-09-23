import { getAgent } from "@/app/api/agents/getAgent";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default async function AgentPromptPage({
  params,
}: {
  params: Promise<{ orgId: string; agentId: string }>;
}) {
  const { agentId } = await params;
  
  try {
    const agent = await getAgent(agentId);
    const prompt = agent.data?.prompt || agent.data?.systemPrompt || '';
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agent Prompt</h1>
          <p className="text-muted-foreground">
            Configure the system prompt and instructions for your agent
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Prompt</CardTitle>
            <CardDescription>
              The main instructions that guide your agent's behavior and responses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Enter your agent's system prompt here..."
              value={prompt}
              readOnly
              className="min-h-[300px] font-mono text-sm"
            />
            <div className="flex justify-end">
              <Button disabled>
                Save Changes
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Prompt editing functionality coming soon. Currently showing read-only view.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Prompt Guidelines</CardTitle>
            <CardDescription>Best practices for writing effective agent prompts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-medium">Be Specific and Clear</h4>
              <p className="text-sm text-muted-foreground">
                Provide clear, specific instructions about what the agent should do and how it should behave.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Define the Role</h4>
              <p className="text-sm text-muted-foreground">
                Clearly define what role the agent should take (e.g., "You are a helpful customer service representative").
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Set Boundaries</h4>
              <p className="text-sm text-muted-foreground">
                Specify what the agent should and shouldn't do to ensure appropriate responses.
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
          <h1 className="text-3xl font-bold tracking-tight">Agent Prompt</h1>
          <p className="text-muted-foreground">
            Configure the system prompt and instructions for your agent
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load agent prompt. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
