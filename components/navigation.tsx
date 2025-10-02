import Link from "next/link";
import { Button } from "./ui/button";
import { createServerClient } from "@/lib/supabase/server";

export async function Navigation() {
  const supabase = await createServerClient();
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/" prefetch={true} className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">W</span>
            </div>
            <span className="font-bold text-xl">AgencyOS</span>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {user ? (
            <Button asChild variant="ghost" size="sm">
              <Link href="/app" prefetch={true}>Dashboard</Link>
            </Button>
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth" prefetch={true}>Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/auth/sign-up" prefetch={true}>Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
