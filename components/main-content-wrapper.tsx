'use client';

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MainContentWrapper({
    children,
  }: {
    children: React.ReactNode;
  }) {
    const pathname = usePathname();
    const isSpecificClientPage = pathname.startsWith('/app/clients/');

    return (
        <main className={cn("flex-1 bg-muted/50", !isSpecificClientPage && "p-4")}>
            {children}
        </main>
    );
  }
