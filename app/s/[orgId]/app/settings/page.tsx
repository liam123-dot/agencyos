
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GeneralSettings } from '@/components/settings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export default async function SettingsPage() {
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

    return (
        <div className="p-4 md:p-6">
            <div className="mx-auto max-w-4xl space-y-6">
                {/* General Settings Card */}
                <Card className="border-border/60 shadow-sm">
                    <CardHeader className="border-b border-border/40 bg-muted/20">
                        <CardTitle className="flex items-center gap-2 text-base font-medium">
                            <User className="h-4 w-4" />
                            Profile Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <GeneralSettings user={user} userProfile={userProfile} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}