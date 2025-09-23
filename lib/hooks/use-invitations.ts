'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  InvitationWithDetails,
  InviteMemberRequest,
  InviteMembersRequest,
  OrganizationInvitation,
  UsePendingInvitationsReturn,
  UseInviteMembersReturn,
  UseInvitationActionsReturn,
  UseInvitationDetailsReturn,
  ApiResponse,
} from '@/lib/types/organizations';

// Fetcher function for SWR
const fetcher = async (url: string): Promise<InvitationWithDetails[]> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch invitations');
  }
  const data: ApiResponse<InvitationWithDetails[]> = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch invitations');
  }
  return data.data || [];
};

// Fetcher for single invitation
const invitationFetcher = async (url: string): Promise<InvitationWithDetails> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch invitation');
  }
  const data: ApiResponse<InvitationWithDetails> = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch invitation');
  }
  return data.data!;
};

// Hook to fetch pending invitations
export function usePendingInvitations(organizationId: string): UsePendingInvitationsReturn {
  const { data, error, mutate } = useSWR(
    organizationId ? `/api/organizations/${organizationId}/invitations` : null,
    fetcher
  );

  const cancelInvitation = useCallback(async (invitationId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel invitation');
      }

      // Revalidate invitations list
      await mutate();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to cancel invitation');
    }
  }, [mutate]);

  const resendInvitation = useCallback(async (invitationId: string): Promise<void> => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend invitation');
      }

      // Revalidate invitations list
      await mutate();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to resend invitation');
    }
  }, [mutate]);

  return {
    invitations: data || [],
    isLoading: !error && !data,
    error: error?.message || null,
    refetch: useCallback(async () => {
      await mutate();
    }, [mutate]),
    cancelInvitation,
    resendInvitation,
  };
}

// Hook to invite members
export function useInviteMembers(organizationId: string): UseInviteMembersReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWR(`/api/organizations/${organizationId}/invitations`);

  const inviteMember = useCallback(async (data: InviteMemberRequest): Promise<OrganizationInvitation> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<OrganizationInvitation[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to invite member');
      }

      // Revalidate invitations list
      await mutate();

      return result.data![0]; // Single invitation
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite member';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, mutate]);

  const inviteMembers = useCallback(async (data: InviteMembersRequest): Promise<OrganizationInvitation[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result: ApiResponse<OrganizationInvitation[]> = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to invite members');
      }

      // Revalidate invitations list
      await mutate();

      return result.data!;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to invite members';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, mutate]);

  return {
    inviteMembers,
    inviteMember,
    isLoading,
    error,
  };
}

// Hook to get invitation details by token
export function useInvitationDetails(token: string): UseInvitationDetailsReturn {
  const { data, error, mutate } = useSWR(
    token ? `/api/invitations/${token}` : null,
    invitationFetcher
  );

  const [actionLoading, setActionLoading] = useState(false);

  const isExpired = data ? new Date(data.expires_at) < new Date() : false;

  const acceptInvitation = useCallback(async (): Promise<void> => {
    if (!token) throw new Error('No invitation token');

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }

      // Revalidate invitation details
      await mutate();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setActionLoading(false);
    }
  }, [token, mutate]);

  const declineInvitation = useCallback(async (): Promise<void> => {
    if (!token) throw new Error('No invitation token');

    setActionLoading(true);
    try {
      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to decline invitation');
      }

      // Revalidate invitation details
      await mutate();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to decline invitation');
    } finally {
      setActionLoading(false);
    }
  }, [token, mutate]);

  return {
    invitation: data || null,
    isLoading: (!error && !data) || actionLoading,
    error: error?.message || null,
    isExpired,
    acceptInvitation,
    declineInvitation,
  };
}

// Hook for invitation actions (accept, decline, cancel, resend)
export function useInvitationActions(): UseInvitationActionsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const acceptInvitation = useCallback(async (token: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to accept invitation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to accept invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const declineInvitation = useCallback(async (token: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${token}/decline`, {
        method: 'POST',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to decline invitation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to decline invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const cancelInvitation = useCallback(async (invitationId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to cancel invitation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendInvitation = useCallback(async (invitationId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/invitations/${invitationId}/resend`, {
        method: 'POST',
      });

      const result: ApiResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to resend invitation');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    acceptInvitation,
    declineInvitation,
    cancelInvitation,
    resendInvitation,
    isLoading,
    error,
  };
}
