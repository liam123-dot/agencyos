'use client'

import { Button } from "@/components/ui/button"
import { Product } from "@/app/api/products/productType"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { unassignProductFromClient } from "@/app/api/products/unassignProductFromClient"
import { useRouter } from "next/navigation"

interface UnassignProductButtonProps {
    product: Product
    clientId: string
    onUnassigned?: () => void
}

export function UnassignProductButton({ product, clientId, onUnassigned }: UnassignProductButtonProps) {
    const [isUnassigning, setIsUnassigning] = useState(false)
    const router = useRouter()

    const handleUnassign = async () => {
        setIsUnassigning(true)
        try {
            await unassignProductFromClient({productId: product.id, clientId: clientId})
            
            toast.success(`${product.name} unassigned from client successfully!`)
            onUnassigned?.()
            router.refresh()
        } catch (error) {
            console.error('Error unassigning product:', error)
            toast.error("Failed to unassign product. Please try again.")
        } finally {
            setIsUnassigning(false)
        }
    }

    return (
        <Button 
            size="sm" 
            variant="outline"
            onClick={handleUnassign}
            disabled={isUnassigning}
            className="w-full"
        >
            {isUnassigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isUnassigning ? "Unassigning..." : "Unassign"}
        </Button>
    )
}
