'use client';

import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

interface AppLevelProvidersProps {
  children: React.ReactNode;
}

export function AppLevelProviders({ children }: AppLevelProvidersProps) {
  // Create a client instance for each component tree
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // Data is fresh for 5 minutes
        gcTime: 1000 * 60 * 30, // Keep unused data in cache for 30 minutes
        refetchOnWindowFocus: true,
        refetchOnMount: 'always', // Always refetch on mount, but show cached data immediately
        refetchOnReconnect: true,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      {children}
    </QueryClientProvider>
  );
}
