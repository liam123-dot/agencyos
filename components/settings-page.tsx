'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/lib/types/organizations';
import { GeneralSettings, OrganizationSettings } from '@/components/settings';
import { User as UserIcon, Building2 } from 'lucide-react';

interface SettingsPageProps {
  user: User;
  userProfile: UserProfile | null;
}

export function SettingsPage({ user, userProfile }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="organization" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-0">
            <div className="rounded-lg border bg-card p-6">
              <GeneralSettings user={user} userProfile={userProfile} />
            </div>
          </TabsContent>

          <TabsContent value="organization" className="space-y-0">
            <OrganizationSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
