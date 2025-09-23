import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";

interface OrganizationNameProps {
  orgId: string;
}

export async function OrganizationName({ orgId }: OrganizationNameProps) {
  try {
    const { name } = await getPublicOrg(orgId);
    return <span className="font-bold text-lg">{name}</span>;
  } catch (error) {
    console.error('Failed to fetch organization name:', error);
    return <span className="font-bold text-lg">Organization</span>;
  }
}
