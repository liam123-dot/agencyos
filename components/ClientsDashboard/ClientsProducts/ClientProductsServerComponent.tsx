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

// Simple currency formatter - defaults to USD
function formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount)
}

// Helper function to determine grid classes based on product count
function getGridClasses(productCount: number): string {
    if (productCount === 1) {
        return "grid-cols-1 max-w-md mx-auto"
    } else if (productCount === 2) {
        return "grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto"
    } else if (productCount === 3) {
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
    } else if (productCount === 4) {
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto"
    } else {
        // For 5+ products, use responsive grid that adapts well
        return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
    }
}

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

    // get the product associated with the subscription
    let interval: string | undefined;
    if (subscription) {
        interval = products.find(product => product.stripe_base_price_id === subscription.base_price_id)?.billing_interval
    }

    // Sort products by base price (monthly equivalent), then by per-minute price
    const sortedProducts = products.sort((a, b) => {
        // First sort by base price
        if (a.base_price_cents !== b.base_price_cents) {
            return a.base_price_cents - b.base_price_cents
        }
        // Then by per-minute price
        return a.price_per_minute_cents - b.price_per_minute_cents
    })

    return (
        <div className="space-y-8">
            {/* Current Plan Details */}
            {subscription ? (
                <CurrentPlanCard subscription={subscription} sortedProducts={sortedProducts} manageBillingButton={<ManageBillingButton />} interval={interval} />
            ) : null}
        
            {/* Products Grid - Only show if no subscription */}
            {!subscription && products.length > 0 ? (
                <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">Available Plans</h2>
                            <div className="text-sm text-muted-foreground">
                                {products.length} plan{products.length !== 1 ? 's' : ''} available
                            </div>
                        </div>
                        <div className={`grid gap-8 ${getGridClasses(sortedProducts.length)}`}>
                            {sortedProducts.map((product) => (
                                <ProductCard 
                                    key={product.id} 
                                    product={product} 
                                    subscription={subscription}
                                />
                            ))}
                        </div>
                    </div>
                ) : !subscription ? (
                    <div className="flex items-center justify-center min-h-[400px]">
                        <Card className="max-w-md w-full text-center py-16 px-8 shadow-lg">
                            <CardContent>
                                <div className="flex flex-col items-center gap-6">
                                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                                        <svg
                                            className="w-10 h-10 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                            />
                                        </svg>
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="text-xl font-semibold">No Plans Available</h3>
                                        <p className="text-muted-foreground leading-relaxed">
                                            We're currently setting up your available plans. Please check back soon or contact support if you need assistance.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null}
        </div>
    )
}

function CurrentPlanCard({ subscription, sortedProducts, manageBillingButton, interval }: { subscription: Subscription; sortedProducts: Product[]; manageBillingButton?: React.ReactNode; interval: string | undefined }) {
    // Find the current product details
    const currentProduct = sortedProducts.find(product => product.stripe_base_price_id === subscription.base_price_id)

    return (
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <CardTitle className="text-base font-medium">
                            Active Subscription
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs">
                            {currentProduct?.name || 'Current Plan'}
                        </Badge>
                    </div>
                    {manageBillingButton}
                </div>
            </CardHeader>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {/* Monthly Price */}
                    <div className="space-y-1">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Monthly Price</h3>
                        <div className="text-2xl font-bold text-primary">
                            {formatCurrency(subscription.base_amount_cents / 100, subscription.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Next billing: {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </p>
                    </div>
                    
                    {/* Included Minutes */}
                    <div className="space-y-1">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Included Minutes</h3>
                        <div className="text-2xl font-bold">
                            {subscription.minutes_included} min
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Per {interval}
                        </p>
                    </div>
                    
                    {/* Overage Rate */}
                    <div className="space-y-1">
                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overage Rate</h3>
                        <div className="text-2xl font-bold">
                            {formatCurrency((subscription.per_second_price_cents * 60) / 100, subscription.currency)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Per extra minute
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function ProductCard({ product, subscription }: { product: Product; subscription: Subscription | null }) {

    // Check if this product is the current subscription
    const isCurrentPlan = subscription && subscription.base_price_id === product.stripe_base_price_id
    const hasActiveSubscription = subscription !== null

    return (
        <Card className={`h-full flex flex-col transition-all duration-300 backdrop-blur-sm ${
            isCurrentPlan 
                ? 'border-2 border-green-600 shadow-lg bg-card/95' 
                : hasActiveSubscription 
                    ? 'opacity-70 hover:opacity-90 bg-card/80' 
                    : 'hover:shadow-xl hover:scale-[1.02] bg-card/90 border-border/50'
        }`}>
            <CardHeader className="pb-6 relative">
                {isCurrentPlan && (
                    <div className="absolute -top-3 -right-3 z-10">
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700 shadow-md px-3 py-1">
                            ✓ Current Plan
                        </Badge>
                    </div>
                )}
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-3 flex-1">
                            <CardTitle className="text-2xl font-bold">
                                {product.name}
                            </CardTitle>
                            <Badge variant="outline" className="w-fit text-xs font-medium px-2 py-1">
                                {product.currency.toUpperCase()}
                            </Badge>
                        </div>
                    </div>
                    {product.description && (
                        <CardDescription className="text-sm leading-relaxed text-muted-foreground/90">
                            {product.description}
                        </CardDescription>
                    )}
                </div>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col justify-between space-y-6 px-6 pb-6">
                <div className="space-y-6">
                    {/* Main pricing display */}
                    <div className="text-center space-y-2 py-4">
                        <div className="text-4xl font-bold text-primary">
                            {formatCurrency(product.base_price_cents / 100, product.currency)}
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">per {product.billing_interval}</div>
                    </div>
                    
                    {/* Pricing breakdown */}
                    <div className="space-y-1 bg-muted/30 rounded-lg p-4">
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-medium text-muted-foreground">Base {product.billing_interval.charAt(0).toUpperCase() + product.billing_interval.slice(1)}ly</span>
                            <span className="text-sm font-bold">
                                {formatCurrency(product.base_price_cents / 100, product.currency)}
                            </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-t border-border/30">
                            <span className="text-sm font-medium text-muted-foreground">Per Minute</span>
                            <span className="text-sm font-bold">
                                {formatCurrency(product.price_per_minute_cents / 100, product.currency)}
                            </span>
                        </div>
                    </div>
                    
                    {/* Included minutes highlight */}
                    <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">Included Minutes</span>
                            <Badge variant="secondary" className="font-bold bg-primary/20 text-primary border-primary/30">
                                {product.minutes_included} min
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Additional usage charged per minute
                        </p>
                    </div>
                </div>
                
                <SelectProductButton 
                    product={product} 
                    isDisabled={false}
                    isCurrentPlan={isCurrentPlan || false}
                    hasActiveSubscription={hasActiveSubscription}
                    currentProductPrice={subscription?.base_amount_cents || 0}
                />
            </CardContent>
        </Card>
    )
}
