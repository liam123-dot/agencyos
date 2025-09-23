'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useOrganizationMembers } from '@/lib/hooks/use-organization-members';
import { OrganizationRole, OrganizationMember } from '@/lib/types/organizations';
import { 
  getRoleDisplayName, 
  getRoleColor, 
  canManageRole, 
  canPromoteToRole 
} from '@/lib/utils/organizations';
import { 
  MoreHorizontal, 
  UserMinus, 
  Crown, 
  Shield, 
  Users, 
  Loader2, 
  AlertCircle, 
  User 
} from 'lucide-react';

interface OrganizationMembersSectionProps {
  organizationId: string;
  canManage: boolean;
  currentUserRole: OrganizationRole | null;
}

export function OrganizationMembersSection({ 
  organizationId, 
  canManage, 
  currentUserRole 
}: OrganizationMembersSectionProps) {
  const { members, isLoading, error, updateMemberRole, removeMember } = useOrganizationMembers(organizationId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRoleChange = async (userId: string, newRole: OrganizationRole) => {
    if (!currentUserRole) return;
    
    setActionLoading(userId);
    setActionError(null);
    
    try {
      await updateMemberRole(userId, newRole);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    setActionLoading(userId);
    setActionError(null);
    
    try {
      await removeMember(userId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove member');
    } finally {
      setActionLoading(null);
    }
  };

  const getInitials = (name: string, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  const getRoleActions = (member: OrganizationMember) => {
    if (!currentUserRole || !canManage) return [];
    
    const actions = [];
    
    // Role changes
    if (member.role !== 'owner' && canPromoteToRole(currentUserRole, 'owner')) {
      actions.push({
        label: 'Make Owner',
        icon: Crown,
        action: () => handleRoleChange(member.id, 'owner'),
        variant: 'default' as const,
      });
    }
    
    if (member.role !== 'admin' && canPromoteToRole(currentUserRole, 'admin')) {
      actions.push({
        label: member.role === 'owner' ? 'Demote to Admin' : 'Make Admin',
        icon: Shield,
        action: () => handleRoleChange(member.id, 'admin'),
        variant: 'default' as const,
      });
    }
    
    if (member.role !== 'member' && canManageRole(currentUserRole, member.role)) {
      actions.push({
        label: 'Make Member',
        icon: User,
        action: () => handleRoleChange(member.id, 'member'),
        variant: 'default' as const,
      });
    }
    
    // Remove member
    if (canManageRole(currentUserRole, member.role) && member.role !== 'owner') {
      if (actions.length > 0) {
        actions.push({ separator: true });
      }
      actions.push({
        label: 'Remove Member',
        icon: UserMinus,
        action: () => handleRemoveMember(member.id),
        variant: 'destructive' as const,
      });
    }
    
    return actions;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {actionError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg border border-gray-200/80 overflow-hidden bg-white/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              {canManage && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const actions = getRoleActions(member);
              const isCurrentlyLoading = actionLoading === member.id;
              
              return (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(member.full_name || '', member.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.full_name || member.email.split('@')[0]}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {member.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={getRoleColor(member.role)}>
                      {getRoleDisplayName(member.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(member.joined_at).toLocaleDateString()}
                  </TableCell>
                  {canManage && (
                    <TableCell>
                      {actions.length > 0 ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              disabled={isCurrentlyLoading}
                            >
                              {isCurrentlyLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {actions.map((action, index) => {
                              if ('separator' in action) {
                                return <DropdownMenuSeparator key={index} />;
                              }
                              
                              const ActionIcon = action.icon;
                              
                              if (action.variant === 'destructive') {
                                return (
                                  <AlertDialog key={index}>
                                    <AlertDialogTrigger asChild>
                                      <DropdownMenuItem 
                                        className="text-destructive cursor-pointer"
                                        onSelect={(e) => e.preventDefault()}
                                      >
                                        <ActionIcon className="mr-2 h-4 w-4" />
                                        {action.label}
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remove Member</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to remove {member.full_name || member.email} from the organization? This action cannot be undone.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction 
                                          onClick={action.action}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Remove Member
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                );
                              }
                              
                              return (
                                <DropdownMenuItem 
                                  key={index}
                                  onClick={action.action}
                                  className="cursor-pointer"
                                >
                                  <ActionIcon className="mr-2 h-4 w-4" />
                                  {action.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 rounded-lg border border-dashed border-gray-300 bg-gray-50/30">
          <div className="max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
            <p className="text-gray-500 text-sm">
              This organization doesn't have any members yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
