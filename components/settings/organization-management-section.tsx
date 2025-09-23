'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { OrganizationWithDetails, OrganizationMember } from '@/lib/types/organizations';
import { useUpdateOrganization, useDeleteOrganization } from '@/lib/hooks/use-organizations';
import { useOrganizationMembers, useManageMembers } from '@/lib/hooks/use-organization-members';
import { 
  Save, 
  Trash2, 
  Crown, 
  AlertTriangle, 
  Loader2, 
  AlertCircle, 
  CheckCircle 
} from 'lucide-react';

interface OrganizationManagementSectionProps {
  organization: OrganizationWithDetails;
  isOwner: boolean;
}

export function OrganizationManagementSection({ 
  organization, 
  isOwner 
}: OrganizationManagementSectionProps) {
  const router = useRouter();
  const { updateOrganization, isLoading: updateLoading, error: updateError } = useUpdateOrganization(organization.id);
  const { deleteOrganization, isLoading: deleteLoading, error: deleteError } = useDeleteOrganization();
  const { members } = useOrganizationMembers(organization.id);
  const { transferOwnership, isLoading: transferLoading, error: transferError } = useManageMembers(organization.id);

  const [orgForm, setOrgForm] = useState({
    name: organization.name,
    description: organization.description || '',
  });
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter members who can become owners (admins and members, but not current owner)
  const eligibleNewOwners = members.filter(member => 
    member.role !== 'owner' && member.id !== organization.id
  );

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    try {
      await updateOrganization({
        name: orgForm.name,
        description: orgForm.description || undefined,
      });
      setSuccess('Organization updated successfully!');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleTransferOwnership = async () => {
    if (!selectedNewOwner) return;

    try {
      await transferOwnership(selectedNewOwner);
      setSuccess('Ownership transferred successfully!');
      setIsTransferDialogOpen(false);
      setSelectedNewOwner('');
      // Redirect after a short delay
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDeleteOrganization = async () => {
    if (deleteConfirmation !== organization.name) return;

    try {
      await deleteOrganization(organization.id);
      // Redirect to app after successful deletion
      router.push('/app');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (!isOwner) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
        <p className="text-muted-foreground">
          Only organization owners can access management settings.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(updateError || deleteError || transferError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{updateError || deleteError || transferError}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Basic Information */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-gray-100">
          <h4 className="font-medium text-gray-900">Basic Information</h4>
          <p className="text-sm text-gray-500">
            Update name and description.
          </p>
        </div>

        <form onSubmit={handleUpdateOrganization} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input
                id="org-name"
                type="text"
                value={orgForm.name}
                onChange={(e) => setOrgForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter organization name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="org-description">Description (Optional)</Label>
              <Input
                id="org-description"
                type="text"
                value={orgForm.description}
                onChange={(e) => setOrgForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter organization description"
              />
            </div>
          </div>

          <Button type="submit" disabled={updateLoading}>
            {updateLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </form>
      </div>

      <Separator />

      {/* Transfer Ownership */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-gray-100">
          <h4 className="font-medium text-gray-900">Transfer Ownership</h4>
          <p className="text-sm text-gray-500">
            Transfer ownership of this organization to another member.
          </p>
        </div>

        {eligibleNewOwners.length > 0 ? (
          <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Crown className="mr-2 h-4 w-4" />
                Transfer Ownership
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transfer Ownership</DialogTitle>
                <DialogDescription>
                  Select a member to transfer ownership to. This action cannot be undone and you will lose owner privileges.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select New Owner</Label>
                  <Select value={selectedNewOwner} onValueChange={setSelectedNewOwner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a member..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleNewOwners.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Warning: This action cannot be undone. You will lose owner privileges and the selected member will become the new owner.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsTransferDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferOwnership}
                  disabled={!selectedNewOwner || transferLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {transferLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Transfer Ownership
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No eligible members found. You need at least one other member to transfer ownership.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Separator />

      {/* Delete Organization */}
      <div className="space-y-4">
        <div className="pb-3 border-b border-red-100">
          <h4 className="font-medium text-red-700">Danger Zone</h4>
          <p className="text-sm text-red-600">
            Irreversible actions that will permanently affect your organization.
          </p>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Organization
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the organization and remove all members and data.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This action is irreversible. All data will be permanently lost.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="delete-confirmation">
                  Type "{organization.name}" to confirm:
                </Label>
                <Input
                  id="delete-confirmation"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={organization.name}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteOrganization}
                disabled={deleteConfirmation !== organization.name || deleteLoading}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Organization
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
