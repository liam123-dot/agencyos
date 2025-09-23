import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";

  if (code) {
    const supabase = await createServerClient();

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error && data.user) {
      // For OAuth users (like Google), set user type to 'platform' if not already set
      const { data: existingUser } = await supabase
        .from('users')
        .select('type')
        .eq('id', data.user.id)
        .single();

      // If user doesn't exist in users table or type is not set, create/update with platform type
      if (!existingUser || !existingUser.type) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert(
            {
              id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || data.user.user_metadata?.name,
              avatar_url: data.user.user_metadata?.avatar_url,
              type: 'platform',
            },
            {
              onConflict: 'id'
            }
          );
        
        if (upsertError) {
          console.error('Error setting user type for OAuth user:', upsertError);
        }
      }

      redirect(next);
    } else {
      // Redirect to error page with error message
      redirect(`/auth/error?error=${error?.message || 'Authentication failed'}`);
    }
  }

  // Redirect to error page if no code
  redirect(`/auth/error?error=No authorization code received`);
}

