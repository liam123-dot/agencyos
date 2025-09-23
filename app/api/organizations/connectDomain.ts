'use server'

import { createServerClient } from "@/lib/supabase/server"
import { getOrg } from "../user/selected-organization/getOrg"

import { Vercel } from '@vercel/sdk';
import { projectsGetProjectDomain } from '@vercel/sdk/funcs/projectsGetProjectDomain.js';
import { projectsVerifyProjectDomain } from '@vercel/sdk/funcs/projectsVerifyProjectDomain.js';

const vercel = new Vercel({
    bearerToken: process.env.VERCEL_TOKEN!,
});
  

export async function connectDomain(domain: string) {
  const { organization, userData, supabaseServerClient } = await getOrg()

  try {
    console.log('Connecting domain:', domain)

    const result = await vercel.projects.addProjectDomain({
      idOrName: process.env.VERCEL_PROJECT_ID!,
      requestBody: {
        name: domain,
      },
    });

    const { error } = await supabaseServerClient
      .from('organizations')
      .update({ domain: domain })
      .eq('id', organization.id)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error connecting domain:', error)
    return { success: false, error: 'Failed to connect domain' }
  }
}

export async function checkVerificationStatus(domain?: string) {
  const { organization, userData, supabaseServerClient } = await getOrg()

  const domainToCheck = domain || organization.domain

  if (!domainToCheck) {
    throw new Error('Domain not connected')
  }

  const [domainResponse, verifyResponse, domainConfig] = await Promise.all([
    projectsGetProjectDomain(vercel, {
      idOrName: process.env.VERCEL_PROJECT_ID!,
      domain: domainToCheck,
    }),
    projectsVerifyProjectDomain(vercel, {
      idOrName: process.env.VERCEL_PROJECT_ID!,
      domain: domainToCheck,
    }),
    vercel.domains.getDomainConfig({
      domain: domainToCheck,
    }),
  ]);

  console.log('Domain Response:', JSON.stringify(domainResponse, null, 2))
  console.log('Verify Response:', JSON.stringify(verifyResponse, null, 2))
  console.log('Get Domain Response:', JSON.stringify(domainConfig, null, 2))
  
  if (domainResponse.ok) {
    const domainData = domainResponse.value;
    
    if (!domainData.verified) {
      const verificationData = domainData.verification;
      
      // Separate ownership verification from DNS configuration
      const ownershipVerification = verificationData?.filter((v: any) => 
        v.type === 'TXT' && v.domain?.includes('_vercel')
      ) || [];
      
      const dnsConfiguration = verificationData?.filter((v: any) => 
        v.type !== 'TXT' || !v.domain?.includes('_vercel')
      ) || [];

      // Check if we have ownership verification pending
      if (ownershipVerification.length > 0) {
        return {
          verified: false,
          ownershipVerified: false,
          ownershipVerification: ownershipVerification,
          domain: domainToCheck,
          step: 'ownership'
        }
      }
      
      // If ownership is verified but DNS is not configured
      if (dnsConfiguration.length > 0) {
        return {
          verified: false,
          ownershipVerified: true,
          dnsConfiguration: dnsConfiguration,
          domain: domainToCheck,
          step: 'dns'
        }
      }
      
      // Fallback for other verification data
      return {
        verified: false,
        ownershipVerified: false,
        verificationData: verificationData,
        domain: domainToCheck,
        step: 'unknown'
      }
    }
  } else {
    return {error: true}
  }

  if (domainConfig.misconfigured) {
    return {verified: false, ownershipVerified: true, recommendedCNAME: domainConfig.recommendedCNAME, recommendedIPv4: domainConfig.recommendedIPv4, domain: domainToCheck, step: 'dns'}
  }

  return {verified: true, ownershipVerified: true, domain: domainToCheck, step: 'completed'}
}

export async function removeDomain() {
  const { organization, userData, supabaseServerClient } = await getOrg()

  if (!organization.domain) {
    throw new Error('No domain to remove')
  }

  try {
    // Remove domain from Vercel project
    await vercel.projects.removeProjectDomain({
      idOrName: process.env.VERCEL_PROJECT_ID!,
      domain: organization.domain
    });

    // Update organization in database to remove domain
    const { error } = await supabaseServerClient
      .from('organizations')
      .update({ domain: null })
      .eq('id', organization.id)

    if (error) {
      throw error
    }

    return { success: true }
  } catch (error) {
    console.error('Error removing domain:', error)
    return { success: false, error: 'Failed to remove domain' }
  }
}
