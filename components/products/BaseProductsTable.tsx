// Server component (no directive needed)

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Product } from "@/app/api/products/productType"
import { AssignProductButton } from "./AssignProductButton"
import { UnassignProductButton } from "./UnassignProductButton"

interface BaseProductsTableProps {
    products: Product[]
    title: string
    description: string
    headerAction?: React.ReactNode
    rowActionType?: 'none' | 'assign' | 'unassign'
    clientId?: string
    emptyStateMessage?: string
    emptyStateSubMessage?: string
}

export function BaseProductsTable({
    products,
    title,
    description,
    headerAction,
    rowActionType = 'none',
    clientId,
    emptyStateMessage = "No products found.",
    emptyStateSubMessage = "Create your first product to get started."
}: BaseProductsTableProps) {
    
    const formatCurrency = (cents: number, currency: string) => {
        const amount = cents / 100
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>
                            {description}
                        </CardDescription>
                    </div>
                    {headerAction}
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Base Price</TableHead>
                            <TableHead>Per Minute</TableHead>
                            <TableHead>Minutes Included</TableHead>
                            <TableHead>Currency</TableHead>
                            <TableHead>Created</TableHead>
                            {rowActionType !== 'none' && <TableHead className="w-[120px]">Action</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.length > 0 ? (
                            products.map((product) => (
                                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        {product.name}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {product.description || <span className="text-muted-foreground italic">No description</span>}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(product.base_price_cents, product.currency)}
                                    </TableCell>
                                    <TableCell>
                                        {formatCurrency(product.price_per_minute_cents, product.currency)}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {product.minutes_included} min
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {product.currency}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(product.created_at).toLocaleDateString()}
                                    </TableCell>
                                    {rowActionType !== 'none' && (
                                        <TableCell>
                                            {rowActionType === 'assign' && clientId && (
                                                <AssignProductButton 
                                                    product={product} 
                                                    clientId={clientId}
                                                />
                                            )}
                                            {rowActionType === 'unassign' && clientId && (
                                                <UnassignProductButton 
                                                    product={product} 
                                                    clientId={clientId}
                                                />
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={rowActionType !== 'none' ? 8 : 7} className="text-center py-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-muted-foreground">{emptyStateMessage}</span>
                                        <span className="text-sm text-muted-foreground">{emptyStateSubMessage}</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
