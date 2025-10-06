'use server'

import { Organization } from "@/lib/types/organizations"
import { getOrg } from "../user/selected-organization/getOrg"
import { CreateProductProperties, Product } from "./productType"
import { Stripe } from "stripe"

// Helper function to convert billing period to Stripe interval
function getStripeInterval(billingPeriod: 'day' | 'week' | 'month'): 'day' | 'week' | 'month' {
    return billingPeriod;
}

export async function createProduct(productProperties: CreateProductProperties) {

    const {organization, supabaseServerClient, userData} = await getOrg()
    if (!organization) {
        throw new Error('Organization not found')
    }
    if (!organization.stripe_api_key) {
        throw new Error('Stripe API key not found')
    }

    const stripe = new Stripe(organization.stripe_api_key!)

    if (!organization) {
        throw new Error('Organization not found')
    }

    const {
        price_per_minute_cents,
        base_price_cents,
        currency,
        name,
        description,
        minutes_included,
        billing_period,
        trial_days
    } = productProperties

    console.log(productProperties)

    const billingMeter = await getBillingMeter(stripe, productProperties, organization);

    // --- create base stripe subscription ---

    // Create Stripe product
    const stripeProduct = await stripe.products.create({
        name: name,
        description: description || undefined,
        metadata: {
          organization_id: organization.id,
          minutes_included: minutes_included.toString(),
        },
      });

      // Create Stripe base price for the subscription
      const stripeBasePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: base_price_cents,
        currency: currency.toLowerCase(),
        recurring: {
          interval: getStripeInterval(billing_period),
          interval_count: 1,
        },
        metadata: {
          type: 'base_price',
          minutes_included: minutes_included.toString(),
          billing_period: billing_period,
        },
      });

    // --- create usage stripe subscription ---

    const perSecondPrice = price_per_minute_cents / 60;

    const stripeUsagePrice = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount_decimal: perSecondPrice.toFixed(4), // Price in cents per second (4 decimal places max)
        currency: currency.toLowerCase(),
        billing_scheme: 'per_unit',
        recurring: {
          interval: getStripeInterval(billing_period),
          usage_type: 'metered',
          meter: billingMeter.id, // Connect the price to the billing meter
        },
        metadata: {
          type: 'usage_price',
          billing_meter_id: billingMeter.id,
          per_minute_price: price_per_minute_cents.toString(),
          per_second_price: (perSecondPrice).toString(), // Convert back to currency units for metadata
          billing_period: billing_period,
        },
      });


    // --- create product in supabase ---

    const {data, error} = await supabaseServerClient.from('products').insert({
        name: name,
        description: description || undefined,
        minutes_included: minutes_included,
        price_per_minute_cents: price_per_minute_cents,
        base_price_cents: base_price_cents,
        currency: currency,
        stripe_product_id: stripeProduct.id,
        stripe_base_price_id: stripeBasePrice.id,
        stripe_usage_price_id: stripeUsagePrice.id,
        stripe_billing_meter_id: billingMeter.id,
        billing_interval: billing_period,
        billing_meter_event_name: 'seconds_used',
        organization_id: organization.id,
        trial_days: trial_days,
    })

    if (error) {
        throw new Error('Failed to create product')
    }

    return data;
}

async function getBillingMeter(stripe: Stripe, productProperties: CreateProductProperties, organization: Organization) {
    
    let billingMeter;
    
    const billingMeterSearch = await stripe.billing.meters.list({
        limit: 100,
    });

    const billingMeterSearchResult = billingMeterSearch.data.find(meter => meter.display_name === `${organization.name} - Seconds Usage`);
    
    if (billingMeterSearchResult) {
        billingMeter = billingMeterSearchResult;
    } else {
        billingMeter = await stripe.billing.meters.create({
            display_name: `${organization.name} - Seconds Usage`,
            event_name: 'seconds_used',
            default_aggregation: {
                formula: 'sum',
            },
            value_settings: {
                event_payload_key: 'seconds_used',
            },
            customer_mapping: {
                event_payload_key: 'customer_id',
                type: 'by_id',
            },
        });
    }

    return billingMeter;
}

export async function getProducts(): Promise<Product[]> {
    const { organization, supabaseServerClient } = await getOrg()

    if (!organization) {
        throw new Error('Organization not found')
    }

    const { data, error } = await supabaseServerClient
        .from('products')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })

    if (error) {
        throw new Error('Failed to fetch products')
    }

    return data || []
}