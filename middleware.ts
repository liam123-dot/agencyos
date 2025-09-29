import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * - /api/stripe/[orgId]/webhook (Stripe webhooks need public access)
     * - /api/agents/[agentId]/webhook (Agent webhooks need public access)
     * - /api/phone-numbers/[numberid]/webhook (Phone number webhooks need public access)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/.*/webhook|api/agents/.*/webhook|api/phone-numbers/.*/webhook|api/knowledge-base/.*/query|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
