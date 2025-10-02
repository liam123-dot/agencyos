// 'use server'

import ClientProductsComponent from "@/components/ClientsDashboard/ClientsProducts/ClientProductsComponent"
import BillingSuccessHandler from "@/components/ClientsDashboard/ClientsProducts/BillingSuccessHandler"
import UsageAndInvoicePreviewWrapper from "@/components/ClientsDashboard/ClientsProducts/UsageAndInvoicePreviewWrapper"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Billing",
}

// client id is in the search params
export default async function ProductsPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ client_id: string; success?: string }> 
}) {

    const { client_id, success } = await searchParams

    return (
        <div className="p-4 md:p-6 space-y-8">
            <BillingSuccessHandler success={success} />
            <ClientProductsComponent clientId={client_id} />
            <UsageAndInvoicePreviewWrapper clientId={client_id} />
        </div>
    )
}