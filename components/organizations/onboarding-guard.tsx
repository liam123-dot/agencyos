'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useCurrentOrganization, useOrganizationSwitcher } from '@/lib/contexts/organization-context';
import { useSelectedOrganization } from '@/lib/hooks/use-selected-organization';
import { OnboardingFlowProps, OnboardingState } from '@/lib/types/organizations';
import { CreateOrJoinOrg } from './create-or-join-org';

export function OnboardingGuard({
  children,
  fallback,
  redirectTo = '/onboarding',
}: OnboardingFlowProps) {
  const { currentOrganization, isLoading, error } = useCurrentOrganization();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = React.useState(false);

  // Determine onboarding state
  const onboardingState: OnboardingState = React.useMemo(() => {
    if (isLoading) {
      return {
        step: 'loading',
        hasOrganization: false,
        selectedOrganization: null,
        availableInvitations: [],
        isLoading: true,
        error: null,
      };
    }

    if (error) {
      return {
        step: 'error',
        hasOrganization: false,
        selectedOrganization: null,
        availableInvitations: [],
        isLoading: false,
        error,
      };
    }

    if (currentOrganization) {
      return {
        step: 'has_organization',
        hasOrganization: true,
        selectedOrganization: currentOrganization,
        availableInvitations: [],
        isLoading: false,
        error: null,
      };
    }

    return {
      step: 'needs_organization',
      hasOrganization: false,
      selectedOrganization: null,
      availableInvitations: [],
      isLoading: false,
      error: null,
    };
  }, [currentOrganization, isLoading, error]);

  // Handle redirect logic
  React.useEffect(() => {
    if (onboardingState.step === 'needs_organization' && !shouldRedirect) {
      setShouldRedirect(true);
      router.push(redirectTo);
    }
  }, [onboardingState.step, shouldRedirect, router, redirectTo]);

  // Show loading state
  if (onboardingState.step === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (onboardingState.step === 'error') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-destructive">Error</h3>
          <p className="text-muted-foreground">{onboardingState.error}</p>
        </div>
      </div>
    );
  }

  // Show fallback or redirect if no organization
  if (onboardingState.step === 'needs_organization') {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // This will be rendered briefly before redirect
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Setting up your workspace...</span>
        </div>
      </div>
    );
  }

  // User has an organization, show children
  return <>{children}</>;
}

// Onboarding page component
export function OnboardingPage() {
  const router = useRouter();
  const { currentOrganization, isLoading, error } = useCurrentOrganization();
  const { organizations } = useOrganizationSwitcher();
  const { switchOrganization } = useSelectedOrganization();
  const [isChecking, setIsChecking] = React.useState(true);

  // Check if user has organizations and auto-select if needed
  React.useEffect(() => {
    const checkAndAutoSelect = async () => {
      if (isLoading) return;

      // If user already has a selected organization, redirect to app
      if (currentOrganization) {
        console.log('User already has selected organization, redirecting to app');
        router.push('/app');
        return;
      }

      // If user has organizations but none selected, auto-select the first one
      if (organizations && organizations.length > 0) {
        console.log('Auto-selecting first organization and redirecting to app');
        try {
          await switchOrganization(organizations[0].id);
          router.push('/app');
          return;
        } catch (error) {
          console.error('Failed to auto-select organization:', error);
        }
      }

      // No organizations found, show onboarding flow
      setIsChecking(false);
    };

    checkAndAutoSelect();
  }, [currentOrganization, organizations, isLoading, router, switchOrganization]);

  const handleComplete = () => {
    router.push('/app'); // Redirect to app after completing onboarding
  };

  // Show loading while checking organizations
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Setting up your workspace...</span>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-destructive">Error</h3>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  // Show onboarding flow for users without organizations
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center space-y-4 mb-8">
            <h1 className="text-3xl font-bold">Welcome!</h1>
            <p className="text-muted-foreground text-lg">
              Let's get you set up with an organization to start collaborating.
            </p>
          </div>
          
          <CreateOrJoinOrg 
            onComplete={handleComplete}
            availableInvitations={[]} // TODO: Fetch user's pending invitations
          />
        </div>
      </div>
    </div>
  );
}
