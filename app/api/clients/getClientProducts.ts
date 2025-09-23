'use server'

import { Product } from "../products/productType"
import {authorizedToAccessClient} from "./clientMembers"

export async function getClientProducts(id: string): Promise<Product[]> {
    const authorized = await authorizedToAccessClient(id)
    if (!authorized) {
        throw new Error('Unauthorized')
    }
    const { supabaseServerClient, client } = authorized


    // Fetch products assigned to the client by joining clients_products and products
    const { data: clientProducts, error } = await supabaseServerClient
        .from('clients_products')
        .select(`
            products!inner (
                id,
                name,
                description,
                minutes_included,
                price_per_minute_cents,
                currency,
                organization_id,
                stripe_product_id,
                stripe_billing_meter_id,
                stripe_base_price_id,
                billing_interval,
                stripe_usage_price_id,
                billing_meter_event_name,
                base_price_cents,
                created_at,
                updated_at
            )
        `)
        .eq('client_id', client.id)
    

    console.log(clientProducts, error)
    if (error) {
        throw new Error('Failed to fetch client products')
    }

    // Format the response to extract the products from each relationship
    const formattedProducts = clientProducts?.map(item => item.products).filter(Boolean) || []

    return formattedProducts as unknown as Product[]

}
