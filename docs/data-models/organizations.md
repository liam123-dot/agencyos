# Organizations Table

## Overview
The organizations table stores information about organizations within the platform. Organizations serve as the top-level entity that groups users, clients, products, and other resources together.

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the organization |
| name | TEXT | NOT NULL | Organization name |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier for the organization |
| description | TEXT | | Optional description of the organization |
| vapi_api_key | TEXT | | Vapi API key for server-side integrations |
| vapi_publishable_key | TEXT | | Vapi publishable key for client-side integrations |
| stripe_api_key | TEXT | | Stripe API key for payment processing |
| domain | TEXT | UNIQUE | Custom domain for the organization |
| created_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW(), NOT NULL | Record creation timestamp |
| updated_at | TIMESTAMP WITH TIME ZONE | DEFAULT NOW(), NOT NULL | Record last update timestamp |

## Indexes

- `idx_organizations_slug` - Index on slug column for fast lookups
- `idx_organizations_vapi_api_key` - Partial index on vapi_api_key (WHERE vapi_api_key IS NOT NULL)
- `idx_organizations_vapi_publishable_key` - Partial index on vapi_publishable_key (WHERE vapi_publishable_key IS NOT NULL)  
- `idx_organizations_stripe_api_key` - Partial index on stripe_api_key (WHERE stripe_api_key IS NOT NULL)

## Relationships

### One-to-Many
- **users** via `user_organizations` junction table (many-to-many through junction)
- **clients** via `organization_id` foreign key
- **products** via `organization_id` foreign key
- **agents** via `organization_id` foreign key
- **calls** via `organization_id` foreign key

### Referenced By
- `users.selected_organization_id` - Current selected organization for users
- `user_organizations.organization_id` - User-organization membership
- `organization_invitations.organization_id` - Pending invitations
- `clients.organization_id` - Client ownership
- `products.organization_id` - Product ownership
- `agents.organization_id` - Agent ownership
- `calls.organization_id` - Call tracking
- `subscriptions.organization_id` - Subscription management
- `phone_numbers.organization_id` - Phone number ownership
- `clients_products.organization_id` - Client-product assignments

## Triggers
- `update_organizations_updated_at` - Automatically updates the `updated_at` field on record modification

## API Integration Keys

### Vapi Integration
- **vapi_api_key**: Used for server-side API calls to Vapi services. This key has full permissions and should be kept secure.
- **vapi_publishable_key**: Used for client-side integrations with Vapi. This key is safe to expose in frontend applications and has limited permissions.

### Stripe Integration
- **stripe_api_key**: Used for payment processing and subscription management through Stripe.

## Security Notes
- API keys are stored as plain text but should be treated as sensitive data
- Access to API keys should be restricted to authorized users only
- Consider implementing encryption at rest for API keys in production environments
- The publishable key is designed to be used in client-side code and has appropriate limitations

