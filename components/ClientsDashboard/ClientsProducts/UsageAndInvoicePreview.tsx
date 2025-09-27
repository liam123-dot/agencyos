'use server'

import { getUser } from "@/app/api/user/getUser"
import { authorizedToAccessClient } from "@/app/api/clients/clientMembers"
import { getClientSubscriptions } from "@/app/api/clients/clientSubscriptions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import Stripe from "stripe"

export default async function UsageAndInvoicePreview({ clientId }: { clientId?: string }) {
    
    const { userData } = await getUser()
    if (!userData) {
        return null
    }
    
    if (!clientId) {
        clientId = userData.client_id
    }
    
    if (!clientId) {
        return null
    }

    const authorized = await authorizedToAccessClient(clientId)
    if (!authorized) {
        return null
    }
    const { supabaseServerClient, client } = authorized

    // Get subscription data
    const subscription = await getClientSubscriptions(clientId)
    if (!subscription) {
        return null // No subscription, no usage to show
    }

    // Get organization for Stripe API
    const { data: organization } = await supabaseServerClient
        .from('organizations')
        .select('*')
        .eq('id', client.organization_id)
        .single()

    if (!organization) {
        return null
    }

    const stripe = new Stripe(organization.stripe_api_key)

    try {
        // Get current usage from Stripe billing meter
        const usageData = await getCurrentUsage(stripe, subscription)
        const invoicePreview = await getInvoicePreview(stripe, subscription, usageData)
        
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <UsageCard subscription={subscription} usageData={usageData} />
                <InvoicePreviewCard subscription={subscription} invoicePreview={invoicePreview} />
            </div>
        )
    } catch (error) {
        console.error('Error fetching usage data:', error)
        return (
            <Card>
                <CardContent className="py-6">
                    <p className="text-muted-foreground text-center">
                        Unable to load usage data at this time.
                    </p>
                </CardContent>
            </Card>
        )
    }
}

async function getCurrentUsage(stripe: Stripe, subscription: any) {
    if (!subscription.billing_meter_id) {
        return { totalSeconds: 0, totalMinutes: 0 }
    }

    // Get usage for current billing period
    const periodStart = new Date(subscription.current_period_start).getTime() / 1000
    const periodEnd = new Date(subscription.current_period_end).getTime() / 1000

    try {
        const meterUsage = await stripe.billing.meters.listEventSummaries(
            subscription.billing_meter_id,
            {
                customer: subscription.stripe_customer_id,
                start_time: periodStart,
                end_time: periodEnd,
            }
        )

        const totalSeconds = meterUsage.data.reduce((sum, event) => sum + (event.aggregated_value || 0), 0)
        const totalMinutes = Math.round(totalSeconds / 60 * 100) / 100 // Round to 2 decimal places

        return { totalSeconds, totalMinutes }
    } catch (error) {
        console.error('Error fetching meter usage:', error)
        return { totalSeconds: 0, totalMinutes: 0 }
    }
}

async function getInvoicePreview(stripe: Stripe, subscription: any, usageData: any) {
    try {
        // Get upcoming invoice preview
        // @ts-expect-error - Stripe types may be outdated, but this method works
        const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
            customer: subscription.stripe_customer_id,
            subscription: subscription.stripe_subscription_id,
        })

        // Calculate usage charges
        const includedMinutes = subscription.minutes_included || 0
        const usedMinutes = usageData.totalMinutes
        const overageMinutes = Math.max(0, usedMinutes - includedMinutes)
        const overageCharges = overageMinutes * (subscription.per_second_price_cents * 60) / 100

        return {
            baseAmount: subscription.base_amount_cents / 100,
            usageAmount: overageCharges,
            totalAmount: upcomingInvoice.amount_due / 100,
            currency: subscription.currency,
            periodEnd: new Date(subscription.current_period_end),
            includedMinutes,
            usedMinutes,
            overageMinutes
        }
    } catch (error) {
        console.error('Error fetching invoice preview:', error)
        // Fallback calculation
        const includedMinutes = subscription.minutes_included || 0
        const usedMinutes = usageData.totalMinutes
        const overageMinutes = Math.max(0, usedMinutes - includedMinutes)
        const overageCharges = overageMinutes * (subscription.per_second_price_cents * 60) / 100
        
        return {
            baseAmount: subscription.base_amount_cents / 100,
            usageAmount: overageCharges,
            totalAmount: (subscription.base_amount_cents / 100) + overageCharges,
            currency: subscription.currency,
            periodEnd: new Date(subscription.current_period_end),
            includedMinutes,
            usedMinutes,
            overageMinutes
        }
    }
}

function DualProgressBar({ 
    includedUsed, 
    overageUsed, 
    includedTotal, 
    className 
}: { 
    includedUsed: number
    overageUsed: number
    includedTotal: number
    className?: string 
}) {
    const totalUsed = includedUsed + overageUsed
    const maxValue = Math.max(includedTotal, totalUsed)
    
    // Calculate percentages for display
    const includedPercentage = maxValue > 0 ? (Math.min(includedUsed, includedTotal) / maxValue) * 100 : 0
    const overagePercentage = maxValue > 0 ? (overageUsed / maxValue) * 100 : 0
    
    // Generate tooltip messages
    const includedTooltip = includedUsed >= includedTotal 
        ? `All ${includedTotal} included minutes used`
        : `${includedUsed.toFixed(1)} of ${includedTotal} included minutes used`
    
    const overageTooltip = `${overageUsed.toFixed(1)} minutes over included limit`
    
    return (
        <TooltipProvider>
            <div className={cn("bg-primary/20 relative h-3 w-full overflow-hidden rounded-full", className)}>
                {/* Included usage bar (first part) - Green */}
                {includedPercentage > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-green-500 h-full absolute left-0 top-0 transition-all cursor-pointer"
                                style={{ width: `${includedPercentage}%` }}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{includedTooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
                
                {/* Overage usage bar (second part) - Blue */}
                {overagePercentage > 0 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div
                                className="bg-blue-500 h-full absolute top-0 transition-all cursor-pointer"
                                style={{ 
                                    left: `${includedPercentage}%`,
                                    width: `${overagePercentage}%` 
                                }}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{overageTooltip}</p>
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </TooltipProvider>
    )
}

function UsageCard({ subscription, usageData }: { subscription: any, usageData: any }) {
    const includedMinutes = subscription.minutes_included || 0
    const usedMinutes = usageData.totalMinutes
    const usagePercentage = includedMinutes > 0 ? Math.min((usedMinutes / includedMinutes) * 100, 100) : 0
    const overageMinutes = Math.max(0, usedMinutes - includedMinutes)

    const formatCurrency = (cents: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(cents)
    }

    return (
        <Card className="h-fit">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Current Usage</CardTitle>
                <CardDescription className="text-sm">
                    Period ending {new Date(subscription.current_period_end).toLocaleDateString()}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Usage Summary */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                        <div className="text-2xl font-bold">{usedMinutes.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">minutes used</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm font-medium">{includedMinutes} included</div>
                        {overageMinutes > 0 && (
                            <div className="text-xs text-blue-600 font-medium">
                                +{overageMinutes.toFixed(1)} overage
                            </div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <DualProgressBar
                        includedUsed={Math.min(usedMinutes, includedMinutes)}
                        overageUsed={overageMinutes}
                        includedTotal={includedMinutes}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0 min</span>
                        <span className="text-center">
                            {includedMinutes} min included
                        </span>
                        {overageMinutes > 0 && (
                            <span className="text-blue-600 font-medium">
                                {usedMinutes.toFixed(1)} total
                            </span>
                        )}
                    </div>
                </div>

                {/* Overage Alert */}
                {overageMinutes > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-700">
                                Additional Usage Charges
                            </span>
                            <span className="font-bold text-blue-700">
                                {formatCurrency(overageMinutes * (subscription.per_second_price_cents * 60) / 100, subscription.currency)}
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency((subscription.per_second_price_cents * 60) / 100, subscription.currency)} per minute beyond included
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function InvoicePreviewCard({ subscription, invoicePreview }: { subscription: any, invoicePreview: any }) {
    const formatCurrency = (amount: number, currency: string) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount)
    }

    return (
        <Card className="h-fit">
            <CardHeader className="pb-4">
                <CardTitle className="text-lg">Next Invoice</CardTitle>
                <CardDescription className="text-sm">
                    Estimated for {invoicePreview.periodEnd.toLocaleDateString()}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Amount Highlight */}
                <div className="text-center p-4 bg-primary/5 border border-primary/20 rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                        {formatCurrency(invoicePreview.totalAmount, invoicePreview.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">estimated total</div>
                </div>

                {/* Breakdown */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Base plan</span>
                        <span className="font-medium">
                            {formatCurrency(invoicePreview.baseAmount, invoicePreview.currency)}
                        </span>
                    </div>
                    
                    {invoicePreview.usageAmount > 0 && (
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-sm text-muted-foreground">Usage overage</span>
                                <div className="text-xs text-muted-foreground">
                                    {invoicePreview.overageMinutes.toFixed(1)} extra minutes
                                </div>
                            </div>
                            <span className="font-medium text-blue-600">
                                +{formatCurrency(invoicePreview.usageAmount, invoicePreview.currency)}
                            </span>
                        </div>
                    )}
                </div>

                <div className="pt-2 border-t">
                    <div className="text-xs text-muted-foreground text-center">
                        Final amount may vary slightly
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
