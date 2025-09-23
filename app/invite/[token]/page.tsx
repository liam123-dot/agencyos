import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InvitationPage } from '@/components/organizations';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function InviteTokenPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createServerClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // If not authenticated, redirect to login with return URL
  if (!user) {
    redirect(`/auth?redirect=${encodeURIComponent(`/invite/${token}`)}`);
  }

  // Render the client-side invitation page
  return <InvitationPage token={token} />;
}
