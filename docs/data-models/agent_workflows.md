# Agent Workflows Table

The `agent_workflows` table stores orchestrations/squads that manage multiple agents in a workflow.

## Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier for the workflow |
| `client_id` | UUID | NOT NULL, REFERENCES clients(id) ON DELETE CASCADE | The client this workflow belongs to |
| `organization_id` | UUID | NOT NULL, REFERENCES organizations(id) ON DELETE CASCADE | The organization this workflow belongs to |
| `platform_id` | TEXT | NOT NULL | The ID of the workflow in the external platform (e.g., Vapi squad ID) |
| `platform` | TEXT | NOT NULL, DEFAULT 'vapi' | The platform where the workflow is hosted (e.g., 'vapi') |
| `name` | TEXT | NOT NULL | The name of the workflow |
| `data` | JSONB | | Additional workflow data from the platform (e.g., full squad object from Vapi) |
| `created_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW(), NOT NULL | When the workflow was created |
| `updated_at` | TIMESTAMP WITH TIME ZONE | DEFAULT NOW(), NOT NULL | When the workflow was last updated |

## Indexes

- `idx_agent_workflows_client_id` - Index on `client_id` for faster client-based queries
- `idx_agent_workflows_organization_id` - Index on `organization_id` for faster organization-based queries
- `idx_agent_workflows_platform_id` - Index on `platform_id` for faster platform ID lookups

## Triggers

- `update_agent_workflows_updated_at` - Automatically updates the `updated_at` timestamp on row updates using the `update_updated_at_column()` function

## Relationships

- **Belongs to Client**: Each workflow belongs to one client (cascading delete)
- **Belongs to Organization**: Each workflow belongs to one organization (cascading delete)

## Access Control

Currently, no Row Level Security (RLS) policies are applied to this table. Access control is handled at the application level through the `authorizedToAccessClient` function.

## Usage

Workflows (squads) are created through the Vapi API and stored in this table. Each workflow represents a multi-agent orchestration where agents can be connected in a flow with conditional transfers between them.

The workflow data includes:
- Which agents are part of the workflow
- The flow between agents (who transfers to whom and under what conditions)
- The phone number assigned to the workflow
- The starting agent in the flow

## Migration

Created in migration: `20251002110322_create_agent_workflows_table.sql`

