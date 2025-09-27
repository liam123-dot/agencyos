'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

interface BillingSuccessHandlerProps {
    success?: string
}

export default function BillingSuccessHandler({ success }: BillingSuccessHandlerProps) {
    useEffect(() => {
        if (success === 'switched') {
            toast.success('Successfully switched your plan!')
        } else if (success === 'subscribed') {
            toast.success('Successfully subscribed to your new plan!')
        }
    }, [success])

    return null // This component doesn't render anything
}
