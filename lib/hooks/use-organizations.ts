'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  OrganizationWithDetails,
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  UseOrganizationsReturn,
  UseCreateOrganizationReturn,
  UseUpdateOrganizationReturn,
  Organization,
} from '@/lib/types/organizations';
import { 
  getUserOrganizations, 
  updateOrganization as updateOrganizationAction,
  deleteOrganization as deleteOrganizationAction,
  leaveOrganization as leaveOrganizationAction
} from '@/lib/actions/organization-actions';
import { createOrganization } from '@/app/api/organizations/createOrganization';

// Fetcher function for SWR using server actions
const fetcher = async (): Promise<OrganizationWithDetails[]> => {
  return await getUserOrganizations();
};

// Hook to fetch user's organizations
export function useOrganizations(): UseOrganizationsReturn {
  const { data, error, mutate } = useSWR('user-organizations', fetcher);

  return {
    organizations: data || [],
    isLoading: !error && !data,
    error: error?.message || null,
    refetch: useCallback(async () => {
      await mutate();
    }, [mutate]),
  };
}

// Hook to create organizations
export function useCreateOrganization(): UseCreateOrganizationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWR('user-organizations');

  const createOrganizationHandler = useCallback(async (data: CreateOrganizationRequest): Promise<Organization> => {
    setIsLoading(true);
    setError(null);

    console.log('Creating organization:', data);

    try {
      console.log('Creating organization:', data.name);
      const result = await createOrganization(data);

      // Show success toast
      toast.success(`Organization "${result.name}" created successfully!`);

      // Revalidate organizations list
      await mutate();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create organization';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [mutate]);

  return {
    createOrganization: createOrganizationHandler,
    isLoading,
    error,
  };
}

// Hook to update organizations
export function useUpdateOrganization(organizationId: string): UseUpdateOrganizationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWR('user-organizations');

  const updateOrganization = useCallback(async (data: UpdateOrganizationRequest): Promise<Organization> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateOrganizationAction(organizationId, data);

      // Show success toast
      toast.success(`Organization "${result.name}" updated successfully!`);

      // Revalidate organizations list
      await mutate();

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update organization';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, mutate]);

  return {
    updateOrganization,
    isLoading,
    error,
  };
}

// Hook to delete organization
export function useDeleteOrganization() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWR('user-organizations');

  const deleteOrganization = useCallback(async (organizationId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteOrganizationAction(organizationId);
      
      // Show success toast
      toast.success(result.message);

      // Revalidate organizations list
      await mutate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete organization';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [mutate]);

  return {
    deleteOrganization,
    isLoading,
    error,
  };
}

// Hook to leave organization
export function useLeaveOrganization() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { mutate } = useSWR('user-organizations');

  const leaveOrganization = useCallback(async (organizationId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await leaveOrganizationAction(organizationId);
      
      // Show success toast
      toast.success(result.message);

      // Revalidate organizations list
      await mutate();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to leave organization';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage);
      
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [mutate]);

  return {
    leaveOrganization,
    isLoading,
    error,
  };
}
