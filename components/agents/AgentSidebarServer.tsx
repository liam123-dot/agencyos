import { getAgent } from "@/app/api/agents/getAgent";
import { AgentSidebar } from "./AgentSidebar";

interface AgentSidebarServerProps {
  agentId: string;
  orgId: string;
}

export async function AgentSidebarServer({ agentId, orgId }: AgentSidebarServerProps) {
  const agentData = await getAgent(agentId);
  
  return <AgentSidebar agentId={agentId} orgId={orgId} agentData={agentData} />;
}
