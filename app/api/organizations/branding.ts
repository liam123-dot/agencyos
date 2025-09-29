'use server'

import { createServerClient } from "@/lib/supabase/server"
import { getOrg } from "../user/selected-organization/getOrg"

export async function updateTabTitle(tabTitle: string) {
  const { organization, userData, supabaseServerClient } = await getOrg()

  try {
    console.log('Updating tab title:', tabTitle)

    const { error } = await supabaseServerClient
      .from('organizations')
      .update({ tab_title: tabTitle })
      .eq('id', organization.id)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating tab title:', error)
    return { success: false, error: 'Failed to update tab title' }
  }
}

export async function uploadLogo(formData: FormData) {
  const { organization, userData, supabaseServerClient } = await getOrg()

  try {
    const file = formData.get('logo') as File
    
    if (!file) {
      return { success: false, error: 'No file provided' }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'File must be an image' }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'File size must be less than 5MB' }
    }

    // Create file path with organization ID and timestamp
    const fileExtension = file.name.split('.').pop()
    const fileName = `${organization.id}/logo-${Date.now()}.${fileExtension}`

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabaseServerClient.storage
      .from('organization-logos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      throw uploadError
    }

    // Get public URL
    const { data: urlData } = supabaseServerClient.storage
      .from('organization-logos')
      .getPublicUrl(fileName)

    // Update organization with new logo URL
    const { error: updateError } = await supabaseServerClient
      .from('organizations')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', organization.id)

    if (updateError) {
      // Clean up uploaded file if database update fails
      await supabaseServerClient.storage
        .from('organization-logos')
        .remove([fileName])
      
      throw updateError
    }

    return { success: true, logoUrl: urlData.publicUrl }
  } catch (error) {
    console.error('Error uploading logo:', error)
    return { success: false, error: 'Failed to upload logo' }
  }
}

export async function removeLogo() {
  const { organization, userData, supabaseServerClient } = await getOrg()

  if (!organization.logo_url) {
    return { success: false, error: 'No logo to remove' }
  }

  try {
    // Extract file path from URL
    const url = new URL(organization.logo_url)
    const filePath = url.pathname.split('/').slice(-2).join('/') // Get organizationId/filename

    // Remove file from storage
    const { error: storageError } = await supabaseServerClient.storage
      .from('organization-logos')
      .remove([filePath])

    if (storageError) {
      console.warn('Failed to remove file from storage:', storageError)
      // Continue with database update even if file removal fails
    }

    // Update organization to remove logo URL
    const { error: updateError } = await supabaseServerClient
      .from('organizations')
      .update({ logo_url: null })
      .eq('id', organization.id)

    if (updateError) {
      throw updateError
    }

    return { success: true }
  } catch (error) {
    console.error('Error removing logo:', error)
    return { success: false, error: 'Failed to remove logo' }
  }
}

export async function getBrandingData() {
  const { organization, userData, supabaseServerClient } = await getOrg()

  return {
    logoUrl: organization.logo_url,
    tabTitle: organization.tab_title,
    organizationName: organization.name
  }
}
