'use server'


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Product } from "@/app/api/products/productType"
import { getClientProducts } from "@/app/api/clients/getClientProducts"
import { getUser } from "@/app/api/user/getUser"
import SelectProductButton from "./SelectProductButton"
import { getClientSubscriptions } from "@/app/api/clients/clientSubscriptions"
import { Subscription } from "@/app/api/clients/subscriptionType"
import ManageBillingButton from "./ManageBillingButton"

export async function ClientProductsServerComponent({ clientId }: { clientId?: string }) {
    
    const { userData } = await getUser()
    if (!userData) {
        throw new Error('User not found')
    }
    if (!clientId) {
        clientId = userData.client_id
    }
    if (!clientId) {
        throw new Error('Client ID is required')
    }
    const products = await getClientProducts(clientId)
    const subscription = await getClientSubscriptions(clientId)

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Your Plans & Services</h1>
                    <p className="text-muted-foreground">
                        Manage your subscription and explore our available plans and services.
                    </p>
                </div>
                {subscription && (
                    <div className="flex-shrink-0">
                        <ManageBillingButton />
                    </div>
                )}
            </div>
            
            {products.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <ProductCard 
                                key={product.id} 
                                product={product} 
                                subscription={subscription}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <Card className="text-center py-12">
                    <CardContent>
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                                <svg
                                    className="w-8 h-8 text-muted-foreground"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                    />
                                </svg>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-lg font-semibold">No products available</h3>
                                <p className="text-muted-foreground">
                                    There are currently no products available. Please check back later.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function ProductCard({ product, subscription }: { product: Product; subscription: Subscription | null }) {
    const formatCurrency = (cents: number, currency: string) => {
        const amount = cents / 100
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    // Check if this product is the current subscription
    const isCurrentPlan = subscription && subscription.base_price_id === product.stripe_base_price_id
    const hasActiveSubscription = subscription !== null

    return (
        <Card className={`h-full flex flex-col hover:shadow-lg transition-shadow duration-200 ${
            hasActiveSubscription && !isCurrentPlan ? 'opacity-60' : ''
        }`}>
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl">{product.name}</CardTitle>
                            {isCurrentPlan && (
                                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                    Current Plan
                                </Badge>
                            )}
                        </div>
                        <Badge variant="outline" className="w-fit">
                            {product.currency}
                        </Badge>
                    </div>
                </div>
                {product.description && (
                    <CardDescription className="text-sm leading-relaxed">
                        {product.description}
                    </CardDescription>
                )}
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Monthly Base</span>
                            <span className="text-lg font-bold">
                                {formatCurrency(product.base_price_cents, product.currency)}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-muted-foreground">Per Minute</span>
                            <span className="text-sm font-semibold">
                                {formatCurrency(product.price_per_minute_cents, product.currency)}
                            </span>
                        </div>
                    </div>
                    
                    <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Included Minutes</span>
                            <Badge variant="secondary" className="font-semibold">
                                {product.minutes_included} min
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Additional usage charged per minute
                        </p>
                    </div>
                </div>
                
                <SelectProductButton 
                    product={product} 
                    isDisabled={hasActiveSubscription && !isCurrentPlan}
                    isCurrentPlan={isCurrentPlan || false}
                />
            </CardContent>
        </Card>
    )
}
