
export interface Product {
    id: string;
    name: string;
    description: string | null;
    minutes_included: number;
    price_per_minute_cents: number;
    currency: string;
    organization_id: string;
    stripe_product_id: string | null;
    stripe_billing_meter_id: string | null;
    stripe_base_price_id: string | null;
    billing_interval: string;
    stripe_usage_price_id: string | null;
    billing_meter_event_name: string | null;
    base_price_cents: number;
    trial_days: number;
    created_at: string;
    updated_at: string;
}

export interface CreateProductProperties {
    name: string;
    description: string | null;
    minutes_included: number;
    price_per_minute_cents: number;
    base_price_cents: number;
    currency: string;
    billing_period: 'day' | 'week' | 'month';
    trial_days: number;
}
