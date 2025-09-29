import { OnboardingGuard } from "@/components/organizations";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { PlatformUserBanner } from "@/components/ClientsDashboard/ClientsSidebar/PlatformUserBanner";
import { ClientDashboardSidebar } from "@/components/ClientsDashboard/ClientsSidebar/ClientDashboardSidebar";
import { OrganizationName } from "@/components/ClientsDashboard/ClientsSidebar/OrganizationName";
import { DynamicSidebarProvider } from "@/components/dynamic-sidebar-provider";
import { MainContentWrapper } from "@/components/main-content-wrapper";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";
import { getUser } from "@/app/api/user/getUser";
import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";

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

  // Fetch organization data for the sidebar
  const organizationData = await getPublicOrg(orgId);

  // For now, we'll use a placeholder clientId since we don't have it in the URL structure yet
  // This would typically come from the URL params or be fetched based on the current context

  return (
    // <PlatformLevelProviders>
      <DynamicSidebarProvider>
        <ClientDashboardSidebar 
          user={user.userData} 
          orgId={orgId}
          clientId={user.userData.client_id}
          isPlatformUser={user.userData.type === 'platform'}
          organizationData={{
            name: organizationData.name,
            logo_url: organizationData.logo_url
          }}
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
