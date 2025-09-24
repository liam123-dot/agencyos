'use server'

import { getBrandingData } from "@/app/api/organizations/branding"
import { ConnectDomainServer } from "../domain/ConnectDomainServer"
import LogoUpload from "./LogoUpload"
import TabTitleCustomization from "./TabTitleCustomization"

export async function BrandingServer() {
  const brandingData = await getBrandingData()

  if (!brandingData) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Domain Connection Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Domain Configuration</h3>
        <ConnectDomainServer />
      </div>

      {/* Logo Upload Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Logo & Visual Identity</h3>
        <LogoUpload 
          organizationName={brandingData.organizationName}
          currentLogoUrl={brandingData.logoUrl}
        />
      </div>

      {/* Tab Title Customization Section */}
      <div>
        <h3 className="text-lg font-medium mb-4">Tab Title</h3>
        <TabTitleCustomization 
          organizationName={brandingData.organizationName}
          currentTabTitle={brandingData.tabTitle}
        />
      </div>
    </div>
  )
}
