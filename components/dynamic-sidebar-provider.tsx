'use client';

import { SidebarProvider } from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function DynamicSidebarProvider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const pathname = usePathname();
    const isClientPage = pathname.includes('/app/clients/');
    const isAgentDetailPage = pathname.match(/\/app\/agents\/[^/]+/);
    const shouldCloseSidebar = isClientPage || isAgentDetailPage;
    const [isOpen, setIsOpen] = useState(!shouldCloseSidebar);

    useEffect(() => {
      setIsOpen(!shouldCloseSidebar);
    }, [pathname, shouldCloseSidebar]);
  
    return (
      <SidebarProvider open={isOpen} onOpenChange={setIsOpen}>
        {children}
      </SidebarProvider>
    );
  }
