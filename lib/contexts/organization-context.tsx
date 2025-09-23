'use client';

import React, { createContext, useContext, useCallback } from 'react';
import {
  CreateOrganizationRequest,
  UpdateOrganizationRequest,
  Organization,
  OrganizationContextValue,
} from '@/lib/types/organizations';
import { useSelectedOrganization } from '@/lib/hooks/use-selected-organization';
import { useOrganizations, useCreateOrganization, useUpdateOrganization, useDeleteOrganization, useLeaveOrganization } from '@/lib/hooks/use-organizations';

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

interface OrganizationProviderProps {
  children: React.ReactNode;
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  // Use hooks for organization data
  const {
    selectedOrganization,
    userRole,
    isLoading: selectedLoading,
    error: selectedError,
    switchOrganization: switchSelectedOrganization,
    refetch: refetchSelected,
  } = useSelectedOrganization();

  const {
    organizations,
    isLoading: orgsLoading,
    error: orgsError,
    refetch: refetchOrganizations,
  } = useOrganizations();

  const { createOrganization: createOrgMutation } = useCreateOrganization();
  const { updateOrganization: updateOrgMutation } = useUpdateOrganization(selectedOrganization?.id || '');
  const { deleteOrganization: deleteOrgMutation } = useDeleteOrganization();
  const { leaveOrganization: leaveOrgMutation } = useLeaveOrganization();

  // Combined loading state
  const isLoading = selectedLoading || orgsLoading;
  const error = selectedError || orgsError;

  // Switch organization and refetch data
  const switchOrganization = useCallback(async (organizationId: string): Promise<void> => {
    await switchSelectedOrganization(organizationId);
    await refetchOrganizations();
  }, [switchSelectedOrganization, refetchOrganizations]);

  // Refetch all organization data
  const refetchAll = useCallback(async (): Promise<void> => {
    await Promise.all([
      refetchSelected(),
      refetchOrganizations(),
    ]);
  }, [refetchSelected, refetchOrganizations]);

  // Create organization with automatic selection
  const createOrganization = useCallback(async (data: CreateOrganizationRequest): Promise<Organization> => {
    const newOrg = await createOrgMutation(data);
    
    // Switch to the newly created organization
    await switchOrganization(newOrg.id);
    
    return newOrg;
  }, [createOrgMutation, switchOrganization]);

  // Update organization
  const updateOrganization = useCallback(async (id: string, data: UpdateOrganizationRequest): Promise<Organization> => {
    const updatedOrg = await updateOrgMutation(data);
    
    // Refetch data to get updated information
    await refetchAll();
    
    return updatedOrg;
  }, [updateOrgMutation, refetchAll]);

  // Delete organization
  const deleteOrganization = useCallback(async (id: string): Promise<void> => {
    await deleteOrgMutation(id);
    
    // If the deleted org was selected, clear selection
    if (selectedOrganization?.id === id) {
      await switchSelectedOrganization(null);
    }
    
    await refetchAll();
  }, [deleteOrgMutation, selectedOrganization?.id, switchSelectedOrganization, refetchAll]);

  // Leave organization
  const leaveOrganization = useCallback(async (id: string): Promise<void> => {
    await leaveOrgMutation(id);
    
    // If the left org was selected, clear selection
    if (selectedOrganization?.id === id) {
      await switchSelectedOrganization(null);
    }
    
    await refetchAll();
  }, [leaveOrgMutation, selectedOrganization?.id, switchSelectedOrganization, refetchAll]);

  const contextValue: OrganizationContextValue = {
    currentOrganization: selectedOrganization,
    userRole,
    isLoading,
    error,
    organizations,
    switchOrganization,
    refetchOrganizations: refetchAll,
    refetchCurrentOrganization: refetchSelected,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    leaveOrganization,
  };

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganizationContext(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  return context;
}

// Convenience hooks that use the context
export function useCurrentOrganization() {
  const { currentOrganization, userRole, isLoading, error } = useOrganizationContext();
  return { currentOrganization, userRole, isLoading, error };
}

export function useOrganizationSwitcher() {
  const { organizations, switchOrganization, isLoading } = useOrganizationContext();
  return { organizations, switchOrganization, isLoading };
}
