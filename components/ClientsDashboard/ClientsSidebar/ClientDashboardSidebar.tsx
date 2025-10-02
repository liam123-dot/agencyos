"use client"

import type { ReactNode } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Book,
  Bot,
  CreditCard,
  Hash,
  Phone,
  Settings,
  Workflow,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { AppUserDropdown } from "@/components/app-user-dropdown";
import { cn } from "@/lib/utils";
import { OrganizationLogo } from "./OrganizationLogo";

interface ClientDashboardSidebarProps {
  user: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
    };
  };
  orgId: string;
  clientId: string;
  organizationName: ReactNode;
  organizationData: {
    name: string;
    logo_url?: string | null;
  };
  isPlatformUser: boolean;
}

type NavigationItem = {
  title: string;
  description?: string;
  url: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
};

type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

const navigationSections: NavigationSection[] = [
  {
    label: "Client Hub",
    items: [
      {
        title: "Analytics",
        description: "Performance overview",
        url: "/app",
        icon: BarChart3,
        exact: true,
      },
      {
        title: "Calls",
        description: "Conversation history",
        url: "/app/calls",
        icon: Phone,
        // badge: "Live",
      },
      {
        title: "Agents",
        description: "Manage Agents and Workflows",
        url: "/app/agents",
        icon: Bot,
      },
      // {
      //   title: "Workflows",
      //   description: "Automate call journeys",
      //   url: "/app/workflows",
      //   icon: Workflow,
      //   // badge: "Beta",
      // },
      {
        title: 'Knowledge Base',
        description: 'Manage your knowledge base',
        url: "/app/knowledge-base",
        icon: Book,
      },
      {
        title: "Phone Numbers",
        description: "Manage phone numbers",
        url: "/app/phone-numbers",
        icon: Hash,
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        title: "Billing",
        description: "Usage & billing",
        url: "/app/billing",
        icon: CreditCard,
      },
      {
        title: "Settings",
        // description: "Client preferences",
        url: "/app/settings",
        icon: Settings,
      },
    ],
  },
];

export function ClientDashboardSidebar({ user, orgId, clientId, organizationName, organizationData, isPlatformUser }: ClientDashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();

  // Detect if we're in a platform user context (s/[orgId] route)
  const isPlatformUserContext = pathname.startsWith(`/s/${orgId}`);
  const baseUrl = isPlatformUserContext ? `/s/${orgId}` : '';
  
  // Preserve client_id query parameter for platform users
  const clientIdParam = searchParams.get('client_id');
  const queryString = isPlatformUserContext && clientIdParam ? `?client_id=${clientIdParam}` : '';
  const dashboardHref = `${baseUrl}/app${queryString}`;
  const isCollapsed = state === 'collapsed';
  const organizationInitial =
    organizationData.name && organizationData.name.trim().length > 0
      ? organizationData.name.trim().charAt(0).toUpperCase()
      : 'C';
  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || user.email || 'Account';

  return (
    <Sidebar collapsible="icon" className={cn(isCollapsed && "w-20")}>
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className={cn(
                "h-auto items-center gap-3 rounded-lg borderr bg-sidebar-accent/30",
                isCollapsed && "justify-center border-none bg-transparent px-0 py-0"
              )}
            >
              <Link href={dashboardHref} prefetch={true}>
                <div className="flex items-center gap-3">
                  {state === 'expanded' && (
                    <div className="flex flex-1 items-center text-left">
                      {organizationName}
                    </div>
                  )}
                  {state === 'collapsed' && (
                    <OrganizationLogo 
                      name={organizationData.name} 
                      logoUrl={organizationData.logo_url} 
                      size={40} 
                    />
                  )}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {navigationSections.map((section, index) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const fullUrl = `${baseUrl}${item.url}${queryString}`;
                  const pathUrl = `${baseUrl}${item.url}`;
                  const isActive = item.exact
                    ? pathname === pathUrl
                    : pathname === pathUrl || pathname.startsWith(`${pathUrl}/`);
                  // Hide Settings button when collapsed
                  if (isCollapsed && item.title === 'Settings') {
                    return null;
                  }
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                        className={cn(
                          "transition-all",
                          state === 'expanded'
                            ? "h-auto items-start gap-3 px-3 py-2"
                            : "justify-center"
                        )}
                      >
                        <Link href={fullUrl} prefetch={true} className="flex w-full items-start gap-3">
                          <item.icon className="mt-0.5 size-4" />
                          {state === 'expanded' && (
                            <div className="flex flex-1 flex-col gap-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium leading-none">{item.title}</span>
                                {item.badge && (
                                  <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                                    {item.badge}
                                  </Badge>
                                )}
                              </div>
                              {item.description && (
                                <span className="text-xs text-muted-foreground leading-snug">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {index < navigationSections.length - 1 && <SidebarSeparator className="mt-2" />}
          </SidebarGroup>
        ))}
      </SidebarContent>
      
      <SidebarFooter>
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg bg-sidebar-accent/20 px-3 py-3 transition-all",
            isCollapsed && "justify-center px-2 py-2"
          )}
        >
          <AppUserDropdown user={user} />
          {state === 'expanded' && (
            <div className="flex flex-1 flex-col text-left">
              <span className="text-sm font-semibold leading-tight text-sidebar-foreground">{displayName}</span>
              {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
