# Organization System Documentation

This document provides comprehensive documentation for the organization system implemented in this Next.js TypeScript fullstack application.

## Overview

The organization system provides a complete multi-tenant solution where users can:
- Create and manage organizations
- Invite and manage team members with different roles
- Switch between multiple organizations
- Handle organization-based permissions and access control

## Architecture

### Database Schema

The system uses three main tables:
- `organizations` - Core organization data
- `user_organizations` - Junction table for user memberships with roles
- `organization_invitations` - Pending invitations to join organizations

### Role Hierarchy

1. **Owner** - Full control, can delete organization, transfer ownership
2. **Admin** - Can manage members, settings, and invitations
3. **Member** - Basic access to organization resources

## Quick Start

### 1. Apply the Migration

```bash
npx supabase migration up
```

### 2. Wrap Your App with Providers

```tsx
// app/layout.tsx
import { Providers } from "@/components/providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### 3. Use Onboarding Guard

```tsx
// app/dashboard/page.tsx
import { OnboardingGuard } from "@/components/organizations";

export default function Dashboard() {
  return (
    <OnboardingGuard>
      <YourDashboardContent />
    </OnboardingGuard>
  );
}
```

## Core Components

### OrganizationSelector

A dropdown for switching between organizations:

```tsx
import { OrganizationSelector } from "@/components/organizations";

function Header() {
  const handleChange = (orgId: string) => {
    if (orgId === '__create_new__') {
      // Handle create new organization
    }
  };

  return (
    <OrganizationSelector
      value={currentOrgId}
      onChange={handleChange}
      placeholder="Select organization..."
    />
  );
}
```

### CreateOrganizationForm

Form for creating new organizations:

```tsx
import { CreateOrganizationDialog } from "@/components/organizations";

function CreateOrgButton() {
  const [open, setOpen] = useState(false);

  return (
    <CreateOrganizationDialog
      trigger={<Button>Create Organization</Button>}
      open={open}
      onOpenChange={setOpen}
      onSuccess={(org) => {
        console.log('Created:', org);
        setOpen(false);
      }}
    />
  );
}
```

### PermissionGate

Control access based on user roles:

```tsx
import { PermissionGate, AdminOnly } from "@/components/organizations";

function ManagementPanel() {
  return (
    <div>
      <h1>Organization Dashboard</h1>
      
      <PermissionGate requiredRole="admin">
        <AdminSettings />
      </PermissionGate>
      
      <AdminOnly>
        <InviteMembers />
      </AdminOnly>
    </div>
  );
}
```

### OnboardingGuard

Ensures users have an organization before accessing protected content:

```tsx
import { OnboardingGuard } from "@/components/organizations";

function ProtectedPage() {
  return (
    <OnboardingGuard redirectTo="/onboarding">
      <YourProtectedContent />
    </OnboardingGuard>
  );
}
```

## Hooks

### Organization Management

```tsx
import { 
  useOrganizations, 
  useCreateOrganization,
  useCurrentOrganization 
} from "@/components/organizations";

function OrganizationList() {
  const { organizations, isLoading, error } = useOrganizations();
  const { createOrganization } = useCreateOrganization();
  const { currentOrganization, userRole } = useCurrentOrganization();

  const handleCreate = async () => {
    try {
      const newOrg = await createOrganization({
        name: "My New Org",
        slug: "my-new-org",
        description: "A great organization"
      });
      console.log('Created:', newOrg);
    } catch (error) {
      console.error('Failed to create:', error);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Current: {currentOrganization?.name} ({userRole})</h2>
      <ul>
        {organizations.map(org => (
          <li key={org.id}>{org.name} - {org.user_role}</li>
        ))}
      </ul>
      <button onClick={handleCreate}>Create New</button>
    </div>
  );
}
```

### Member Management

```tsx
import { useOrganizationMembers, useManageMembers } from "@/components/organizations";

function MembersList({ organizationId }: { organizationId: string }) {
  const { members, isLoading, error } = useOrganizationMembers(organizationId);
  const { updateMemberRole, removeMember } = useManageMembers(organizationId);

  const handlePromote = async (userId: string) => {
    try {
      await updateMemberRole(userId, 'admin');
    } catch (error) {
      console.error('Failed to promote:', error);
    }
  };

  const handleRemove = async (userId: string) => {
    try {
      await removeMember(userId);
    } catch (error) {
      console.error('Failed to remove:', error);
    }
  };

  if (isLoading) return <div>Loading members...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {members.map(member => (
        <li key={member.id}>
          {member.full_name || member.email} - {member.role}
          <button onClick={() => handlePromote(member.id)}>
            Promote to Admin
          </button>
          <button onClick={() => handleRemove(member.id)}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
```

### Invitations

```tsx
import { 
  useInviteMembers, 
  usePendingInvitations,
  useInvitationDetails 
} from "@/components/organizations";

function InvitationManager({ organizationId }: { organizationId: string }) {
  const { inviteMembers, isLoading: inviting } = useInviteMembers(organizationId);
  const { invitations, cancelInvitation } = usePendingInvitations(organizationId);

  const handleInvite = async () => {
    try {
      await inviteMembers({
        invitations: [
          { email: "user@example.com", role: "member" },
          { email: "admin@example.com", role: "admin" }
        ]
      });
    } catch (error) {
      console.error('Failed to invite:', error);
    }
  };

  return (
    <div>
      <button onClick={handleInvite} disabled={inviting}>
        Send Invitations
      </button>
      
      <h3>Pending Invitations</h3>
      {invitations.map(invitation => (
        <div key={invitation.id}>
          {invitation.invited_email} - {invitation.role}
          <button onClick={() => cancelInvitation(invitation.id)}>
            Cancel
          </button>
        </div>
      ))}
    </div>
  );
}
```

### User Role Checking

```tsx
import { useUserRole } from "@/components/organizations";

function RoleBasedContent({ organizationId }: { organizationId: string }) {
  const { 
    role, 
    isOwner, 
    isAdmin, 
    canManageMembers, 
    canInvite 
  } = useUserRole(organizationId);

  return (
    <div>
      <p>Your role: {role}</p>
      {isOwner && <p>You own this organization</p>}
      {isAdmin && <p>You can manage this organization</p>}
      {canManageMembers && <button>Manage Members</button>}
      {canInvite && <button>Invite Members</button>}
    </div>
  );
}
```

## API Routes

All API routes are automatically available:

### Organizations
- `GET /api/organizations` - Get user's organizations
- `POST /api/organizations` - Create new organization
- `PUT /api/organizations/[id]` - Update organization
- `DELETE /api/organizations/[id]` - Delete organization
- `POST /api/organizations/[id]/leave` - Leave organization

### Members
- `GET /api/organizations/[id]/members` - Get organization members
- `POST /api/organizations/[id]/members/[userId]/role` - Update member role
- `DELETE /api/organizations/[id]/members/[userId]` - Remove member

### Invitations
- `GET /api/organizations/[id]/invitations` - Get pending invitations
- `POST /api/organizations/[id]/invitations` - Send invitation(s)
- `GET /api/invitations/[token]` - Get invitation details
- `POST /api/invitations/[token]/accept` - Accept invitation
- `POST /api/invitations/[token]/decline` - Decline invitation

### User Settings
- `GET /api/user/selected-organization` - Get selected organization
- `PUT /api/user/selected-organization` - Update selected organization

## Utility Functions

```tsx
import {
  hasPermission,
  canManageMembers,
  generateSlug,
  validateEmail,
  getRoleDisplayName,
  sortMembersByRole
} from "@/lib/utils/organizations";

// Permission checking
if (hasPermission(userRole, 'manage_members')) {
  // User can manage members
}

if (canManageMembers(userRole)) {
  // Same as above, more readable
}

// Slug generation
const slug = generateSlug("My Organization Name"); // "my-organization-name"

// Email validation
const isValid = validateEmail("user@example.com"); // true

// Role display
const displayName = getRoleDisplayName("admin"); // "Admin"

// Sorting members by role (owners first)
const sortedMembers = sortMembersByRole(members);
```

## Context Usage

```tsx
import { useOrganizationContext } from "@/components/organizations";

function MyComponent() {
  const {
    currentOrganization,
    userRole,
    organizations,
    switchOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    isLoading,
    error
  } = useOrganizationContext();

  // All organization operations are available here
}
```

## Error Handling

All hooks and API calls include proper error handling:

```tsx
function MyComponent() {
  const { organizations, error, isLoading } = useOrganizations();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <OrganizationList organizations={organizations} />;
}
```

## Security Features

- **Row Level Security (RLS)** - All database access is secured
- **Server-side permission checking** - API routes validate permissions
- **Role-based access control** - Components respect user roles
- **Secure invitation tokens** - UUID-based invitation system
- **Automatic token expiration** - Invitations expire after 7 days

## Customization

### Custom Permissions

Extend the permission system in `lib/utils/organizations.ts`:

```tsx
export const CUSTOM_PERMISSIONS = {
  view_analytics: {
    owner: true,
    admin: true,
    member: false,
  },
  // Add more permissions
};
```

### Custom Roles

Add new roles to the database enum and update the type definitions.

### Custom Components

All components accept className props and can be styled with Tailwind CSS:

```tsx
<OrganizationSelector 
  className="w-full max-w-sm"
  placeholder="Choose your workspace..."
/>
```

## Best Practices

1. **Always use OnboardingGuard** for protected pages
2. **Check permissions on both client and server** side
3. **Use PermissionGate** for conditional rendering
4. **Handle loading and error states** in your components
5. **Validate slugs and emails** before API calls
6. **Use the context** for global organization state
7. **Implement proper error boundaries** for better UX

## Troubleshooting

### Common Issues

1. **"Organization not found"** - User may not be a member
2. **"Insufficient permissions"** - Check user role requirements
3. **"Invitation expired"** - Invitations are valid for 7 days
4. **"Slug already taken"** - Organization slugs must be unique

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG_ORGANIZATIONS=true
```

## Migration Notes

The migration includes:
- All necessary tables and indexes
- Database functions for complex operations
- Row Level Security policies
- Triggers for automatic updates
- Views for efficient queries

Make sure to run `npx supabase migration up` to apply all changes.

## Support

For issues or questions:
1. Check the TypeScript types for available props
2. Review the API route implementations
3. Look at the example components in `/app/protected/`
4. Check the browser console for detailed error messages
