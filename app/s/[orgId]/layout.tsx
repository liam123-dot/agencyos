import { OrganizationBranding } from "@/components/ClientsDashboard/OrganizationBranding";
import { Suspense } from "react";

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  return (
    <>
      {/* Apply organization branding (title and favicon) to all pages under /s/[orgId] */}
      <Suspense fallback={null}>
        <OrganizationBranding orgId={orgId} />
      </Suspense>
      {children}
    </>
  );
}
