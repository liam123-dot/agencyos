import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Bot, FileText, Rocket } from "lucide-react";
import Link from "next/link";

const menuItems = [
  { title: 'Overview', icon: Bot },
  { title: 'Prompt', icon: FileText },
  { title: 'Deployment', icon: Rocket },
];

export function AgentSidebarLoading({ orgId }: { orgId: string }) {
  return (
    <div className="flex flex-col w-64 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="p-6 pb-4">
        <Link 
          href={`/app/agents`}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Agents
        </Link>
        
        {/* Loading agent name */}
        <Skeleton className="h-8 w-32 mb-6" />
        
        {/* Loading test button */}
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <Separator className="bg-sidebar-border/60" />
      <nav className="flex flex-col gap-2 p-4 pt-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-3 opacity-50"
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </div>
          );
        })}
      </nav>
    </div>
  );
}
