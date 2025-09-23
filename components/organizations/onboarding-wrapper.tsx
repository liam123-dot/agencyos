'use client';

import { useRouter } from 'next/navigation';
import { CreateOrJoinOrg } from './create-or-join-org';
import { OrganizationWithDetails } from '@/lib/types/organizations';

export function OnboardingWrapper() {
  const router = useRouter();

  const handleComplete = (organization: OrganizationWithDetails) => {
    // Redirect to app after completing onboarding
    router.push('/app');
  };

  return (
    <CreateOrJoinOrg 
      onComplete={handleComplete}
      availableInvitations={[]} // TODO: Fetch user's pending invitations server-side
    />
  );
}
