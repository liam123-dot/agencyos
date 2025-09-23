'use client'

import { Button } from "@/components/ui/button"
import { CreditCard, Loader2 } from "lucide-react"
import { useState } from "react"
import { getBillingPortal } from "@/app/api/billing/getBillingPortal"
import { useSearchParams } from "next/navigation"


export default function ManageBillingButton() {

    const [isLoading, setIsLoading] = useState(false)

    // get the client id from the search params
    const searchParams = useSearchParams()
    const clientId = searchParams.get('client_id')
    
    const handleManageBilling = async () => {
        setIsLoading(true)
        // TODO: Implement billing management functionality
        await getBillingPortal(clientId || undefined)
        console.log('Manage billing clicked')
    }

    return (
        <Button 
            variant="outline" 
            onClick={handleManageBilling}
            className="w-full"
        >
            <CreditCard className="mr-2 h-4 w-4" />
            Manage Billing
            {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
        </Button>
    )
}
