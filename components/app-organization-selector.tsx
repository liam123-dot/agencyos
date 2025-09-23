'use client';

import { OrganizationSelector } from "@/components/organizations";
import { useCurrentOrganization } from "@/lib/contexts/organization-context";
import { useState } from "react";
import { CreateOrganizationDialog } from "@/components/organizations";

export function AppOrganizationSelector() {
  const { currentOrganization } = useCurrentOrganization();
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const handleChange = (orgId: string) => {
    if (orgId === '__create_new__') {
      setShowCreateDialog(true);
    }
    // The OrganizationSelector handles the actual switching
  };

  const handleCreateSuccess = () => {
    setShowCreateDialog(false);
    // Organization context will automatically update
  };

  return (
    <>
      <div className="min-w-[200px]">
        <OrganizationSelector
          value={currentOrganization?.id || ''}
          onChange={handleChange}
          placeholder="Select organization..."
          className="bg-background"
        />
      </div>
      
      <CreateOrganizationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleCreateSuccess}
        onCancel={() => setShowCreateDialog(false)}
      />
    </>
  );
}
