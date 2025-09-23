'use server'

import { Suspense } from 'react';
import { OnboardingServer } from '@/components/organizations/onboarding-server';
import { OnboardingLoading } from '@/components/organizations/onboarding-loading';

export default async function Onboarding() {
  return (
    <Suspense fallback={<OnboardingLoading />}>
      <OnboardingServer />
    </Suspense>
  );
}
