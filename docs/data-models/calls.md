# Calls Table

## Overview
The `calls` table stores records of all voice and web calls made through the platform, including detailed call data from the voice AI platform (Vapi), analytics, and cost information.

## Schema

```sql
CREATE TABLE public.calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id),
    client_id UUID NOT NULL REFERENCES public.clients(id),
    organization_id UUID NOT NULL REFERENCES public.organizations(id),
    seconds INTEGER NOT NULL DEFAULT 0,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Fields

### Primary Key
- `id` (UUID): Unique identifier for the call record

### Required Fields
- `agent_id` (UUID): Reference to the agent that handled the call
- `client_id` (UUID): Reference to the client who owns the agent
- `organization_id` (UUID): Reference to the organization
- `seconds` (INTEGER): Duration of the call in seconds (default: 0)

### Optional Fields
- `data` (JSONB): Comprehensive call data from Vapi including:
  - `call`: Call metadata (id, type, status, cost, timestamps)
  - `cost`: Total cost in dollars for the call
  - `costs`: Detailed cost breakdown by service (transcriber, model, voice, vapi, analysis)
  - `messages`: Array of conversation messages with role, content, and timing
  - `transcript`: Full conversation transcript
  - `recording`: Recording URLs (mono and stereo)
  - `analysis`: AI-generated summary and success evaluation
  - `endedReason`: Reason the call ended
  - `customer`: Customer information including phone number
  - `assistant`: Assistant configuration used for the call
  - `performanceMetrics`: Latency metrics for various components

### Timestamps
- `created_at` (TIMESTAMP): When the call record was created
- `updated_at` (TIMESTAMP): Last modification time

## Indexes

- `idx_calls_agent_id` - Index on agent_id for agent-specific queries
- `idx_calls_client_id` - Index on client_id for client-specific queries
- `idx_calls_organization_id` - Index on organization_id for organization-wide queries
- `idx_calls_created_at` - Index on created_at for time-based queries and sorting
- `idx_calls_seconds` - Index on seconds for duration-based filtering

## Relationships

### Belongs To
- **Agent**: Each call is associated with one agent (`agent_id`)
- **Client**: Each call belongs to one client (`client_id`)
- **Organization**: Each call is within one organization (`organization_id`)

### Foreign Key Constraints
- `agent_id` → `agents.id` (REFERENCES)
- `client_id` → `clients.id` (REFERENCES)
- `organization_id` → `organizations.id` (REFERENCES)

## Data Field Structure

The `data` JSONB field contains comprehensive call information from Vapi:

### Call Metadata
```typescript
{
  call: {
    id: string;           // Vapi call ID
    type: string;         // 'webCall', 'inboundPhoneCall', 'outboundPhoneCall'
    status: string;       // Call status
    cost: number;         // Total cost in dollars
    createdAt: string;    // ISO timestamp
    updatedAt: string;    // ISO timestamp
  }
}
```

### Cost Breakdown
```typescript
{
  cost: number;          // Total cost in dollars
  costs: [
    {
      type: string;      // 'transcriber', 'model', 'voice', 'vapi', 'analysis'
      cost: number;      // Cost for this service
      minutes?: number;  // Minutes used (for time-based services)
      // Additional service-specific fields
    }
  ]
}
```

### Transcript and Messages
```typescript
{
  transcript: string;    // Plain text transcript
  messages: [
    {
      role: string;      // 'bot', 'user', 'system', 'tool_calls', etc.
      message: string;   // Message content
      time: number;      // Timestamp
      duration?: number; // Duration in ms (for bot messages)
    }
  ]
}
```

### Analysis
```typescript
{
  analysis: {
    summary: string;              // AI-generated call summary
    successEvaluation: string;    // 'true' or 'false'
  }
}
```

### Recording URLs
```typescript
{
  recording: {
    mono: {
      combinedUrl: string;   // Combined audio URL
      customerUrl: string;   // Customer audio URL
      assistantUrl: string;  // Assistant audio URL
    },
    stereoUrl: string;       // Stereo recording URL
  }
}
```

## Usage Examples

### Fetching Calls with Cost Information
```typescript
const { data: calls } = await supabase
  .from('calls')
  .select(`
    *,
    agents(id, data),
    clients(id, name, email)
  `)
  .eq('organization_id', organizationId)
  .order('created_at', { ascending: false });

// Access cost information
calls.forEach(call => {
  const cost = call.data?.cost || 0;
  const transcript = call.data?.transcript;
  const summary = call.data?.analysis?.summary;
});
```

### Calculating Revenue and Margin
```typescript
// With subscription data
const revenue = (subscription.per_second_price_cents * call.seconds) / 100;
const cost = call.data?.cost || 0;
const margin = revenue - cost;
```

### Filtering by Call Type
```typescript
const { data: webCalls } = await supabase
  .from('calls')
  .select('*')
  .eq('client_id', clientId)
  .filter('data->call->>type', 'eq', 'webCall');
```

### Searching Transcripts
```typescript
const { data: searchResults } = await supabase
  .from('calls')
  .select('*')
  .eq('organization_id', organizationId)
  .ilike('data->>transcript', `%${searchTerm}%`);
```

## Analytics Queries

### Total Cost per Client
```typescript
const { data: clients } = await supabase
  .from('calls')
  .select('client_id, data')
  .eq('organization_id', organizationId);

// Calculate totals in application code
const totals = clients.reduce((acc, call) => {
  const clientId = call.client_id;
  const cost = call.data?.cost || 0;
  acc[clientId] = (acc[clientId] || 0) + cost;
  return acc;
}, {});
```

### Calls by Time Period
```typescript
const startDate = new Date('2025-09-01');
const endDate = new Date('2025-09-30');

const { data: calls } = await supabase
  .from('calls')
  .select('*')
  .eq('organization_id', organizationId)
  .gte('created_at', startDate.toISOString())
  .lte('created_at', endDate.toISOString());
```

## Security Considerations

- Ensure proper RLS policies are in place to restrict access to calls by organization
- The `data` field may contain sensitive customer information (phone numbers, transcripts)
- Recording URLs are publicly accessible via signed URLs - handle with care
- Cost information should only be visible to organization owners/admins

## Integration Notes

- Call records are automatically created when Vapi sends end-of-call-report webhooks
- The `data` field preserves the complete Vapi payload for future reference
- Cost tracking includes all Vapi services: transcription, LLM, voice synthesis, and platform fees
- Performance metrics in the `data` field can be used for latency analysis and optimization

## Best Practices

1. **Always include seconds**: Ensure the `seconds` field is populated for accurate billing
2. **Preserve full data**: Keep the complete Vapi payload in the `data` field
3. **Index optimization**: Use the provided indexes for efficient queries
4. **Cost analysis**: Regularly analyze cost breakdowns to optimize AI service usage
5. **Data retention**: Implement retention policies for old call records and recordings

