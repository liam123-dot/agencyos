export interface Subscription {
    id: string;
    client_id: string;
    organization_id: string;
    stripe_subscription_id: string;
    stripe_customer_id: string;
    status: string;
    currency: string;
    
    // Base pricing info
    base_price_id: string | null;
    base_amount_cents: number;
    minutes_included: number;
    
    // Usage pricing info
    usage_price_id: string | null;
    per_second_price_cents: number;
    billing_meter_id: string | null;
    billing_meter_event_name: string | null;
    
    // Subscription periods
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    
    // Payment method info
    payment_method_brand: string | null;
    payment_method_last4: string | null;
    
    // Sync tracking
    synced_at: string;
    created_at: string;
    updated_at: string;
}
