'use server'

import { createServerClient } from "@/lib/supabase/server"
import { OrganizationWithDetails, OrganizationRole, Organization, UpdateOrganizationRequest } from "@/lib/types/organizations"
import { redirect } from "next/navigation";
import { getUser } from "@/app/api/user/getUser"

// Utility function to check if a user is a member of an organization
export async function checkUserMembership(organizationId: string, userId?: string): Promise<{ isMember: boolean; role?: OrganizationRole }> {
  const supabase = await createServerClient()
  
  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { isMember: false }
    targetUserId = user.id
  }

  const { data: membership, error } = await supabase
    .from('user_organizations')
    .select('role')
    .eq('user_id', targetUserId)
    .eq('organization_id', organizationId)
    .single()

  if (error || !membership) {
    return { isMember: false }
  }

  return { isMember: true, role: membership.role }
}

// Utility function to format organization data with computed fields
function formatOrganizationWithDetails(orgData: Record<string, any>): OrganizationWithDetails {
  return {
    id: orgData.id,
    name: orgData.name,
    slug: orgData.slug,
    description: orgData.description,
    created_at: orgData.created_at,
    updated_at: orgData.updated_at,
    member_count: orgData.member_count,
    user_role: orgData.role,
    is_owner: orgData.role === 'owner',
    is_admin: orgData.role === 'admin',
    can_manage_members: ['owner', 'admin'].includes(orgData.role),
    can_invite: ['owner', 'admin'].includes(orgData.role),
  }
}

// Get user's selected organization
export async function getSelectedOrganization(): Promise<{ organization: OrganizationWithDetails | null; role: OrganizationRole | null }> {
  const supabase = await createServerClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Get user's selected organization ID
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('selected_organization_id')
    .eq('id', user.id)
    .single()

  if (userError) {
    console.error('Error fetching user data:', userError)
    throw new Error('Failed to fetch user data')
  }

  // If no selected organization, try to auto-select the first available one
  if (!userData.selected_organization_id) {
    console.log('No selected organization found, attempting auto-select')
    
    // Get user's organizations to see if they have any
    const { data: userOrganizations, error: orgsError } = await supabase
      .from('user_organizations')
      .select(`
        role,
        organization:organizations(
          id,
          name,
          slug,
          description,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .limit(1)

    if (orgsError) {
      console.error('Error fetching user organizations for auto-select:', orgsError)
      return { organization: null, role: null }
    }

    // If user has organizations, auto-select the first one
    if (userOrganizations && userOrganizations.length > 0) {
      const firstUserOrg = userOrganizations[0]
      const firstOrg = firstUserOrg.organization as any
      
      // Update user's selected organization to the first one
      const { error: updateError } = await supabase
        .from('users')
        .update({ selected_organization_id: firstOrg.id })
        .eq('id', user.id)

      if (updateError) {
        console.error('Error auto-selecting first organization:', updateError)
      } else {
        console.log('Auto-selected first organization:', firstOrg.name)
        
        // Get member count for this organization
        const { count: memberCount } = await supabase
          .from('user_organizations')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', firstOrg.id)
        
        // Return the auto-selected organization with details
        const organizationWithDetails = formatOrganizationWithDetails({
          ...firstOrg,
          role: firstUserOrg.role,
          member_count: memberCount || 0
        })
        return { organization: organizationWithDetails, role: firstUserOrg.role }
      }
    }

    // No organizations found, return null
    return { organization: null, role: null }
  }

  // Get the selected organization with user's role
  const { data: selectedOrgData, error: orgError } = await supabase
    .from('user_organizations')
    .select(`
      role,
      organization:organizations(
        id,
        name,
        slug,
        description,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .eq('organization_id', userData.selected_organization_id)
    .single()

  if (orgError) {
    console.error('Error fetching selected organization:', orgError)
    throw new Error('Failed to fetch selected organization')
  }

  // Get member count for this organization
  const { count: memberCount } = await supabase
    .from('user_organizations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', userData.selected_organization_id)

  // Format the organization data for response
  const organizationWithDetails = formatOrganizationWithDetails({
    ...(selectedOrgData.organization as any),
    role: selectedOrgData.role,
    member_count: memberCount || 0
  })

  return { organization: organizationWithDetails, role: selectedOrgData.role }
}

// Update user's selected organization
export async function updateSelectedOrganization(organizationId: string | null): Promise<{ organization: OrganizationWithDetails | null; role: OrganizationRole | null }> {
  const supabase = await createServerClient()
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Validate that the user is a member of the organization (if not null)
  if (organizationId) {
    const { isMember } = await checkUserMembership(organizationId, user.id)
    if (!isMember) {
      throw new Error('You are not a member of this organization')
    }
  }

  // Update selected organization
  const { error: updateError } = await supabase
    .from('users')
    .update({ selected_organization_id: organizationId })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating selected organization:', updateError)
    throw new Error('Failed to update selected organization')
  }

  // If setting to null, return null data
  if (!organizationId) {
    return { organization: null, role: null }
  }

  // Get the updated organization with user's role
  const { data: selectedOrgData, error: orgError } = await supabase
    .from('user_organizations')
    .select(`
      role,
      organization:organizations(
        id,
        name,
        slug,
        description,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', user.id)
    .eq('organization_id', organizationId)
    .single()

  if (orgError) {
    console.error('Error fetching organization after update:', orgError)
    throw new Error('Failed to fetch updated organization')
  }

  // Get member count for this organization
  const { count: memberCount } = await supabase
    .from('user_organizations')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  // Format the organization data for response
  const organizationWithDetails = formatOrganizationWithDetails({
    ...(selectedOrgData.organization as any),
    role: selectedOrgData.role,
    member_count: memberCount || 0
  })

  return { organization: organizationWithDetails, role: selectedOrgData.role }
}

// Get user's organizations
export async function getUserOrganizations(): Promise<OrganizationWithDetails[]> {

  const { userData, supabaseServerClient } = await getUser();

  if (!userData) {
    throw new Error('User not found')
  }

  if (userData.client_id) {
  // check if user is a client, if so, sign them out and redirect to the domain of the organization who owns that client
    const { data: client, error: clientError } = await supabaseServerClient.from('clients').select('organization_id, domain').eq('id', userData.client_id).single();
    console.log('client', client);
    if (clientError || !client || !client.domain) {
      await supabaseServerClient.auth.signOut();
      redirect(`https://${client?.domain}`);
    }
  }

  // Get user's organizations with their roles
  const { data: userOrganizations, error } = await supabaseServerClient
    .from('user_organizations')
    .select(`
      role,
      organization:organizations(
        id,
        name,
        slug,
        description,
        created_at,
        updated_at
      )
    `)
    .eq('user_id', userData.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching organizations:', error)
    throw new Error('Failed to fetch organizations')
  }

  // Get member counts for all organizations
  const organizationIds = userOrganizations.map(uo => (uo.organization as any).id)
  const memberCounts = new Map<string, number>()
  
  if (organizationIds.length > 0) {
    const { data: counts } = await supabaseServerClient
      .from('user_organizations')
      .select('organization_id')
      .in('organization_id', organizationIds)
    
    // Count members for each organization
    counts?.forEach(count => {
      const orgId = count.organization_id
      memberCounts.set(orgId, (memberCounts.get(orgId) || 0) + 1)
    })
  }

  // Transform the data to include computed fields
  const organizationsWithDetails: OrganizationWithDetails[] = userOrganizations.map(userOrg => {
    const org = userOrg.organization as any
    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      created_at: org.created_at,
      updated_at: org.updated_at,
      member_count: memberCounts.get(org.id) || 0,
      user_role: userOrg.role,
      is_owner: userOrg.role === 'owner',
      is_admin: userOrg.role === 'admin',
      can_manage_members: ['owner', 'admin'].includes(userOrg.role),
      can_invite: ['owner', 'admin'].includes(userOrg.role),
    }
  })

  return organizationsWithDetails
}

// Update organization
export async function updateOrganization(organizationId: string, data: UpdateOrganizationRequest): Promise<Organization> {
  const { userData, supabaseServerClient } = await getUser();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabaseServerClient.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Check if user has admin or owner role
  const { data: userOrg, error: roleError } = await supabaseServerClient
    .from('user_organizations')
    .select('role')
    .eq('user_id', userData.id)
    .eq('organization_id', organizationId)
    .single()

  if (roleError || !userOrg || !['owner', 'admin'].includes(userOrg.role)) {
    throw new Error('Insufficient permissions')
  }

  // Build update object with only provided fields
  const updateData: Record<string, string | null> = {}
  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  
  // Handle slug update with validation
  if (data.slug !== undefined) {
    // Check if slug is unique (excluding current organization)
    const { data: existingOrg } = await supabaseServerClient
      .from('organizations')
      .select('id')
      .eq('slug', data.slug)
      .neq('id', organizationId)
      .single()

    if (existingOrg) {
      throw new Error('Slug is already taken')
    }
    updateData.slug = data.slug
  }

  updateData.updated_at = new Date().toISOString()

  // Update organization
  const { data: updatedOrg, error } = await supabaseServerClient
    .from('organizations')
    .update(updateData)
    .eq('id', organizationId)
    .select()
    .single()

  if (error) {
    console.error('Error updating organization:', error)
    throw new Error('Failed to update organization')
  }

  return updatedOrg
}

// Delete organization
export async function deleteOrganization(organizationId: string): Promise<{ success: boolean; message: string }> {
  const { userData, supabaseServerClient } = await getUser();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabaseServerClient.auth.getUser()
  if (authError || !user) {
    throw new Error('Unauthorized')
  }

  // Get organization name and check if user is owner
  const { data: userOrg, error: roleError } = await supabaseServerClient
    .from('user_organizations')
    .select(`
      role,
      organization:organizations(name)
    `)
    .eq('user_id', userData.id)
    .eq('organization_id', organizationId)
    .single()

  if (roleError || !userOrg || userOrg.role !== 'owner') {
    throw new Error('Only organization owners can delete organizations')
  }

  const organizationName = (userOrg.organization as any).name

  // Delete organization (cascades will handle related records)
  const { error } = await supabaseServerClient
    .from('organizations')
    .delete()
    .eq('id', organizationId)

  if (error) {
    console.error('Error deleting organization:', error)
    throw new Error('Failed to delete organization')
  }

  // Clear selected organization if it was the deleted one
  await supabaseServerClient
    .from('users')
    .update({ selected_organization_id: null })
    .eq('id', userData.id)
    .eq('selected_organization_id', organizationId)

  return {
    success: true,
    message: `Organization "${organizationName}" has been successfully deleted.`
  }
}

// Leave organization
export async function leaveOrganization(organizationId: string): Promise<{ success: boolean; message: string }> {
  const { userData, supabaseServerClient } = await getUser();
  

  // Check if user is a member and get their role and organization name
  const { data: userOrg, error: roleError } = await supabaseServerClient
    .from('user_organizations')
    .select(`
      role,
      organization:organizations(name)
    `)
    .eq('user_id', userData.id)
    .eq('organization_id', organizationId)
    .single()

  if (roleError || !userOrg) {
    throw new Error('You are not a member of this organization')
  }

  // Owners cannot leave their organization
  if (userOrg.role === 'owner') {
    throw new Error('Organization owners cannot leave. Transfer ownership or delete the organization instead.')
  }

  const organizationName = (userOrg.organization as any).name

  // Remove user from organization
  const { error: deleteError } = await supabaseServerClient
    .from('user_organizations')
    .delete()
    .eq('user_id', userData.id)
    .eq('organization_id', organizationId)

  if (deleteError) {
    console.error('Error leaving organization:', deleteError)
    throw new Error('Failed to leave organization')
  }

  // Clear selected organization if it was the one they left
  await supabaseServerClient
    .from('users')
    .update({ selected_organization_id: null })
    .eq('id', userData.id)
    .eq('selected_organization_id', organizationId)

  return {
    success: true,
    message: `You have successfully left "${organizationName}".`
  }
}
