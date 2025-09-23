'use client';

import * as React from 'react';
import { PermissionGateProps } from '@/lib/types/organizations';
import { isEqualOrHigherRole } from '@/lib/utils/organizations';
import { useUserRole } from '@/lib/hooks/use-user-role';

export function PermissionGate({
  userRole,
  requiredRole,
  organizationId,
  children,
  fallback = null,
  mode = 'hide',
}: PermissionGateProps) {
  // If organizationId is provided but userRole is not, fetch the user's role
  const { role: fetchedRole, isLoading } = useUserRole(organizationId || '');
  const effectiveRole = userRole || fetchedRole;

  // Show loading state if we're fetching the role
  if (organizationId && !userRole && isLoading) {
    return mode === 'show-fallback' ? <>{fallback}</> : null;
  }

  // Check if user has required permissions
  const hasRequiredPermission = effectiveRole ? isEqualOrHigherRole(effectiveRole, requiredRole) : false;

  if (hasRequiredPermission) {
    return <>{children}</>;
  }

  // User doesn't have permission
  if (mode === 'show-fallback') {
    return <>{fallback}</>;
  }

  return null;
}

// Convenience components for common permission checks
export function OwnerOnly({ children, fallback, organizationId }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  organizationId?: string;
}) {
  return (
    <PermissionGate
      requiredRole="owner"
      organizationId={organizationId}
      fallback={fallback}
      mode="hide"
    >
      {children}
    </PermissionGate>
  );
}

export function AdminOnly({ children, fallback, organizationId }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  organizationId?: string;
}) {
  return (
    <PermissionGate
      requiredRole="admin"
      organizationId={organizationId}
      fallback={fallback}
      mode="hide"
    >
      {children}
    </PermissionGate>
  );
}

export function MemberOnly({ children, fallback, organizationId }: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  organizationId?: string;
}) {
  return (
    <PermissionGate
      requiredRole="member"
      organizationId={organizationId}
      fallback={fallback}
      mode="hide"
    >
      {children}
    </PermissionGate>
  );
}

// Higher-order component version
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole: 'owner' | 'admin' | 'member',
  fallback?: React.ReactNode
) {
  return function PermissionWrappedComponent(props: P & { organizationId?: string }) {
    const { organizationId, ...componentProps } = props;
    
    return (
      <PermissionGate
        requiredRole={requiredRole}
        organizationId={organizationId}
        fallback={fallback}
        mode="show-fallback"
      >
        <Component {...(componentProps as P)} />
      </PermissionGate>
    );
  };
}
