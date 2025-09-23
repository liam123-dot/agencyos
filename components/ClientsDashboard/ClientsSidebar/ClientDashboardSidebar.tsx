"use client"

import Link from "next/link";
import { BarChart3, Bot, Workflow, Box, Settings, Phone, CreditCard } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppUserDropdown } from "@/components/app-user-dropdown";

interface ClientDashboardSidebarProps {
  user: {
    email?: string;
  };
  orgId: string;
  clientId: string;
  organizationName: React.ReactNode;
  isPlatformUser: boolean;
}

// Menu items for client dashboard
const menuItems = [
  {
    title: "Analytics",
    url: "/app",
    icon: BarChart3,
  },
  {
    title: "Calls",
    url: "/app/calls",
    icon: Phone,
  },
  {
    title: "Agents",
    url: "/app/agents",
    icon: Bot,
  },
  {
    title: "Workflows",
    url: "/app/workflows",
    icon: Workflow,
  },
  {
    title: "Billing",
    url: "/app/billing",
    icon: CreditCard,
  },
  {
    title: "Phone Numbers",
    url: "/app/phone-numbers",
    icon: Phone,
  },
  {
    title: "Settings",
    url: "/app/settings",
    icon: Settings,
  },
];

export function ClientDashboardSidebar({ user, orgId, clientId, organizationName, isPlatformUser }: ClientDashboardSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useSidebar();

  // Detect if we're in a platform user context (s/[orgId] route)
  const isPlatformUserContext = pathname.startsWith(`/s/${orgId}`);
  const baseUrl = isPlatformUserContext ? `/s/${orgId}` : '';
  
  // Preserve client_id query parameter for platform users
  const clientIdParam = searchParams.get('client_id');
  const queryString = isPlatformUserContext && clientIdParam ? `?client_id=${clientIdParam}` : '';

  console.log('baseUrl', baseUrl);
  console.log('clientIdParam', clientIdParam);
  console.log('queryString', queryString);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          {state === 'expanded' && organizationName}
        </div>
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const fullUrl = `${baseUrl}${item.url}${queryString}`;
                const pathUrl = `${baseUrl}${item.url}`;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={pathname === pathUrl}
                      tooltip={item.title}
                    >
                      <Link href={fullUrl}>
                        <item.icon />
                        {state === 'expanded' && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="border-t border-sidebar-border">
        <div className="p-2">
          <AppUserDropdown user={user} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
