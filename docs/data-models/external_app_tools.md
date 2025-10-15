# External App Tools Table

## Overview
The `external_app_tools` table stores external application tools that are connected to agents via Pipedream integrations. These tools enable AI agents to interact with external services like Gmail, Slack, etc., using MCP (Model Context Protocol).

## Schema

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | UUID | Primary key | NOT NULL, DEFAULT gen_random_uuid() |
| `name` | TEXT | Name of the tool | NOT NULL |
| `description` | TEXT | Description of what the tool does | NULL |
| `function_schema` | JSONB | The function schema that the AI agent sees (includes parameters, required fields, etc.) | NOT NULL |
| `static_config` | JSONB | Pre-configured values hidden from the AI (e.g., email recipients, API keys) | NULL |
| `props_config` | JSONB | Complete field configuration including modes (AI/fixed), values, and settings | NULL |
| `app` | TEXT | Pipedream app identifier (e.g., "gmail", "slack") | NULL |
| `app_name` | TEXT | Human-readable app name (e.g., "Gmail", "Slack") | NULL |
| `app_img_src` | TEXT | URL to the app's logo/image | NULL |
| `account_id` | TEXT | Pipedream account ID for the connected service | NULL |
| `action_key` | TEXT | Pipedream action key identifier (e.g., "gmail-send-email") | NULL |
| `action_name` | TEXT | Human-readable action name (e.g., "Send Email") | NULL |
| `external_id` | TEXT | The Vapi MCP tool ID | NOT NULL |
| `agent_id` | UUID | Reference to the agent | NOT NULL |
| `client_id` | UUID | Reference to the client | NULL |
| `organization_id` | UUID | Reference to the organization | NOT NULL |
| `created_at` | TIMESTAMP WITH TIME ZONE | Creation timestamp | DEFAULT NOW() |
| `updated_at` | TIMESTAMP WITH TIME ZONE | Last update timestamp | DEFAULT NOW() |

## Indexes
- `idx_external_app_tools_agent_id` - Index on agent_id for efficient agent-based queries
- `idx_external_app_tools_client_id` - Index on client_id for efficient client-based queries
- `idx_external_app_tools_organization_id` - Index on organization_id for efficient organization-based queries
- `idx_external_app_tools_external_id` - Index on external_id for efficient Vapi tool ID lookups
- `idx_external_app_tools_created_at` - Index on created_at for efficient time-based queries

## Constraints
- `unique_tool_name_per_client_agent` - Unique constraint on (name, client_id, agent_id) to prevent duplicate tool names within the same client and agent combination

## Triggers
- `update_external_app_tools_updated_at` - Automatically updates the `updated_at` column on row updates

## Relationships
- Belongs to an agent (via `agent_id`)
- Optionally belongs to a client (via `client_id`)
- Belongs to an organization (via `organization_id`)

## RLS Policies
No RLS policies are currently implemented for this table.

## Usage

### Function Schema
The `function_schema` JSONB field contains the OpenAPI-style function definition that the AI agent sees. Example:
```json
{
  "name": "send_email",
  "description": "when they have a question the ai can't answer and they couldn't be transferred",
  "parameters": {
    "type": "object",
    "properties": {
      "cc": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "extract the users email and include them here"
      },
      "body": {
        "type": "string",
        "description": "summarise the conversation and add the question in afterwards"
      }
    },
    "required": ["body"]
  }
}
```

### Static Config
The `static_config` JSONB field contains pre-configured values that are hidden from the AI. Example:
```json
{
  "to": ["liambuchanan@clearskyai.co"],
  "subject": "best question"
}
```

### Pipedream Metadata
The Pipedream metadata fields (`app`, `app_name`, `app_img_src`, `account_id`, `action_key`, `action_name`) store information about the external service integration:
- `app`: "gmail"
- `app_name`: "Gmail"
- `app_img_src`: "https://pipedream.com/s.v0/app_13hLBq/logo/orig"
- `account_id`: "apn_V1hVnLg"
- `action_key`: "gmail-send-email"
- `action_name`: "Send Email"

### MCP Integration
Each external app tool is associated with a Vapi MCP tool via the `external_id` field. The MCP tool acts as a proxy that routes function calls from the AI agent to the appropriate Pipedream endpoint (`/api/agent/[agentId]/mcp`), which then executes the external app action.
