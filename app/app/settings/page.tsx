import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsPage } from '@/components/settings-page';

export default async function Settings() {
  const supabase = await createServerClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    redirect('/auth');
  }

  // Get user profile data
  const { data: userProfile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return <SettingsPage user={user} userProfile={userProfile} />;
}
