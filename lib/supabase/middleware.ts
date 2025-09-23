import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";
import { SupabaseClient } from "@supabase/supabase-js";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Add a header to indicate if we're on the main domain
  supabaseResponse.headers.set('x-is-main-domain', isMainDomain(request).toString());

  // If the env vars are not set, skip middleware check. You can remove this
  // once you setup the project.
  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // With Fluid compute, don't put this client in a global environment
  // variable. Always create a new one on each request.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Do not run code between createServerClient and
  // supabase.auth.getClaims(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!isMainDomain(request)) {
    console.log('not main domain, redirecting to /s/[domain]');
    const hostname = request.headers.get('host') || '';
    // get the path part of the url
    const path = request.nextUrl.pathname;
    // get the search params to preserve query parameters
    const searchParams = request.nextUrl.search;
    const domain = hostname.replace('http://', '').replace('https://', '');
    console.log('domain', domain);
    
    const organization = await getDomainOrganization(supabase, domain);
    console.log('organization', organization);
    if (organization) {
      // Check if this is an app route that requires authentication and access control
      if (path.startsWith('/app')) {
        const accessResult = await checkUserAccessToOrganization(supabase, user, organization.id);
        
        if (!accessResult.hasAccess) {
          // Redirect to login if not authenticated or no access
          const loginUrl = new URL('/auth', request.url);
          return NextResponse.redirect(loginUrl);
        }

        // If user has access via client (not direct org membership), include client_id in URL
        if (accessResult.accessViaClient && accessResult.clientId) {
          console.log(`redirecting to /s/${organization.id}${path}${searchParams} with client_id: ${accessResult.clientId}`);
          // Construct the URL with client_id parameter
          const rewriteUrl = new URL(`/s/${organization.id}${path}`, request.url);
          // Preserve existing search params and add client_id
          const urlParams = new URLSearchParams(searchParams);
          urlParams.set('client_id', accessResult.clientId);
          rewriteUrl.search = urlParams.toString();
          return NextResponse.rewrite(rewriteUrl);
        }
      }

      console.log(`redirecting to /s/${organization.id}${path}${searchParams}`);
      return NextResponse.rewrite(new URL(`/s/${organization.id}${path}${searchParams}`, request.url));
    } else {
      // block the request
      return NextResponse.rewrite(new URL(`/blocked${searchParams}`, request.url));
    }
  }

  // Check for main domain /s/[orgId] routes
  if (isMainDomain(request) && request.nextUrl.pathname.startsWith("/s/")) {
    const pathSegments = request.nextUrl.pathname.split('/');
    if (pathSegments.length >= 3 && pathSegments[1] === 's') {
      const orgId = pathSegments[2];
      const clientIdParam = request.nextUrl.searchParams.get('client_id');
      
      // Only check if user is authenticated
      if (user) {
        const orgMemberCheck = await checkMainDomainOrgAccess(supabase, user, orgId, clientIdParam);
        
        if (orgMemberCheck.shouldRedirect) {
          const redirectUrl = new URL('/app/clients', request.url);
          return NextResponse.redirect(redirectUrl);
        }
      }
    }
  }

  // Redirect authenticated users to /app when they visit auth pages only
  if (user && request.nextUrl.pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users to login for protected routes
  if (
    request.nextUrl.pathname !== "/" &&
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    // no user, potentially respond by redirecting the user to the login page
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}


const rootDomain = process.env.NEXT_PUBLIC_APP_URL!
// remove the http:// or https://
const rootHost = rootDomain.replace('http://', '').replace('https://', '');

const isMainDomain = (request: NextRequest) => {

  if (process.env.VERCEL_ENV === 'preview') {
    // in preview, the hostname contains .vercel.app
    return request.headers.get('host')?.endsWith('.vercel.app') || false;
  }

  const hostname = request.headers.get('host') || '';
  console.log('Hostname:', hostname);
  console.log('Root Domain:', rootHost);
  return hostname === rootHost;

}


async function getDomainOrganization(supabase: SupabaseClient, domain: string) {
  
  console.log('Getting domain organization for:', domain);
  const { data: organization, error } = await supabase.from('organizations').select('*').eq('domain', domain).single()
  if (error) {
    console.log('Error getting domain organization:', error);
    return null
  }
  console.log('Domain organization:', organization);
  return organization

}

async function checkUserAccessToOrganization(supabase: SupabaseClient, user: any, organizationId: string) {
  // If no user, no access
  if (!user) {
    return { hasAccess: false, accessViaClient: false, clientId: null };
  }

  try {
    // Get user data including client_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, client_id, type')
      .eq('id', user.sub)
      .single();

    if (userError || !userData) {
      console.log('Error fetching user data:', userError);
      return { hasAccess: false, accessViaClient: false, clientId: null };
    }

    // Check if user is a direct member of the organization
    const { data: orgMembership, error: memberError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userData.id)
      .eq('organization_id', organizationId)
      .single();

    // If user is a direct organization member, they have access (no client_id needed)
    if (!memberError && orgMembership) {
      return { hasAccess: true, accessViaClient: false, clientId: null };
    }

    // If user has a client_id, check if that client belongs to this organization
    if (userData.client_id) {
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, organization_id')
        .eq('id', userData.client_id)
        .eq('organization_id', organizationId)
        .single();

      if (!clientError && clientData) {
        // User has access via client membership
        return { hasAccess: true, accessViaClient: true, clientId: userData.client_id };
      }
    }

    // No access found
    return { hasAccess: false, accessViaClient: false, clientId: null };
  } catch (error) {
    console.log('Error checking user access:', error);
    return { hasAccess: false, accessViaClient: false, clientId: null };
  }
}

async function checkMainDomainOrgAccess(supabase: SupabaseClient, user: any, organizationId: string, clientIdParam: string | null) {
  // If no user, don't redirect
  if (!user) {
    return { shouldRedirect: false };
  }

  try {
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, client_id, type')
      .eq('id', user.sub)
      .single();

    if (userError || !userData) {
      console.log('Error fetching user data:', userError);
      return { shouldRedirect: false };
    }

    // Check if user is a direct member of the organization
    const { data: orgMembership, error: memberError } = await supabase
      .from('user_organizations')
      .select('role')
      .eq('user_id', userData.id)
      .eq('organization_id', organizationId)
      .single();

    // If user is a direct organization member AND no client_id param is provided
    // This means they're accessing s/[orgId] without specifying which client they want to view
    if (!memberError && orgMembership && !clientIdParam) {
      console.log('Redirecting org member to /app/clients - no client_id param provided');
      return { shouldRedirect: true };
    }

    // Don't redirect in other cases
    return { shouldRedirect: false };
  } catch (error) {
    console.log('Error checking main domain org access:', error);
    return { shouldRedirect: false };
  }
}