import { OnboardingGuard } from "@/components/organizations";
import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { DynamicSidebarProvider } from "@/components/dynamic-sidebar-provider";
import { MainContentWrapper } from "@/components/main-content-wrapper";
import { PlatformLevelProviders } from "@/components/platformLevelProviders";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return (
    <PlatformLevelProviders>
      <DynamicSidebarProvider>
        <AppSidebar user={user} />
        <SidebarInset>
          <MainContentWrapper>
            <OnboardingGuard redirectTo="/onboarding">
              {children}
            </OnboardingGuard>
          </MainContentWrapper>
        </SidebarInset>
      </DynamicSidebarProvider>
    </PlatformLevelProviders>
  );
}
