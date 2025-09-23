'use server'

import { getOrg } from "../user/selected-organization/getOrg"
import { VapiClient } from "@vapi-ai/server-sdk"

export async function saveVapiKey(vapiKey: string) {
    const { organization, userData, supabaseServerClient } = await getOrg()

    if (!organization) {
        return { success: false, error: 'Organization not found' }
    }
    
    if (!vapiKey) {
        return { success: false, error: 'API key is required' }
    }

    try {
        const vapiClient = new VapiClient({token: vapiKey});
        await vapiClient.assistants.list();
    } catch (error: any) {
        return { success: false, error: 'Invalid Vapi API key' }
    }
    
    const { error } = await supabaseServerClient.from('organizations').update({ vapi_api_key: vapiKey }).eq('id', organization.id)

    if (error) {
        console.error('Error updating Vapi API key:', error)
        return { success: false, error: 'Failed to save API key' }
    }

    return { success: true }

}

export async function removeVapiKey() {
    const { organization, supabaseServerClient } = await getOrg()

    if (!organization) {
        return { success: false, error: 'Organization not found' }
    }

    const { error } = await supabaseServerClient.from('organizations').update({ vapi_api_key: null }).eq('id', organization.id)

    if (error) {
        console.error('Error removing Vapi API key:', error)
        return { success: false, error: 'Failed to remove API key' }
    }

    return { success: true }
}

export async function saveVapiPublishableKey(publishableKey: string) {
    const { organization, userData, supabaseServerClient } = await getOrg()

    if (!organization) {
        return { success: false, error: 'Organization not found' }
    }
    
    if (!publishableKey) {
        return { success: false, error: 'Publishable key is required' }
    }
    
    const { error } = await supabaseServerClient.from('organizations').update({ vapi_publishable_key: publishableKey }).eq('id', organization.id)

    if (error) {
        console.error('Error updating Vapi publishable key:', error)
        return { success: false, error: 'Failed to save publishable key' }
    }

    return { success: true }
}

export async function removeVapiPublishableKey() {
    const { organization, supabaseServerClient } = await getOrg()

    if (!organization) {
        return { success: false, error: 'Organization not found' }
    }

    const { error } = await supabaseServerClient.from('organizations').update({ vapi_publishable_key: null }).eq('id', organization.id)

    if (error) {
        console.error('Error removing Vapi publishable key:', error)
        return { success: false, error: 'Failed to remove publishable key' }
    }

    return { success: true }
}
