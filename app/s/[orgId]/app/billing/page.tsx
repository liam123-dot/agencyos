'use server'

import ClientProductsComponent from "@/components/ClientsDashboard/ClientsProducts/ClientProductsComponent"
import BillingSuccessHandler from "@/components/ClientsDashboard/ClientsProducts/BillingSuccessHandler"
import UsageAndInvoicePreviewWrapper from "@/components/ClientsDashboard/ClientsProducts/UsageAndInvoicePreviewWrapper"

// client id is in the search params
export default async function ProductsPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ client_id: string; success?: string }> 
}) {

    const { client_id, success } = await searchParams

    return (
        <div>
            <BillingSuccessHandler success={success} />
            <ClientProductsComponent clientId={client_id} />
            <UsageAndInvoicePreviewWrapper clientId={client_id} />
        </div>
    )
}