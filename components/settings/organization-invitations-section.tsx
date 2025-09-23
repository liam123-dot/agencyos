'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { usePendingInvitations, useInviteMembers } from '@/lib/hooks/use-invitations';
import { OrganizationRole, InviteMemberRequest } from '@/lib/types/organizations';
import { getRoleDisplayName, getRoleColor, parseEmailList, validateEmails } from '@/lib/utils/organizations';
import { 
  Plus, 
  Mail, 
  Trash2, 
  RefreshCw, 
  Clock, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  Users
} from 'lucide-react';

interface OrganizationInvitationsSectionProps {
  organizationId: string;
  canInvite: boolean;
  canManage: boolean;
}

export function OrganizationInvitationsSection({ 
  organizationId, 
  canInvite, 
  canManage 
}: OrganizationInvitationsSectionProps) {
  const { invitations, isLoading, error, cancelInvitation, resendInvitation } = usePendingInvitations(organizationId);
  const { inviteMembers, isLoading: inviteLoading, error: inviteError } = useInviteMembers(organizationId);
  
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    emails: '',
    role: 'member' as OrganizationRole,
  });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setInviteSuccess(null);

    const emailList = parseEmailList(inviteForm.emails);
    const { valid, invalid } = validateEmails(emailList);

    if (invalid.length > 0) {
      setActionError(`Invalid email addresses: ${invalid.join(', ')}`);
      return;
    }

    if (valid.length === 0) {
      setActionError('Please enter at least one valid email address.');
      return;
    }

    try {
      const invitationRequests: InviteMemberRequest[] = valid.map(email => ({
        email,
        role: inviteForm.role,
      }));

      await inviteMembers({ invitations: invitationRequests });
      
      setInviteSuccess(`Successfully sent ${valid.length} invitation${valid.length > 1 ? 's' : ''}.`);
      setInviteForm({ emails: '', role: 'member' });
      setIsInviteDialogOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to send invitations');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    setActionError(null);
    
    try {
      await cancelInvitation(invitationId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendInvitation = async (invitationId: string) => {
    setActionLoading(invitationId);
    setActionError(null);
    
    try {
      await resendInvitation(invitationId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to resend invitation');
    } finally {
      setActionLoading(null);
    }
  };

  const getExpiryStatus = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'expired', text: 'Expired', variant: 'destructive' as const };
    if (diffDays === 0) return { status: 'today', text: 'Expires today', variant: 'destructive' as const };
    if (diffDays <= 2) return { status: 'soon', text: `${diffDays} days left`, variant: 'secondary' as const };
    return { status: 'valid', text: `${diffDays} days left`, variant: 'outline' as const };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading invitations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {(error || actionError || inviteError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || actionError || inviteError}</AlertDescription>
        </Alert>
      )}

      {inviteSuccess && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{inviteSuccess}</AlertDescription>
        </Alert>
      )}

      {canInvite && (
        <div className="flex justify-end items-center">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite New Members</DialogTitle>
                <DialogDescription>
                  Enter email addresses and select a role for the new members.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="emails">Email Addresses</Label>
                  <Textarea
                    id="emails"
                    placeholder="Enter email addresses separated by commas, semicolons, or new lines..."
                    value={inviteForm.emails}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, emails: e.target.value }))}
                    className="min-h-[100px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    You can enter multiple email addresses separated by commas, semicolons, or new lines.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select 
                    value={inviteForm.role} 
                    onValueChange={(value: OrganizationRole) => 
                      setInviteForm(prev => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsInviteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={inviteLoading}>
                    {inviteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Invitations
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Separator />

      {invitations.length > 0 ? (
        <div className="rounded-lg border border-gray-200/80 overflow-hidden bg-white/50">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent</TableHead>
                {canManage && <TableHead className="w-[150px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {invitations.map((invitation) => {
                const expiryStatus = getExpiryStatus(invitation.expires_at);
                const isCurrentlyLoading = actionLoading === invitation.id;
                
                return (
                  <TableRow key={invitation.id}>
                    <TableCell className="font-medium">
                      {invitation.invited_email}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getRoleColor(invitation.role)}>
                        {getRoleDisplayName(invitation.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={expiryStatus.variant}>
                          {expiryStatus.text}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(invitation.created_at).toLocaleDateString()}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResendInvitation(invitation.id)}
                            disabled={isCurrentlyLoading}
                          >
                            {isCurrentlyLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isCurrentlyLoading}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Cancel Invitation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to cancel the invitation for {invitation.invited_email}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Cancel Invitation
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 rounded-lg border border-dashed border-gray-300 bg-gray-50/30">
          <div className="max-w-sm mx-auto">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Mail className="h-6 w-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending invitations</h3>
            <p className="text-gray-500 mb-6 text-sm">
              Invite new members to join your organization and collaborate.
            </p>
            {canInvite && (
              <Button onClick={() => setIsInviteDialogOpen(true)} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
