'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Bot, FileText, Rocket } from "lucide-react";
import { TestAgentButton } from "./TestAgentButton";

const menuItems = [
    {
      title: 'Overview',
      url: (orgId: string, agentId: string, baseUrl: string, queryString: string) => `${baseUrl}/app/agents/${agentId}${queryString}`,
      icon: Bot,
    },
    {
      title: 'Prompt',
      url: (orgId: string, agentId: string, baseUrl: string, queryString: string) => `${baseUrl}/app/agents/${agentId}/prompt${queryString}`,
      icon: FileText,
    },
    {
      title: 'Deployment',
      url: (orgId: string, agentId: string, baseUrl: string, queryString: string) => `${baseUrl}/app/agents/${agentId}/deployment${queryString}`,
      icon: Rocket,
    },
  ];

interface AgentData {
  id: string;
  platform_id: string;
  data?: {
    name?: string;
  };
}

interface AgentSidebarProps {
  agentId: string;
  orgId: string;
  agentData: AgentData;
}

export function AgentSidebar({ agentId, orgId, agentData }: AgentSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Detect if we're in a platform user context (s/[orgId] route)
    const isPlatformUserContext = pathname.startsWith(`/s/${orgId}`);
    const baseUrl = isPlatformUserContext ? `/s/${orgId}` : '';
    
    // Preserve client_id query parameter for platform users
    const clientIdParam = searchParams.get('client_id');
    const queryString = isPlatformUserContext && clientIdParam ? `?client_id=${clientIdParam}` : '';
    
    // Get agent name from data, fallback to platform_id or id
    const agentName = agentData.data?.name || agentData.platform_id || `Agent ${agentData.id.slice(0, 8)}`;

  return (
    <div className="flex flex-col w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6 pb-4">
            <Link 
              href={`${baseUrl}/app/agents${queryString}`}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to Agents
            </Link>
            
            <h2 className="text-2xl font-bold tracking-tight mb-6 text-foreground">{agentName}</h2>
            
            <TestAgentButton assistantId={agentData.platform_id} />
        </div>
        <Separator className="bg-sidebar-border/60" />
      <nav className="flex flex-col gap-2 p-4 pt-6">
        {menuItems.map((item) => {
          const itemUrl = item.url(orgId, agentId, baseUrl, queryString);
          const pathUrl = item.url(orgId, agentId, baseUrl, '');
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              href={itemUrl}
              className={cn(
                  'px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-3',
                  pathname === pathUrl 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                    : 'hover:bg-sidebar-accent/50 hover:shadow-sm'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
