import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";
import Image from "next/image";

interface OrganizationNameProps {
  orgId: string;
}

export async function OrganizationName({ orgId }: OrganizationNameProps) {
  try {
    const { name, logo_url } = await getPublicOrg(orgId);
    return (
      <div className="flex items-center gap-2">
        {logo_url && (
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={logo_url}
              alt={`${name} logo`}
              fill
              className="object-contain rounded"
            />
          </div>
        )}
        <span className="font-bold text-lg">{name}</span>
      </div>
    );
  } catch (error) {
    console.error('Failed to fetch organization data:', error);
    return <span className="font-bold text-lg">Organization</span>;
  }
}
