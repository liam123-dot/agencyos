'use client';

import * as React from 'react';
import { Plus, Mail, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateOrganizationForm } from './create-organization-form';
import { CreateOrJoinOrgProps, OrganizationWithDetails, Organization } from '@/lib/types/organizations';

export function CreateOrJoinOrg({
  onComplete,
  availableInvitations,
  className,
}: CreateOrJoinOrgProps) {
  const [activeTab, setActiveTab] = React.useState('create');

  const handleOrganizationCreated = (organization: Organization) => {
    // Convert to OrganizationWithDetails format
    const orgWithDetails: OrganizationWithDetails = {
      ...organization,
      member_count: 1,
      user_role: 'owner' as const,
      is_owner: true,
      is_admin: true,
      can_manage_members: true,
      can_invite: true,
    };
    
    onComplete(orgWithDetails);
  };


  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Organization
          </TabsTrigger>
          <TabsTrigger value="join" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Join Organization
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Create New Organization
              </CardTitle>
              <CardDescription>
                Start fresh by creating your own organization. You'll be the owner and can invite team members.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateOrganizationForm
                onSuccess={handleOrganizationCreated}
                onCancel={() => {}} // No cancel action needed in onboarding
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="join" className="space-y-6">
          {availableInvitations.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pending Invitations</h3>
              {availableInvitations.map((invitation) => (
                <Card key={invitation.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h4 className="font-medium">{invitation.organization_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Invited by {invitation.invited_by_name || invitation.invited_by_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Role: {invitation.role} • Expires in {invitation.days_until_expiry} days
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            // TODO: Accept invitation and call onComplete
                            // This would need to be implemented with the invitation acceptance logic
                          }}
                        >
                          Accept
                        </Button>
                        <Button size="sm" variant="outline">
                          Decline
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center space-y-4">
                <Mail className="h-12 w-12 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">No Invitations</h3>
                  <p className="text-muted-foreground">
                    You don't have any pending organization invitations.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Ask a team member to send you an invitation, or create your own organization.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('create')}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Organization Instead
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
