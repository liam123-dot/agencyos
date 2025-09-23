import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { AppUserDropdown } from "@/components/app-user-dropdown";
import { AppOrganizationSelector } from "@/components/app-organization-selector";

export async function AppNavigation() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/app" className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-xl">Whitelabel</span>
          </Link>
          
          {user && (
            <div className="hidden md:flex items-center space-x-4 ml-8">
              <Link 
                href="/app" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/app/settings" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Settings
              </Link>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-4">
          {user && <AppOrganizationSelector />}
          {user && <AppUserDropdown user={user} />}
        </div>
      </div>
    </nav>
  );
}
