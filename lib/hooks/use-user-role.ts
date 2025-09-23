'use client';

import useSWR from 'swr';
import {
  OrganizationRole,
  UseUserRoleReturn,
  ApiResponse,
} from '@/lib/types/organizations';
import {
  isOwner,
  isAdmin,
  isMember,
  canManageMembers,
  canInviteMembers,
  canEditOrganization,
  canDeleteOrganization,
} from '@/lib/utils/organizations';

// Fetcher function for user's role in an organization
const roleFetcher = async (url: string): Promise<OrganizationRole | null> => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404 || response.status === 403) {
      return null; // User is not a member
    }
    throw new Error('Failed to fetch user role');
  }
  const data: ApiResponse<{ role: OrganizationRole }> = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch user role');
  }
  return data.data?.role || null;
};

// Hook to get user's role in a specific organization
export function useUserRole(organizationId: string): UseUserRoleReturn {
  const { data: role, error } = useSWR(
    organizationId ? `/api/organizations/${organizationId}/user-role` : null,
    roleFetcher
  );

  const isLoading = !error && role === undefined;

  return {
    role: role || null,
    isOwner: isOwner(role),
    isAdmin: isAdmin(role),
    isMember: isMember(role),
    canManageMembers: canManageMembers(role),
    canInvite: canInviteMembers(role),
    canManageSettings: canEditOrganization(role),
    canDelete: canDeleteOrganization(role),
    isLoading,
  };
}

// Hook to get user's role from organization data (when already available)
export function useUserRoleFromOrg(role: OrganizationRole | null): Omit<UseUserRoleReturn, 'isLoading'> {
  return {
    role,
    isOwner: isOwner(role),
    isAdmin: isAdmin(role),
    isMember: isMember(role),
    canManageMembers: canManageMembers(role),
    canInvite: canInviteMembers(role),
    canManageSettings: canEditOrganization(role),
    canDelete: canDeleteOrganization(role),
  };
}
