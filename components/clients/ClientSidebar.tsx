'use client';

import { getClient } from "@/app/api/clients/getClient";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "../ui/button";
import { useCurrentOrganization } from "@/lib/contexts/organization-context";
import { ExternalLink } from "lucide-react";

const menuItems = [
    {
      title: 'Overview',
      url: (id: string) => `/app/clients/${id}`,
    },
    {
      title: 'Agents',
      url: (id: string) => `/app/clients/${id}/agents`,
    },
    {
      title: 'Members',
      url: (id: string) => `/app/clients/${id}/members`,
    },
    {
      title: 'Products',
      url: (id: string) => `/app/clients/${id}/products`,
    },
  ];

export function ClientSidebar({ id }: { id: string }) {
    const pathname = usePathname();
    const {currentOrganization} = useCurrentOrganization();
    const [clientName, setClientName] = useState('');
    
    useEffect(() => {
        const fetchClient = async () => {
            const client = await getClient(id);
            if (client) {
                setClientName(client.name);
            }
        };
        fetchClient();
    }, [id]);


  return (
    <div className="flex flex-col w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6 pb-4">
            <h2 className="text-2xl font-bold tracking-tight mb-4 text-foreground">{clientName}</h2>
            <Button 
              variant="default" 
              size="sm" 
              className="w-full font-medium shadow-sm" 
              asChild
            >
              <Link 
                href={`/s/${currentOrganization?.id}/app?client_id=${id}`}
                prefetch={true}
                target="_blank"
                rel="noopener noreferrer"
              >
                Access Dashboard
                <ExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
        </div>
        <Separator className="bg-sidebar-border/60" />
      <nav className="flex flex-col gap-2 p-4 pt-6">
        {menuItems.map((item) => (
          <Link
            key={item.title}
            href={item.url(id)}
            prefetch={true}
            className={cn(
                'px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center',
                pathname === item.url(id) 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' 
                  : 'hover:bg-sidebar-accent/50 hover:shadow-sm'
            )}
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  );
}