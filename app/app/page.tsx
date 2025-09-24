import StripeComponent from "@/components/organizations/StripeSetup/StripeComponent";
import VapiComponent from "@/components/organizations/VapiSetup/VapiComponent";
import { BrandingServer } from "@/components/organizations/branding";
import ConnectDomainComponent from "@/components/organizations/domain/ConnectDomainComponent";


export default function DashboardPage() {
  return (
    <div className="container py-8">
      <div className="max-w-4xl mx-auto">
        
          <VapiComponent />
          <StripeComponent />
          <BrandingServer/>

      </div>
    </div>
  )
}