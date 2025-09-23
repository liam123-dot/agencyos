'use client';

import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { UserProfile } from '@/lib/types/organizations';
import { Loader2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface GeneralSettingsProps {
  user: User;
  userProfile: UserProfile | null;
}

export function GeneralSettings({ user, userProfile }: GeneralSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: userProfile?.full_name || '',
    email: user.email || '',
  });

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Update user profile in the users table
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: formData.full_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) {
        throw new Error(profileError.message);
      }

      // If email has changed, update auth user email
      if (formData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) {
          throw new Error(emailError.message);
        }

        setSuccess('Profile updated successfully! Please check your new email for verification if you changed it.');
      } else {
        setSuccess('Profile updated successfully!');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Profile Information</h3>
        <p className="text-sm text-gray-500">Update your personal details and account settings.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              placeholder="Enter your full name"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-muted-foreground">
              If you change your email, you'll need to verify the new address.
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </form>

      <Separator />

      <div className="space-y-4">
        <div className="pb-3 border-b border-gray-100">
          <h3 className="text-lg font-medium text-gray-900">Account Information</h3>
          <p className="text-sm text-gray-500">View your account details and metadata.</p>
        </div>

        <div className="grid gap-4 text-sm bg-gray-50/50 rounded-lg p-4 border border-gray-200/50">
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">User ID:</span>
            <span className="font-mono text-xs">{user.id}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Account Created:</span>
            <span>{userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-muted-foreground">Last Updated:</span>
            <span>{userProfile?.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
