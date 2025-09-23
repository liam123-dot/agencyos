
'use server'

import Stripe from "stripe"
import { getUser } from "../user/getUser"
import { authorizedToAccessClient } from "./clientMembers"
import { redirect } from "next/navigation"

export async function selectProduct(productId: string) {
    
    const { userData } = await getUser()
    const clientId = userData.client_id

    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        throw new Error('Unauthorized')
    }
    const { supabaseServerClient, client } = authorized

    const {data: product, error: productError} = await supabaseServerClient.from('products').select('*').eq('id', productId).single()

    const {data: organization, error: organizationError} = await supabaseServerClient.from('organizations').select('*').eq('id', product.organization_id).single()

    if (productError) {
        throw new Error('Failed to fetch product')
    }

    if (organizationError) {
        throw new Error('Failed to fetch organization')
    }

    if (!organization) {
        throw new Error('Organization not found')
    }

    const stripe = new Stripe(organization.stripe_api_key)

    if (!client.stripe_customer_id) {
        const stripeCustomer = await stripe.customers.create({
            email: userData.email,
        })
        client.stripe_customer_id = stripeCustomer.id
        await supabaseServerClient.from('clients').update({ stripe_customer_id: stripeCustomer.id }).eq('id', client.id)
    }

    // create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
        customer: client.stripe_customer_id,
        line_items: [{
            price: product.stripe_base_price_id,
            quantity: 1,
        }, {
            price: product.stripe_usage_price_id
        }],
        mode: 'subscription',
        success_url: `https://${organization.domain}/app/billing/success`,
        cancel_url: `https://${organization.domain}/app/billing`,
        metadata: {
            client_id: client.id,
            product_id: product.id,
            organization_id: organization.id,
        },
    })

    // redirect to checkout session
    redirect(checkoutSession.url!)

}


