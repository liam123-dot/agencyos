'use client';

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Bot, FileText, Rocket, Hammer, Phone, Book } from "lucide-react";
import { TestAgentButton } from "./TestAgentButton";

const menuItems = [
    // {
    //   title: 'Overview',
    //   url: (orgId: string, agentId: string, baseUrl: string, queryString: string) => `${baseUrl}/app/agents/${agentId}${queryString}`,
    //   icon: Bot,
    // },
    {
      title: 'Configuration',
      url: (orgId: string, agentId: string, baseUrl: string, queryString: string) => `${baseUrl}/app/agents/${agentId}/configuration${queryString}`,
      icon: FileText,
    },
    {
      title: 'Tools',
      url: (orgId: string, agentId: string, baseUrl: string, queryString: string) => `${baseUrl}/app/agents/${agentId}/tools${queryString}`,
      icon: Hammer,
    },
    {
      title: 'Knowledge Base',
      url: (orgId: string, agentId: string, baseUrl: string, queryString: string) => `${baseUrl}/app/agents/${agentId}/knowledge-base${queryString}`,
      icon: Book
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
  assigned_phone_number?: string | null;
}

interface AgentSidebarProps {
  agentId: string;
  orgId: string;
  agentData: AgentData;
  vapiPublishableKey: string;
}

export function AgentSidebar({ agentId, orgId, agentData, vapiPublishableKey }: AgentSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Detect if we're in a platform user context (s/[orgId] route)
    const isPlatformUserContext = pathname.startsWith(`/s/${orgId}`);
    const baseUrl = isPlatformUserContext ? `/s/${orgId}` : '';
    
    // Preserve client_id query parameter for platform users
    const clientIdParam = searchParams.get('client_id');
    const queryString = isPlatformUserContext && clientIdParam ? `?client_id=${clientIdParam}` : '';
    
    // Get agent name from data, fallback to platform_id or id
    const agentName = agentData.data?.name || agentData.platform_id || `Agent ${agentData.id.slice(0, 8)}`;;

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border/60 bg-sidebar/95 text-sidebar-foreground backdrop-blur">
        <div className="flex flex-1 flex-col gap-10 p-6">
            <div className="flex flex-col gap-4">
                <Link
                    href={`${baseUrl}/app/agents${queryString}`}
                    prefetch={true}
                    className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Back to Agents
                </Link>

                <div className="space-y-4 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/10 p-5">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Agent</p>
                        <h2 className="text-xl font-semibold tracking-tight text-foreground">{agentName}</h2>
                        {agentData.assigned_phone_number && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{agentData.assigned_phone_number}</span>
                            </div>
                        )}
                    </div>
                    <TestAgentButton assistantId={agentData.platform_id} vapiPublishableKey={vapiPublishableKey} />
                </div>
            </div>

            <nav className="flex flex-col gap-1">
                <p className="px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Configure</p>
                {menuItems.map((item) => {
                    const itemUrl = item.url(orgId, agentId, baseUrl, queryString)
                    const pathUrl = item.url(orgId, agentId, baseUrl, "")
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.title}
                            href={itemUrl}
                            prefetch={true}
                            className={cn(
                                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                pathname === pathUrl
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                                    : "text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground",
                            )}
                        >
                            <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
                            {item.title}
                        </Link>
                    )
                })}
            </nav>
        </div>
    </aside>
  );
}
