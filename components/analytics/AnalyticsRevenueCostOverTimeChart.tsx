'use client'

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

type RevenueCostDatum = {
    date: string
    label: string
    fullLabel?: string
    revenue: number
    cost: number
    profit?: number
}

interface AnalyticsRevenueCostOverTimeChartProps {
    data: RevenueCostDatum[]
    isLoading?: boolean
    currencyCode?: string
    currencyFormatter?: (value: number) => string
}

const chartConfig = {
    revenue: {
        label: 'Revenue',
        color: 'hsl(var(--chart-2))',
    },
    cost: {
        label: 'Cost',
        color: 'hsl(var(--chart-3))',
    },
} as const

export function AnalyticsRevenueCostOverTimeChart({
    data,
    isLoading,
    currencyCode,
    currencyFormatter,
}: AnalyticsRevenueCostOverTimeChartProps) {
    const hasData = useMemo(() => (data?.length ?? 0) > 0, [data])
    const showDots = useMemo(() => (data?.length ?? 0) <= 14, [data])

    const formatCurrency = (value: number) =>
        typeof currencyFormatter === 'function'
            ? currencyFormatter(value)
            : new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: currencyCode || 'USD',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              }).format(value)

    // Calculate the Y-axis domain with padding
    const yAxisDomain = useMemo(() => {
        if (!data || data.length === 0) return [0, 10]
        const maxRevenue = Math.max(...data.map(d => d.revenue))
        const maxCost = Math.max(...data.map(d => d.cost))
        const maxValue = Math.max(maxRevenue, maxCost)
        if (maxValue === 0) return [0, 10]
        // Add 10% padding to the top
        const maxWithPadding = maxValue * 1.1
        return [0, maxWithPadding]
    }, [data])

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Revenue vs Cost</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                {isLoading ? (
                    <Skeleton className="h-[280px] w-full" />
                ) : !hasData ? (
                    <p className="text-sm text-muted-foreground">No revenue or cost data found for the selected range.</p>
                ) : (
                    <ChartContainer config={chartConfig} className="h-[280px] w-full">
                        <AreaChart data={data} margin={{ left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                            <XAxis 
                                dataKey="label" 
                                tickLine={false} 
                                axisLine={false} 
                                tickMargin={8}
                                minTickGap={24}
                            />
                            <YAxis 
                                tickFormatter={(value) => formatCurrency(value).replace(/\.00$/, '')}
                                allowDecimals={false}
                                tickLine={false} 
                                axisLine={false}
                                width={40}
                                domain={yAxisDomain}
                            />
                            <ChartTooltip
                                content={({ active, payload }) => {
                                    if (!active || !payload?.length) return null
                                    
                                    const data = payload[0]?.payload as RevenueCostDatum | undefined
                                    if (!data) return null
                                    
                                    const profit = (data.revenue || 0) - (data.cost || 0)
                                    
                                    return (
                                        <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                                            <div className="font-medium text-foreground">{data.fullLabel ?? data.label}</div>
                                            <div className="grid gap-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                        style={{ backgroundColor: 'var(--color-revenue)' }}
                                                    />
                                                    <div className="flex flex-1 justify-between leading-none items-center gap-4">
                                                        <span className="text-muted-foreground">Revenue</span>
                                                        <span className="text-foreground font-mono font-medium tabular-nums">
                                                            {formatCurrency(data.revenue || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                                                        style={{ backgroundColor: 'var(--color-cost)' }}
                                                    />
                                                    <div className="flex flex-1 justify-between leading-none items-center gap-4">
                                                        <span className="text-muted-foreground">Cost</span>
                                                        <span className="text-foreground font-mono font-medium tabular-nums">
                                                            {formatCurrency(data.cost || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col gap-1 pt-1 border-t border-border/50">
                                                    <div className="flex flex-1 justify-between leading-none items-center gap-4 pl-[18px]">
                                                        <span className="text-muted-foreground font-semibold">Profit</span>
                                                        <span className={`font-mono font-semibold tabular-nums ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                            {formatCurrency(profit)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-end pl-[18px]">
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {data.revenue > 0 ? `${((profit / data.revenue) * 100).toFixed(1)}% margin` : '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="revenue"
                                stroke="var(--color-revenue)"
                                strokeWidth={2}
                                fill="var(--color-revenue)"
                                fillOpacity={0.2}
                                dot={showDots ? { r: 3 } : false}
                                activeDot={{ r: 4 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="cost"
                                stroke="var(--color-cost)"
                                strokeWidth={2}
                                fill="var(--color-cost)"
                                fillOpacity={0.2}
                                dot={showDots ? { r: 3 } : false}
                                activeDot={{ r: 4 }}
                            />
                            <ChartLegend content={<ChartLegendContent />} />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}
