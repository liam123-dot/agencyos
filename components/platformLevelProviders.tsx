'use client'

import { OrganizationProvider } from "@/lib/contexts/organization-context"

// the providers that are used on the platform level (from /app routes)

interface PlatformLevelProvidersProps {
  children: React.ReactNode
}

export function PlatformLevelProviders({ children }: PlatformLevelProvidersProps) {
  return (
    <OrganizationProvider>
      {children}
    </OrganizationProvider>
  )
}

