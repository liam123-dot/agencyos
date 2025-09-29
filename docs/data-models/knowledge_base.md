# Knowledge Base Table

## Overview
The `knowledge_base` table stores knowledge base instances that belong to clients within organizations.

## Schema

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| `client_id` | UUID | Reference to the client | NOT NULL |
| `organization_id` | UUID | Reference to the organization | NOT NULL |
| `name` | TEXT | Name of the knowledge base | NOT NULL |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation timestamp | DEFAULT NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update timestamp | DEFAULT NOW() |

## Indexes
- `idx_knowledge_base_client_id` - Index on client_id for efficient client-based queries
- `idx_knowledge_base_organization_id` - Index on organization_id for efficient organization-based queries
- `idx_knowledge_base_created_at` - Index on created_at for efficient time-based queries

## Triggers
- `update_knowledge_base_updated_at` - Automatically updates the `updated_at` column on row updates

## Relationships
- Belongs to a client (via `client_id`)
- Belongs to an organization (via `organization_id`)

## RLS Policies
No RLS policies are currently implemented for this table.

## Usage
This table serves as the parent container for knowledge base items. Each knowledge base can contain multiple knowledge items (websites, files, text) that are managed separately.
