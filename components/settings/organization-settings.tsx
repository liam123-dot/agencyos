'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSelectedOrganization } from '@/lib/hooks/use-selected-organization';
import { useUserRole } from '@/lib/hooks/use-user-role';
import { OrganizationMembersSection } from '@/components/settings/organization-members-section';
import { OrganizationInvitationsSection } from '@/components/settings/organization-invitations-section';
import { OrganizationManagementSection } from '@/components/settings/organization-management-section';
// import { VapiSetup } from '@/components/settings/vapi-setup';
import { Users, Mail, Settings as SettingsIcon, AlertCircle, Key } from 'lucide-react';

export function OrganizationSettings() {
  const { selectedOrganization, userRole, isLoading: orgLoading } = useSelectedOrganization();
  const { role, isOwner, isAdmin, canManageMembers, canInvite } = useUserRole(selectedOrganization?.id || '');

  if (orgLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!selectedOrganization) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please select an organization from the navigation bar to manage its settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      {/* Members Section */}
      <div className="rounded-lg border bg-card">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Members</h3>
              <p className="text-sm text-gray-500">Manage organization members and their roles</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <OrganizationMembersSection 
            organizationId={selectedOrganization.id}
            canManage={canManageMembers}
            currentUserRole={userRole}
          />
        </div>
      </div>

      {/* Invitations Section */}
      {canInvite && (
        <div className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                <Mail className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Invitations</h3>
                <p className="text-sm text-gray-500">Send and manage pending member invitations</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <OrganizationInvitationsSection 
              organizationId={selectedOrganization.id}
              canInvite={canInvite}
              canManage={canManageMembers}
            />
          </div>
        </div>
      )}

      {/* Vapi Setup Section - Owner Only */}
      {/* {isOwner && (
        <div className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 flex items-center justify-center">
                <Key className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Vapi Integration</h3>
                <p className="text-sm text-gray-500">Configure AI voice capabilities for your organization</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <VapiSetup 
              organization={selectedOrganization}
              isOwner={isOwner}
            />
          </div>
        </div>
      )} */}

      {/* Management Section - Owner Only */}
      {isOwner && (
        <div className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <SettingsIcon className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Management</h3>
                <p className="text-sm text-gray-500">Organization settings and administrative controls</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <OrganizationManagementSection 
              organization={selectedOrganization}
              isOwner={isOwner}
            />
          </div>
        </div>
      )}
    </div>
  );
}
