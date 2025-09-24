import { getAgent } from "@/app/api/agents/getAgent";
import { AgentSidebar } from "./AgentSidebar";
import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";

interface AgentSidebarServerProps {
  agentId: string;
  orgId: string;
}

export async function AgentSidebarServer({ agentId, orgId }: AgentSidebarServerProps) {
  const agentData = await getAgent(agentId);
  const orgPublicData = await getPublicOrg(orgId);
  
    return <AgentSidebar agentId={agentId} orgId={orgId} agentData={agentData} vapiPublishableKey={orgPublicData.vapi_publishable_key} />;
  }
