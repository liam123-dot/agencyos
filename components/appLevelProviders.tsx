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
        staleTime: 1000 * 30, // 30 seconds
        refetchOnWindowFocus: true,
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
