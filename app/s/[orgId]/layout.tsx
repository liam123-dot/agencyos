import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string }>;
}): Promise<Metadata> {
  try {
    const { orgId } = await params;
    const { name, tab_title, logo_url } = await getPublicOrg(orgId);
    
    const title = tab_title || name;
    const icons = logo_url ? [
      {
        rel: 'icon',
        url: logo_url,
      },
      {
        rel: 'apple-touch-icon',
        url: logo_url,
      },
    ] : undefined;

    return {
      title,
      icons,
    };
  } catch (error) {
    console.error('Failed to generate metadata:', error);
    return {
      title: 'Organization Portal',
    };
  }
}

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  return <>{children}</>;
}
