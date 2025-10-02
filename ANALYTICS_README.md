# Analytics Dashboard

## Overview
The Analytics Dashboard provides comprehensive financial insights into call performance across all clients in an organization. It displays cost, revenue, and profit margin data for each call, along with aggregate statistics.

## Features

### Summary Cards
- **Total Calls**: Count of all calls in the organization
- **Total Revenue**: Sum of all revenue from client subscriptions
- **Total Cost**: Sum of all Vapi costs
- **Total Margin**: Profit (Revenue - Cost) with margin percentage

### Call Details Table
Each call displays:
- **Agent**: Which AI agent handled the call
- **Client**: Client name and email
- **Duration**: Call length in minutes and seconds
- **Cost**: What Vapi charged us (in red)
- **Revenue**: What the client pays us (in green)
- **Margin**: Profit/loss for the call (color-coded)

### Expandable Call Details
Click on any call to see:
- **Summary**: AI-generated call summary
- **Transcript**: Full conversation with timestamps
- **Financial Details**: Breakdown of cost, revenue, and margin
- **Call Details**: Status, outcome, and timing information
- **Subscription Info**: Client's per-second pricing rate

## Technical Implementation

### Files Created/Modified

1. **`app/api/owner/getAnalytics.ts`**
   - Server action that fetches all calls for the organization
   - Joins calls with clients and subscriptions data
   - Calculates cost, revenue, and margin for each call
   - Provides aggregate totals and statistics

2. **`components/analytics/AnalyticsCallsComponent.tsx`**
   - Client-side component for displaying analytics data
   - Shows summary cards with key metrics
   - Renders expandable table of all calls
   - Formats currency and displays financial data with color coding

3. **`app/app/analytics/page.tsx`**
   - Analytics page route
   - Server component that fetches data and renders the analytics component

4. **`docs/data-models/calls.md`**
   - Comprehensive documentation for the calls table
   - Includes schema, field descriptions, and usage examples

## Data Flow

```
Analytics Page (Server Component)
  ↓
getAnalytics() Server Action
  ↓ Fetches
┌─────────────────────────────┐
│ Supabase Database           │
│ - calls table               │
│ - clients table             │
│ - subscriptions table       │
│ - agents table              │
└─────────────────────────────┘
  ↓ Processes
┌─────────────────────────────┐
│ Calculate for each call:    │
│ - cost (from data.cost)     │
│ - revenue (per_second * sec)│
│ - margin (revenue - cost)   │
└─────────────────────────────┘
  ↓ Returns
AnalyticsCallsComponent (Client Component)
  ↓ Displays
User Interface with Summary + Table
```

## Revenue Calculation

The revenue calculation is based on the client's subscription:

```typescript
// From subscriptions table
const per_second_price_cents = subscription.per_second_price_cents;

// Revenue calculation
const revenue = (per_second_price_cents * call.seconds) / 100;

// Cost from Vapi
const cost = call.data?.cost || 0;

// Margin
const margin = revenue - cost;
```

## Example: Understanding the Numbers

**Scenario:**
- Client has subscription: $0.01 per second ($0.60/minute)
- Call duration: 120 seconds (2 minutes)
- Vapi cost: $0.50

**Calculation:**
- Revenue: 0.01 × 120 = $1.20
- Cost: $0.50
- Margin: $1.20 - $0.50 = $0.70 profit
- Margin %: ($0.70 / $1.20) × 100 = 58.3%

## Important Notes

### Cost Data Source
- Costs come from `calls.data.cost` field
- This is the total Vapi charges us for the call
- Includes: transcription, LLM, voice synthesis, and platform fees

### Revenue Data Source
- Revenue is calculated from `subscriptions.per_second_price_cents`
- Only active subscriptions are included in the calculation
- Clients without active subscriptions show $0 revenue

### Margin Analysis
- **Green (positive)**: We're making a profit on the call
- **Red (negative)**: We're losing money on the call
- **Gray (zero)**: Break-even or no subscription data

## Usage

### Accessing the Dashboard
Navigate to `/app/analytics` when logged in as an organization owner/admin.

### Filtering and Analysis
Currently shows the 100 most recent calls. Future enhancements could include:
- Date range filtering
- Client-specific filtering
- Agent-specific filtering
- Pagination for large datasets
- Export to CSV
- Time-series graphs

## Data Model Dependencies

### Tables Used
1. **calls**: Main call records with duration and Vapi data
2. **subscriptions**: Client subscription pricing information
3. **clients**: Client identification and details
4. **agents**: Agent information for display

### Required Fields
- `calls.seconds`: Duration for revenue calculation
- `calls.data.cost`: Vapi cost
- `subscriptions.per_second_price_cents`: Client pricing rate
- `subscriptions.status`: Must be 'active'

## Future Enhancements

Potential improvements for the analytics dashboard:

1. **Time-based Analysis**
   - Daily/weekly/monthly trends
   - Comparative period analysis
   - Growth metrics

2. **Advanced Filtering**
   - Date range picker
   - Multi-select filters (clients, agents, call types)
   - Status filtering

3. **Visualizations**
   - Margin trend charts
   - Cost breakdown pie charts
   - Client revenue comparison

4. **Export Features**
   - CSV export
   - PDF reports
   - Scheduled email reports

5. **Performance Metrics**
   - Average call duration by agent
   - Success rate analysis
   - Customer satisfaction metrics

6. **Cost Optimization**
   - Identify high-cost calls
   - Recommendations for reducing costs
   - LLM model comparison

## Security Considerations

- Only organization owners/admins should access this page
- Implement proper authentication checks
- Consider adding RLS policies if not already present
- Financial data should be treated as sensitive
- Subscription pricing is confidential client information

## Maintenance

When updating the analytics:

1. **Schema Changes**: Update `docs/data-models/calls.md` if the calls table changes
2. **New Metrics**: Add calculations in `getAnalytics.ts` server action
3. **UI Changes**: Modify `AnalyticsCallsComponent.tsx` for display updates
4. **Performance**: Monitor query performance as data grows, add pagination if needed

