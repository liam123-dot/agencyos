'use client'

import { Button } from "@/components/ui/button"
import { Product } from "@/app/api/products/productType"
import { toast } from "sonner"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { assignProductToClient } from "@/app/api/products/assignProductToClient"
import { useRouter } from "next/navigation"

interface AssignProductButtonProps {
    product: Product
    clientId: string
    onAssigned?: () => void
}

export function AssignProductButton({ product, clientId, onAssigned }: AssignProductButtonProps) {
    const [isAssigning, setIsAssigning] = useState(false)
    const router = useRouter()

    const handleAssign = async () => {
        setIsAssigning(true)
        try {
            // TODO: Implement the actual assign product to client API call
            // await assignProductToClient(product.id, clientId)
            
            // For now, just simulate the assignment
            await assignProductToClient({productId: product.id, clientId: clientId})
            
            toast.success(`${product.name} assigned to client successfully!`)
            onAssigned?.()
            router.refresh()
        } catch (error) {
            console.error('Error assigning product:', error)
            toast.error("Failed to assign product. Please try again.")
        } finally {
            setIsAssigning(false)
        }
    }

    return (
        <Button 
            size="sm" 
            onClick={handleAssign}
            disabled={isAssigning}
            className="w-full"
        >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAssigning ? "Assigning..." : "Assign"}
        </Button>
    )
}
