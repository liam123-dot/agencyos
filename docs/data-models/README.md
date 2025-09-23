# Data Models Overview

This directory contains documentation for all database tables and their relationships in the AgencyOS system.

## Database Schema Overview

The AgencyOS database consists of five main tables that work together to provide a complete multi-tenant organization system:

### Core Tables

1. **[users.md](./users.md)** - User profiles and authentication data
2. **[organizations.md](./organizations.md)** - Organization/company data
3. **[user_organizations.md](./user_organizations.md)** - Junction table linking users to organizations with roles
4. **[organization_invitations.md](./organization_invitations.md)** - Invitation system for adding users to organizations
5. **[products.md](./products.md)** - Product definitions with pricing and billing configurations

## Key Features

### Multi-Tenancy
- Users can belong to multiple organizations
- Each user has a selected organization that determines their current context
- Role-based access control within each organization

### User Types
- **Platform users**: Internal users who manage the platform
- **Client users**: External users who use the platform services

### Organization Roles
- **Owner**: Full control over the organization
- **Admin**: Can manage members and settings
- **Member**: Basic access to organization features

### Security
- Row Level Security (RLS) policies on all tables
- Secure functions for common operations
- Automatic user profile creation via database triggers

## Relationships

```
auth.users (Supabase Auth)
    ↓ (triggers)
public.users
    ↓ (many-to-many via user_organizations)
public.organizations
    ↓ (one-to-many)
public.organization_invitations
```

## Database Functions

The schema includes several PostgreSQL functions for common operations:

- `handle_new_user()` - Automatically creates user profile on signup
- `handle_user_update()` - Keeps user profile in sync with auth changes
- `create_organization_with_owner()` - Creates organization and assigns owner
- `accept_invitation()` - Processes invitation acceptance
- `decline_invitation()` - Processes invitation decline
- `get_user_organizations_simple()` - Retrieves user's organizations
- `get_selected_organization()` - Gets user's currently selected organization
- `expire_old_invitations()` - Cleans up expired invitations

## Views

- `organization_members_with_details` - Complete member information with user details
- `pending_invitations_by_organization` - Active invitations with organization context
