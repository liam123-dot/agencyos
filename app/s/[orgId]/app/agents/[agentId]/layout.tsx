import { Suspense } from "react";
import { AgentSidebarServer } from "@/components/agents/AgentSidebarServer";
import { AgentSidebarLoading } from "@/components/agents/AgentSidebarLoading";

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string; agentId: string }>;
}) {
  const { orgId, agentId } = await params;
  
  return (
    <div className="flex h-full">
      <Suspense fallback={<AgentSidebarLoading orgId={orgId} />}>
        <AgentSidebarServer agentId={agentId} orgId={orgId} />
      </Suspense>
      <div className="flex-1 p-4">
        {children}
      </div>
    </div>
  );
}
