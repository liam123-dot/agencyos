'use server'

import { createServerClient } from "@/lib/supabase/server";

export async function getOrg() {

    const supabase = await createServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        throw new Error('Unauthorized');
    }
    
    const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (userError) {
        throw new Error('Failed to fetch user data');
    }

    const { data: organization, error } = await supabase.from('organizations').select('*').eq('id', userData.selected_organization_id).single();
    
    return { organization, userData, supabaseServerClient: supabase }

}

export async function getPublicOrg(orgId: string) {
    const supabase = await createServerClient();
    const { data: organization, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();
    if (error) {
        console.error('Error fetching organization data:', error);
        throw new Error('Failed to fetch organization data');
    }

    // return name, logo, and tab title for branding
    return { 
        name: organization.name,
        logo_url: organization.logo_url,
        tab_title: organization.tab_title,
        vapi_publishable_key: organization.vapi_publishable_key
    };
}
