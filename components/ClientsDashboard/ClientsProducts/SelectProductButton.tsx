'use client'

import { Button } from "@/components/ui/button"
import { Product } from "@/app/api/products/productType"
import { useState } from "react"
import { selectProduct } from "@/app/api/clients/selectProduct"
import { Loader2 } from "lucide-react"

interface SelectProductButtonProps {
    product: Product;
    isDisabled?: boolean;
    isCurrentPlan?: boolean;
}

export default function SelectProductButton({ product, isDisabled = false, isCurrentPlan = false }: SelectProductButtonProps) {
    const [isSelecting, setIsSelecting] = useState(false)

    const handleSelect = async () => {
        setIsSelecting(true)
        await selectProduct(product.id)
        setIsSelecting(false)
    }

    // Don't show button for current plan
    if (isCurrentPlan) {
        return null;
    }

    return (
        <Button 
            onClick={handleSelect} 
            disabled={isSelecting || isDisabled}
            variant={isDisabled ? "secondary" : "default"}
            className={isDisabled ? "cursor-not-allowed" : ""}
        >
            {isSelecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDisabled ? "Unavailable" : "Select Product"}
        </Button>
    )
}