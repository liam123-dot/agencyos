'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  OrganizationMember,
  OrganizationRole,
  UpdateMemberRoleRequest,
  UseOrganizationMembersReturn,
  UseManageMembersReturn,
  ApiResponse,
} from '@/lib/types/organizations';

// Fetcher function for SWR
const fetcher = async (url: string): Promise<OrganizationMember[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }
  const data: ApiResponse<OrganizationMember[]> = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch members');
  }
  return data.data || [];
};

// Hook to fetch organization members
export function useOrganizationMembers(organizationId: string): UseOrganizationMembersReturn {
  const { data, error, mutate } = useSWR(
    organizationId ? `/api/organizations/${organizationId}/members` : null,
    fetcher
  );

  const updateMemberRole = useCallback(async (userId: string, role: OrganizationRole): Promise<void> => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role } as UpdateMemberRoleRequest),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update member role');
      }

      // Revalidate members list
      await mutate();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update member role');
    }
  }, [organizationId, mutate]);

  const removeMember = useCallback(async (userId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${userId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove member');
      }

      // Revalidate members list
      await mutate();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to remove member');
    }
  }, [organizationId, mutate]);

  return {
    members: data || [],
    isLoading: !error && !data,
    error: error?.message || null,
    refetch: useCallback(async () => {
      await mutate();
    }, [mutate]),
    updateMemberRole,
    removeMember,
  };
}

// Hook for member management actions
export function useManageMembers(organizationId: string): UseManageMembersReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWR(`/api/organizations/${organizationId}/members`);

  const updateMemberRole = useCallback(async (userId: string, role: OrganizationRole): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${userId}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role } as UpdateMemberRoleRequest),
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to update member role');
      }

      // Revalidate members list
      await mutate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update member role';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, mutate]);

  const removeMember = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${userId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove member');
      }

      // Revalidate members list
      await mutate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, mutate]);

  const transferOwnership = useCallback(async (userId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // First promote the user to owner
      await updateMemberRole(userId, 'owner');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to transfer ownership';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [updateMemberRole]);

  return {
    updateMemberRole,
    removeMember,
    transferOwnership,
    isLoading,
    error,
  };
}
