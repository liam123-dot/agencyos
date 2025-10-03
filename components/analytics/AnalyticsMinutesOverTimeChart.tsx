'use client'

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

type MinutesOverTimeDatum = {
    date: string
    label: string
    fullLabel?: string
    totalMinutes: number
    totalSeconds: number
}

interface AnalyticsMinutesOverTimeChartProps {
    data: MinutesOverTimeDatum[]
    isLoading?: boolean
}

const chartConfig = {
    totalMinutes: {
        label: 'Total minutes',
        color: 'hsl(var(--chart-1))',
    },
} as const

const formatMinutes = (value: number) =>
    `${Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: value < 10 ? 1 : 0,
    })}`

export function AnalyticsMinutesOverTimeChart({ data, isLoading }: AnalyticsMinutesOverTimeChartProps) {
    const hasData = useMemo(() => (data?.length ?? 0) > 0, [data])
    const showDots = useMemo(() => (data?.length ?? 0) <= 14, [data])

    // Calculate the Y-axis domain with padding
    const yAxisDomain = useMemo(() => {
        if (!data || data.length === 0) return [0, 10]
        const maxMinutes = Math.max(...data.map(d => d.totalMinutes))
        if (maxMinutes === 0) return [0, 10]
        // Add 10% padding to the top
        const maxWithPadding = maxMinutes * 1.1
        return [0, Math.ceil(maxWithPadding)]
    }, [data])

    return (
        <Card className="h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Total Minutes Over Time</CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
                {isLoading ? (
                    <Skeleton className="h-[280px] w-full" />
                ) : !hasData ? (
                    <p className="text-sm text-muted-foreground">No call activity found for the selected range.</p>
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
                                tickFormatter={(value) => `${formatMinutes(value)}m`}
                                allowDecimals={false}
                                tickLine={false} 
                                axisLine={false}
                                width={40}
                                domain={yAxisDomain}
                            />
                            <ChartTooltip
                                cursor={{ strokeDasharray: '4 4' }}
                                content={(
                                    <ChartTooltipContent
                                        labelFormatter={(_, payload) => {
                                            const item = payload?.[0]?.payload as MinutesOverTimeDatum | undefined
                                            return item?.fullLabel ?? item?.label ?? ''
                                        }}
                                        formatter={(value) => (
                                            <div className="flex w-full justify-between">
                                                <span className="text-muted-foreground">Total minutes</span>
                                                <span className="text-foreground font-mono font-medium">
                                                    {formatMinutes(Number(value))}m
                                                </span>
                                            </div>
                                        )}
                                    />
                                )}
                            />
                            <Area
                                type="monotone"
                                dataKey="totalMinutes"
                                stroke="var(--color-totalMinutes)"
                                strokeWidth={2}
                                fill="var(--color-totalMinutes)"
                                fillOpacity={0.2}
                                dot={showDots ? { r: 3 } : false}
                                activeDot={{ r: 4 }}
                            />
                        </AreaChart>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
    )
}
