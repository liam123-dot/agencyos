import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";
import { DynamicTitle } from "./DynamicTitle";

interface OrganizationBrandingProps {
  orgId: string;
}

export async function OrganizationBranding({ orgId }: OrganizationBrandingProps) {
  try {
    const { name, tab_title, logo_url } = await getPublicOrg(orgId);
    const title = tab_title || name;
    
    return <DynamicTitle title={title} logoUrl={logo_url} />;
  } catch (error) {
    console.error('Failed to fetch organization branding:', error);
    return null;
  }
}
