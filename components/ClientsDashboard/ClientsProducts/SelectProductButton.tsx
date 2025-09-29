'use client'

import { Button } from "@/components/ui/button"
import { Product } from "@/app/api/products/productType"
import { useState } from "react"
import { selectProduct } from "@/app/api/clients/selectProduct"
import { Loader2, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react"
import { toast } from "sonner"

interface SelectProductButtonProps {
    product: Product;
    isDisabled?: boolean;
    isCurrentPlan?: boolean;
    hasActiveSubscription?: boolean;
    currentProductPrice?: number;
}

export default function SelectProductButton({ 
    product, 
    isDisabled = false, 
    isCurrentPlan = false,
    hasActiveSubscription = false,
    currentProductPrice = 0
}: SelectProductButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false)

    const handleAction = async () => {
        setIsProcessing(true)
        try {
            // if (hasActiveSubscription && !isCurrentPlan) {
            //     // Switch to new plan
            //     await switchProduct(product.id)
            // } else 
            if (!hasActiveSubscription) {
                // Select new plan (first time)
                await selectProduct(product.id)
            }
        } catch (error) {
            console.error('Error processing plan action:', error)
            toast.error('Failed to process plan change. Please try again.')
        }
        setIsProcessing(false)
    }

    // Don't show button for current plan
    if (isCurrentPlan) {
        return (
            <Button 
                variant="outline" 
                disabled 
                className="bg-green-50 border-green-200 text-green-700 cursor-default"
            >
                ✓ Current Plan
            </Button>
        );
    }

    // Determine button text and icon based on context
    const getButtonContent = () => {
        if (isDisabled) {
            return {
                text: "Unavailable",
                icon: null,
                variant: "secondary" as const
            }
        }

        if (!hasActiveSubscription) {
            return {
                text: "Select Plan",
                icon: null,
                variant: "default" as const
            }
        }

        // User has active subscription, show contact support message
        return {
            text: "Contact Support to Switch",
            icon: null,
            variant: "outline" as const
        }
    }

    const { text, icon, variant } = getButtonContent()

    // If user has active subscription and this isn't current plan, show disabled contact support button
    if (hasActiveSubscription && !isCurrentPlan) {
        return (
            <Button 
                disabled
                variant="outline"
                className="w-full cursor-default opacity-75"
            >
                Contact Support to Switch
            </Button>
        )
    }

    return (
        <Button 
            onClick={handleAction} 
            disabled={isProcessing || isDisabled}
            variant={variant}
            className={`w-full ${isDisabled ? "cursor-not-allowed" : ""} ${
                variant === "default" ? "bg-primary hover:bg-primary/90" : ""
            }`}
        >
            {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                icon
            )}
            {isProcessing ? "Processing..." : text}
        </Button>
    )
}