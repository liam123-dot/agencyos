'use client';

import { Toaster } from "sonner";

interface AppLevelProvidersProps {
  children: React.ReactNode;
}

export function AppLevelProviders({ children }: AppLevelProvidersProps) {
  return (
    <>
      <Toaster />
      {children}
    </>
  );
}
