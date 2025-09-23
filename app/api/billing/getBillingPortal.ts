'use server'


import { getUser } from "../user/getUser";
import Stripe from "stripe";
import { redirect } from "next/navigation";

export async function getBillingPortal(clientId?: string) {

    const { userData, supabaseServerClient } = await getUser();

    const client_id = userData.client_id || clientId;

    const {data: client} = await supabaseServerClient.from('clients').select('*').eq('id', client_id).single();

    const {data: organization} = await supabaseServerClient.from('organizations').select('*').eq('id', client.organization_id).single();

    const stripe = new Stripe(organization.stripe_api_key);

    const session = await stripe.billingPortal.sessions.create({
        customer: client.stripe_customer_id,
        return_url: `https://${organization.domain}/app/billing`,
    });

    redirect(session.url);
    
}