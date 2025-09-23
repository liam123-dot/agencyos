'use server'

import { createServerClient } from "@/lib/supabase/server"
import { addUserToOrg } from "./addUserToOrg";

// Helper function to generate a slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

export async function createOrganization({name}: {name: string}) {
    console.log('Creating organization:', name);
    const supabase = await createServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }

    // Generate a unique slug
    const baseSlug = generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    // Check if slug already exists and create a unique one
    while (true) {
        const { data: existing } = await supabase
            .from('organizations')
            .select('id')
            .eq('slug', slug)
            .single();

        if (!existing) {
            break; // Slug is unique
        }
        
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    const { data: organization, error } = await supabase
        .from('organizations')
        .insert({ 
            name: name,
            slug: slug 
        })
        .select()
        .single();

    if (error) {
        console.error('Database error creating organization:', error);
        throw new Error(`Something went wrong while creating the organization, please try again.`);
    }

    const userOrg = await addUserToOrg({userId: user.id, orgId: organization.id, role: 'owner'})

    if (!userOrg) {
        console.error('Failed to add user to organization', error);
        throw new Error('Something went wrong while creating the organization, please try again.');
    }

    if (error) {
        console.error('Database error creating organization:', error);
        throw new Error(`Something went wrong while creating the organization, please try again.`);
    }

    if (!organization) {
        throw new Error('Something went wrong while creating the organization, please try again.');
    }

    return organization;
}
