'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import {
  OrganizationWithDetails,
  OrganizationRole,
} from '@/lib/types/organizations';
import { getSelectedOrganization, updateSelectedOrganization } from '@/lib/actions/organization-actions';

interface SelectedOrganizationData {
  organization: OrganizationWithDetails | null;
  role: OrganizationRole | null;
}

// Fetcher function for selected organization using server actions
const fetcher = async (): Promise<SelectedOrganizationData> => {
  return await getSelectedOrganization();
};

// Hook to manage user's selected organization
export function useSelectedOrganization() {
  const { data, error, mutate } = useSWR('selected-organization', fetcher, {
    // Reduce aggressive revalidation that might be causing issues
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    errorRetryCount: 1,
    errorRetryInterval: 5000,
    // Keep data on error to prevent null flashing
    keepPreviousData: true,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const switchOrganization = useCallback(async (organizationId: string | null): Promise<void> => {
    setIsUpdating(true);
    try {
      await updateSelectedOrganization(organizationId);
      // Revalidate the data
      await mutate();
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to switch organization');
    } finally {
      setIsUpdating(false);
    }
  }, [mutate]);

  return {
    selectedOrganization: data?.organization || null,
    userRole: data?.role || null,
    isLoading: !error && !data,
    isUpdating,
    error: error?.message || null,
    switchOrganization,
    refetch: useCallback(async () => {
      await mutate();
    }, [mutate]),
  };
}
