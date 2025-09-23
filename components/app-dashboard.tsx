'use client';

import * as React from 'react';
import { Building2, Users, Mail, Settings, CalendarDays, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  useCurrentOrganization,
  PermissionGate 
} from '@/components/organizations';
import { getRoleDisplayName, getRoleColor, getRoleIcon } from '@/lib/utils/organizations';

export function OrganizationDashboard() {
  const { currentOrganization, userRole, isLoading } = useCurrentOrganization();

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="space-y-6">
          <div className="h-8 bg-muted animate-pulse rounded"></div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <div className="h-4 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-2/3"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-muted animate-pulse rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="container py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">No Organization Selected</h2>
          <p className="text-muted-foreground">
            You'll be redirected to set up or join an organization.
          </p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2);
  };

  return (
    <div className="container py-8">
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-xl">
              {getInitials(currentOrganization.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Welcome to {currentOrganization.name}</h1>
            <p className="text-muted-foreground">
              {currentOrganization.description || "Here's what's happening in your organization today."}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className={getRoleColor(userRole!)}
              >
                <span className="mr-1">{getRoleIcon(userRole!)}</span>
                {getRoleDisplayName(userRole!)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                /{currentOrganization.slug}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentOrganization.member_count}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Active team members
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Role</CardTitle>
              <Badge variant="outline" className="text-xs">
                {getRoleDisplayName(userRole!)}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getRoleIcon(userRole!)}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {userRole === 'owner' ? 'Full access to everything' :
                 userRole === 'admin' ? 'Can manage members and settings' :
                 'Standard member access'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Created</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(currentOrganization.created_at).toLocaleDateString('en-US', { 
                  month: 'short', 
                  year: 'numeric' 
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Organization founded
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Active</div>
              <p className="text-xs text-muted-foreground mt-2">
                Organization is running
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions and Organization Info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common tasks you can perform in this organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <PermissionGate userRole={userRole || undefined} requiredRole="admin">
                <Button className="w-full justify-start" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Members
                </Button>
              </PermissionGate>
              
              <PermissionGate userRole={userRole || undefined} requiredRole="admin">
                <Button className="w-full justify-start" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitations
                </Button>
              </PermissionGate>

              <PermissionGate userRole={userRole || undefined} requiredRole="admin">
                <Button className="w-full justify-start" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Organization Settings
                </Button>
              </PermissionGate>

              <Button className="w-full justify-start" variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                View Organization Details
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
              <CardDescription>
                Details about your current organization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Organization Name</label>
                <p className="text-sm text-muted-foreground">{currentOrganization.name}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">URL Slug</label>
                <p className="text-sm text-muted-foreground font-mono">/{currentOrganization.slug}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Member Count</label>
                <p className="text-sm text-muted-foreground">
                  {currentOrganization.member_count} member{currentOrganization.member_count !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {currentOrganization.can_manage_members && (
                    <Badge variant="secondary" className="text-xs">Can Manage Members</Badge>
                  )}
                  {currentOrganization.can_invite && (
                    <Badge variant="secondary" className="text-xs">Can Invite</Badge>
                  )}
                  {currentOrganization.is_owner && (
                    <Badge variant="secondary" className="text-xs">Full Access</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
