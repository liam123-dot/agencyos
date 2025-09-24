import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, Bot, FileText, Rocket, Shield, Phone } from "lucide-react"
import Link from "next/link"

const menuItems = [
    { title: "Overview", icon: Bot },
    { title: "Prompt", icon: FileText },
    { title: "Deployment", icon: Rocket },
]

export function AgentSidebarLoading({ orgId }: { orgId: string }) {
    return (
        <aside className="flex h-screen w-72 flex-col border-r border-sidebar-border/60 bg-sidebar/95 text-sidebar-foreground backdrop-blur">
            <div className="flex flex-1 flex-col gap-10 p-6">
                <div className="flex flex-col gap-4">
                    <Link
                        href={`/app/agents`}
                        className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        Back to Agents
                    </Link>
                    <div className="space-y-4 rounded-2xl border border-sidebar-border/60 bg-sidebar-accent/10 p-5">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <Skeleton className="h-11 w-11 rounded-full" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-sidebar-border/60 bg-sidebar/60 px-3 py-2 text-xs text-muted-foreground">
                                <Shield className="h-4 w-4" />
                                <Skeleton className="h-3 w-12" />
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-sidebar-border/60 bg-sidebar/60 px-3 py-2 text-xs text-muted-foreground">
                                <Phone className="h-4 w-4" />
                                <Skeleton className="h-3 w-10" />
                            </div>
                        </div>
                        <Skeleton className="h-9 w-full" />
                    </div>
                </div>

                <nav className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <div
                                key={item.title}
                                className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground/70"
                            >
                                <Icon className="h-4 w-4" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        )
                    })}
                </nav>
            </div>

            <div className="border-t border-sidebar-border/60 bg-sidebar/50 p-6">
                <div className="rounded-xl border border-sidebar-border/40 bg-sidebar/70 p-4">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="mt-2 h-3 w-40" />
                </div>
            </div>
        </aside>
    )
}
