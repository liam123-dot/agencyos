# Knowledge Table

## Overview
The `knowledge` table stores individual knowledge items that can be of three types: website, file, or text. These items can belong to knowledge bases and are associated with clients and organizations.

## Schema

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| `client_id` | UUID | Reference to the client | NULL allowed |
| `organization_id` | UUID | Reference to the organization | NOT NULL |
| `external_id` | TEXT | External identifier for integration purposes | NULL allowed |
| `knowledge_base_id` | UUID | Reference to the knowledge base | NULL allowed |
| `type` | TEXT | Type of knowledge item | NOT NULL, CHECK (website, file, text) |
| `title` | TEXT | Title/name of the knowledge item | NOT NULL |
| `status` | TEXT | Processing status of the knowledge item | NOT NULL, DEFAULT 'processing', CHECK (not-started, pending, processing, failed, succeeded) |
| `url` | TEXT | URL for website type | Required for website type |
| `scraped` | BOOLEAN | Whether website content has been scraped | DEFAULT FALSE |
| `scraped_content` | TEXT | Scraped content from website | NULL allowed |
| `favicon` | TEXT | Favicon URL for website | NULL allowed |
| `file_name` | TEXT | Original filename for file type | Required for file type |
| `file_size` | BIGINT | File size in bytes | Required for file type |
| `file_type` | TEXT | MIME type or file extension | Required for file type |
| `file_path` | TEXT | Storage path for the file | NULL allowed |
| `upload_status` | TEXT | Upload processing status | Required for file type, CHECK (pending, processing, completed, failed) |
| `content` | TEXT | Text content for text type | Required for text type |
| `word_count` | INTEGER | Number of words in text content | Required for text type |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation timestamp | DEFAULT NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update timestamp | DEFAULT NOW() |

## Type-Specific Constraints

### Website Type
- `url` must be provided
- Optional: `scraped`, `scraped_content`, `favicon`

### File Type  
- `file_name`, `file_size`, `file_type`, and `upload_status` must be provided
- Optional: `file_path`

### Text Type
- `content` and `word_count` must be provided

## Indexes
- `idx_knowledge_client_id` - Index on client_id for efficient client-based queries
- `idx_knowledge_organization_id` - Index on organization_id for efficient organization-based queries  
- `idx_knowledge_knowledge_base_id` - Index on knowledge_base_id for efficient knowledge base queries
- `idx_knowledge_external_id` - Index on external_id for integration lookups
- `idx_knowledge_type` - Index on type for type-based filtering
- `idx_knowledge_status` - Index on status for status-based filtering
- `idx_knowledge_created_at` - Index on created_at for efficient time-based queries

## Triggers
- `update_knowledge_updated_at` - Automatically updates the `updated_at` column on row updates

## Relationships
- Optionally belongs to a client (via `client_id`)
- Belongs to an organization (via `organization_id`)
- Optionally belongs to a knowledge base (via `knowledge_base_id`)

## RLS Policies
No RLS policies are currently implemented for this table.

## Usage
This table stores the actual knowledge items that can be websites, files, or text content. Each item has type-specific fields that are validated through database constraints. Items can be organized into knowledge bases or exist independently.

## TypeScript Interface Mapping
This table maps to the following TypeScript interfaces in `lib/types/knowledge.ts`:

### Full Entity Types (with IDs):
- `WebsiteKnowledge` - for type='website'
- `FileKnowledge` - for type='file'  
- `TextKnowledge` - for type='text'
- `Knowledge` - union type of all three

### DTO Types (without IDs, for creation/updates):
- `WebsiteKnowledgeDTO` - for creating/updating website knowledge
- `FileKnowledgeDTO` - for creating/updating file knowledge
- `TextKnowledgeDTO` - for creating/updating text knowledge
- `KnowledgeDTO` - union type of all DTO types

### Status Field
All knowledge items have a `status` field that tracks processing state:
- `not-started` - Item has not yet been processed
- `pending` - Item is queued for processing
- `processing` - Item is being processed (default)
- `failed` - Processing failed
- `succeeded` - Processing completed successfully
