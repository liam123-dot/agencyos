import { OnboardingGuard } from "@/components/organizations";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { PlatformUserBanner } from "@/components/ClientsDashboard/ClientsSidebar/PlatformUserBanner";
import { ClientDashboardSidebar } from "@/components/ClientsDashboard/ClientsSidebar/ClientDashboardSidebar";
import { OrganizationName } from "@/components/ClientsDashboard/ClientsSidebar/OrganizationName";
import { OrganizationBranding } from "@/components/ClientsDashboard/OrganizationBranding";
import { DynamicSidebarProvider } from "@/components/dynamic-sidebar-provider";
import { MainContentWrapper } from "@/components/main-content-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { getUser } from "@/app/api/user/getUser";

export default async function ClientDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const supabase = await createServerClient();

  const user = await getUser()
  const { orgId } = await params;
  if (!user.userData) {
    redirect("/auth");
  }

  // For now, we'll use a placeholder clientId since we don't have it in the URL structure yet
  // This would typically come from the URL params or be fetched based on the current context

  return (
    // <PlatformLevelProviders>
      <DynamicSidebarProvider>
        {/* Dynamic title based on organization branding */}
        <Suspense fallback={null}>
          <OrganizationBranding orgId={orgId} />
        </Suspense>
        
        <ClientDashboardSidebar 
          user={user.userData} 
          orgId={orgId}
          clientId={user.userData.client_id}
          isPlatformUser={user.userData.type === 'platform'}
          organizationName={  
            <Suspense fallback={<Skeleton className="h-7 w-32" />}>
              <OrganizationName orgId={orgId} />
            </Suspense>
          }
        />
        <SidebarInset>
          {user.userData.type === 'platform' && <PlatformUserBanner />}
          <MainContentWrapper>
            
              {children}
            
          </MainContentWrapper>
        </SidebarInset>
      </DynamicSidebarProvider>
    // </PlatformLevelProviders>
  );
}
