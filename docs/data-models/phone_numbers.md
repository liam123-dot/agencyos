# Phone Numbers Table

## Overview
The `phone_numbers` table stores phone numbers imported from Twilio that can be assigned to agents for voice calls.

## Schema

```sql
CREATE TABLE public.phone_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    source TEXT,
    twilio_account_sid TEXT,
    twilio_auth_token TEXT,
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    platform_id TEXT,
    platform TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Fields

### Primary Key
- `id` (UUID): Unique identifier for the phone number record

### Required Fields
- `phone_number` (TEXT): The actual phone number in E.164 format
- `client_id` (UUID): Reference to the client that owns this phone number
- `organization_id` (UUID): Reference to the organization

### Optional Fields
- `source` (TEXT): Source of the phone number (e.g., "client", "twilio")
- `twilio_account_sid` (TEXT): Twilio account SID used for this number
- `twilio_auth_token` (TEXT): Twilio auth token for this number
- `agent_id` (UUID): Reference to the agent this phone number is assigned to (nullable)
- `platform_id` (TEXT): External platform identifier (e.g., VAPI phone number ID)
- `platform` (TEXT): Platform where the phone number is managed (e.g., "vapi")

### Timestamps
- `created_at` (TIMESTAMP): When the phone number was imported
- `updated_at` (TIMESTAMP): Last modification time

## Relationships

### Belongs To
- **Client**: Each phone number belongs to one client (`client_id`)
- **Organization**: Each phone number belongs to one organization (`organization_id`)
- **Agent** (optional): Phone number can be assigned to one agent (`agent_id`)

### Foreign Key Constraints
- `client_id` → `clients.id` (CASCADE DELETE)
- `organization_id` → `organizations.id` (CASCADE DELETE)  
- `agent_id` → `agents.id` (SET NULL on DELETE)

## Business Rules

1. **Assignment Logic**:
   - Phone numbers can be assigned to at most one agent
   - When an agent is deleted, phone numbers are unassigned (agent_id set to NULL)
   - When a client is deleted, all their phone numbers are deleted

2. **Import Process**:
   - Phone numbers are imported from Twilio using client credentials
   - Each import stores the Twilio account SID and auth token used
   - Source field tracks where the number came from
   - Phone numbers are automatically created in VAPI platform during import
   - Platform ID and platform type are stored for external platform management

3. **Platform Integration**:
   - Phone numbers are synchronized with external platforms (currently VAPI)
   - Platform ID tracks the external platform's identifier for the phone number
   - Platform field indicates which external platform manages the number
   - When removing phone numbers, they are deleted from both database and external platform

4. **Multi-tenancy**:
   - Phone numbers are scoped to both client and organization
   - Users can only access phone numbers for clients they have permission to view

## Usage Patterns

### Importing Phone Numbers
```typescript
// Import a phone number from Twilio
const result = await importPhoneNumber(
    phoneNumber,
    clientId,
    twilioAccountSid,
    twilioAuthToken
);
```

### Assigning to Agent
```typescript
// Assign phone number to an agent
const result = await assignPhoneNumberToAgent(phoneNumberId, agentId);
```

### Querying Available Numbers
```typescript
// Get unassigned phone numbers for a client
const { data } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('client_id', clientId)
    .is('agent_id', null);
```

### Querying Agent's Numbers
```typescript
// Get phone numbers assigned to an agent
const { data } = await supabase
    .from('phone_numbers')
    .select('*')
    .eq('agent_id', agentId);
```

## Security

### Row Level Security (RLS)
- Users can only access phone numbers for organizations they belong to
- Client-level permissions are enforced through the client authorization system

### API Access
- All phone number operations go through server actions with proper authorization
- Twilio credentials are stored securely and not exposed to client-side code

## Related Tables
- [`clients.md`](./clients.md) - Client information and Twilio credentials
- [`agents.md`](./agents.md) - Agent information and platform details
- [`organizations.md`](./organizations.md) - Organization structure
