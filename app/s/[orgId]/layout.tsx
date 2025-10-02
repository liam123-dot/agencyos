import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orgId: string }>;
}): Promise<Metadata> {
  try {
    const { orgId } = await params;
    const { name, tab_title, logo_url, domain } = await getPublicOrg(orgId);
    
    console.log('Organization metadata:', { name, tab_title, logo_url });
    const title = tab_title || name;
    
    // Next.js metadata icons configuration
    const icons = logo_url ? {
      icon: [
        {
          url: logo_url,
          sizes: '32x32',
        },
        {
          url: logo_url,
          sizes: '16x16', 
        }
      ],
      apple: [
        {
          url: logo_url,
          sizes: '180x180',
        }
      ],
      shortcut: [
        {
          url: logo_url,
        }
      ],
    } : {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
    };

    return {
      title: {
        template: `${title} - %s`,
        default: title,
      },
      icons,
      metadataBase: new URL(`https://${domain}`),
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
