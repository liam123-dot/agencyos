'use server'

import Stripe from "stripe";
import { getOrg } from "@/app/api/user/selected-organization/getOrg";
import { revalidatePath } from "next/cache";

const webhookBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function validateStripeKeyAndSetupWebhook(
    stripeSecretKey: string,
    organizationId: string
): Promise<{ isValid: boolean; error?: string; webhookCreated?: boolean }> {
    // Basic validation
    if (!stripeSecretKey || typeof stripeSecretKey !== 'string') {
        return { isValid: false, error: 'Valid Stripe secret key is required' };
    }

    const trimmedKey = stripeSecretKey.trim();

    // Format validation
    if (!trimmedKey.startsWith('sk_')) {
        return { isValid: false, error: 'Stripe secret key must start with "sk_"' };
    }

    // Test the key by trying to retrieve account information
    let stripe: Stripe;
    try {
        stripe = new Stripe(trimmedKey);
        await stripe.accounts.retrieve();
    } catch (error) {
        console.error('Stripe secret key validation failed:', error);
        return { isValid: false, error: 'Invalid Stripe secret key' };
    }

    // Set up webhook endpoint
    let webhookCreated = false;
    try {
        const webhookUrl = `${webhookBaseUrl}/api/stripe/${organizationId}/webhook`;

        // List existing webhook endpoints to check for duplicates
        const existingWebhooks = await stripe.webhookEndpoints.list({
            limit: 100,
        });

        // Find and remove any existing webhooks that contain this organization ID
        // This ensures we only remove webhooks we created, not other webhooks
        const webhooksToRemove = existingWebhooks.data.filter(webhook => {
            // Check if the webhook URL contains our organization ID
            const urlContainsOrgId = webhook.url && webhook.url.includes(`/api/stripe/${organizationId}/webhook`);
            // Check if the webhook description contains our organization ID
            const descriptionContainsOrgId = webhook.description && webhook.description.includes(organizationId);
            
            return urlContainsOrgId || descriptionContainsOrgId;
        });

        // Remove existing webhooks for this organization
        for (const webhook of webhooksToRemove) {
            try {
                await stripe.webhookEndpoints.del(webhook.id);
                console.log(`Removed existing webhook for org ${organizationId}:`, webhook.id);
            } catch (deleteError) {
                console.error(`Failed to delete webhook ${webhook.id}:`, deleteError);
                // Continue with the process even if deletion fails
            }
        }

        // Create new webhook endpoint with the events we track
        const webhookEndpoint = await stripe.webhookEndpoints.create({
            url: webhookUrl,
            enabled_events: [
                "checkout.session.completed",
                "customer.subscription.created",
                "customer.subscription.updated",
                "customer.subscription.deleted",
                "customer.subscription.paused",
                "customer.subscription.resumed",
                "customer.subscription.pending_update_applied",
                "customer.subscription.pending_update_expired",
                "customer.subscription.trial_will_end",
                "invoice.paid",
                "invoice.payment_failed",
                "invoice.payment_action_required",
                "invoice.upcoming",
                "invoice.marked_uncollectible",
                "invoice.payment_succeeded",
                "payment_intent.succeeded",
                "payment_intent.payment_failed",
                "payment_intent.canceled",
            ],
            description: `Webhook for organization: ${organizationId}`,
        });

        console.log(`Created webhook endpoint for org ${organizationId}:`, webhookEndpoint.id);
        webhookCreated = true;

    } catch (webhookError: any) {
        // Log webhook setup error but don't fail the entire operation
        console.error('Failed to set up webhook endpoint:', webhookError);
        // Note: We continue with the operation even if webhook setup fails
    }

    return { isValid: true, webhookCreated };
}

export async function saveStripeApiKey(apiKey: string) {
    try {
        const { organization, supabaseServerClient } = await getOrg();

        if (!organization) {
            throw new Error("Organization not found.");
        }

        const validation = await validateStripeKeyAndSetupWebhook(apiKey, organization.id);

        if (!validation.isValid) {
            return { success: false, error: validation.error };
        }

        const { error } = await supabaseServerClient
            .from("organizations")
            .update({ stripe_api_key: apiKey })
            .eq("id", organization.id);

        if (error) {
            throw new Error(error.message);
        }
        revalidatePath('/settings')
        return { success: true, webhookCreated: validation.webhookCreated };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function removeStripeApiKey() {
    try {
        const { organization, supabaseServerClient } = await getOrg();

        if (!organization) {
            throw new Error("Organization not found.");
        }

        const { error } = await supabaseServerClient
            .from("organizations")
            .update({ stripe_api_key: null })
            .eq("id", organization.id);

        if (error) {
            throw new Error(error.message);
        }
        revalidatePath('/settings')
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}


