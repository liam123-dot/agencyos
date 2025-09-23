'use client';

import * as React from 'react';
import { MoreHorizontal, Users, Settings, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OrganizationCardProps } from '@/lib/types/organizations';
import { getRoleDisplayName, getRoleColor, getRoleIcon } from '@/lib/utils/organizations';

export function OrganizationCard({
  organization,
  onSelect,
  showActions = true,
  className,
}: OrganizationCardProps) {
  const handleSelect = () => {
    onSelect?.(organization);
  };

  const handleViewOrganization = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to organization page
    window.location.href = `/org/${organization.slug}`;
  };

  const handleManageSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Navigate to organization settings
    window.location.href = `/org/${organization.slug}/settings`;
  };

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        onSelect && "hover:bg-accent/50",
        className
      )}
      onClick={onSelect ? handleSelect : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <CardTitle className="text-lg truncate">{organization.name}</CardTitle>
            {organization.description && (
              <CardDescription className="line-clamp-2">
                {organization.description}
              </CardDescription>
            )}
          </div>
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleViewOrganization}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Organization
                </DropdownMenuItem>
                {(organization.is_owner || organization.is_admin) && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleManageSettings}>
                      <Settings className="mr-2 h-4 w-4" />
                      Manage Settings
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{organization.member_count} member{organization.member_count !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">Created</span>
              <span>{new Date(organization.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs px-2 py-1",
                getRoleColor(organization.user_role)
              )}
            >
              <span className="mr-1">{getRoleIcon(organization.user_role)}</span>
              {getRoleDisplayName(organization.user_role)}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
