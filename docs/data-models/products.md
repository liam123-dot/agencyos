# Products Table

The `products` table stores product definitions with pricing and billing configurations for each organization.

## Table Structure

```sql
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    minutes_included INTEGER DEFAULT 0,
    price_per_minute_cents INTEGER DEFAULT 0,
    currency TEXT DEFAULT 'usd',
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    stripe_product_id TEXT,
    stripe_billing_meter_id TEXT,
    stripe_base_price_id TEXT,
    billing_interval TEXT DEFAULT 'month',
    stripe_usage_price_id TEXT,
    billing_meter_event_name TEXT,
    base_price_cents INTEGER DEFAULT 0,
    trial_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

## Column Descriptions

### Core Product Information
- **id**: Unique identifier for the product (UUID, auto-generated)
- **name**: Product name (required)
- **description**: Optional product description
- **organization_id**: Reference to the organization that owns this product
- **created_at**: Timestamp when the product was created
- **updated_at**: Timestamp when the product was last modified

### Pricing Configuration
- **base_price_cents**: Base subscription price in cents (e.g., 2999 for $29.99)
- **price_per_minute_cents**: Additional cost per minute in cents for usage beyond included minutes
- **currency**: Currency code (USD, EUR, GBP) - defaults to 'usd'
- **minutes_included**: Number of minutes included in the base price
- **billing_interval**: Billing period - supports 'day', 'week', or 'month' (defaults to 'month')
- **trial_days**: Number of days for trial period when subscribing to this product (defaults to 0)

### Stripe Integration Fields
- **stripe_product_id**: Stripe product ID for integration
- **stripe_base_price_id**: Stripe price ID for the base subscription
- **stripe_usage_price_id**: Stripe price ID for usage-based billing
- **stripe_billing_meter_id**: Stripe billing meter ID for tracking usage
- **billing_meter_event_name**: Event name used in Stripe billing meter (typically 'seconds_used')

## Relationships

- **organizations**: Many-to-one relationship with organizations table
- **clients_products**: One-to-many relationship with clients_products junction table

## Billing Model

Products support a hybrid billing model:

1. **Base Subscription**: Fixed recurring charge based on `billing_interval`
2. **Usage-Based Billing**: Additional charges for usage beyond `minutes_included`
3. **Flexible Billing Periods**: Daily, weekly, or monthly billing cycles

## Usage Examples

### Monthly Product with Usage Overage
```typescript
{
  name: "Professional Plan",
  base_price_cents: 4999, // $49.99/month
  minutes_included: 500,
  price_per_minute_cents: 10, // $0.10 per additional minute
  currency: "USD",
  billing_interval: "month",
  trial_days: 14 // 14-day free trial
}
```

### Daily Product
```typescript
{
  name: "Pay-per-Day Plan",
  base_price_cents: 299, // $2.99/day
  minutes_included: 30,
  price_per_minute_cents: 5, // $0.05 per additional minute
  currency: "USD",
  billing_interval: "day"
}
```

### Weekly Product
```typescript
{
  name: "Weekly Starter",
  base_price_cents: 1499, // $14.99/week
  minutes_included: 100,
  price_per_minute_cents: 8, // $0.08 per additional minute
  currency: "USD",
  billing_interval: "week"
}
```

## Security

- Row Level Security (RLS) policies ensure users can only access products from their organization
- All Stripe integration fields are managed server-side for security
- Product creation requires organization ownership or admin privileges

## Integration Notes

- Products are automatically synchronized with Stripe when created
- Billing meters are shared across products within an organization
- Usage tracking is handled through Stripe's billing meter system
- Currency changes require creating a new product (Stripe limitation)
