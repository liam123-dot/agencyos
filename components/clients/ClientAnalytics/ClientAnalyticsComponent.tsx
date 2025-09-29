'use client'

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getAnalytics } from "@/app/api/analytics/getAnalytics"
import { getClientAgents } from "@/app/api/agents/getClientAgents"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format as formatDate, differenceInCalendarDays, differenceInCalendarMonths, parseISO } from "date-fns"

type Granularity = 'hour' | 'day' | 'week' | 'month'

interface AgentOption { id: string; name: string }

interface AnalyticsData {
    totals: {
        totalCalls: number
        totalDurationSeconds?: number
        averageDurationSeconds?: number
    }
    timeseries: { date: string; label: string; count: number }[]
    filters: {
        clientId?: string
        agentId?: string
        granularity: Granularity
        dateRange: { start: string; end: string }
    }
}

interface ClientAnalyticsComponentProps {
    searchParams?: Record<string, string | string[] | undefined>
}

export default function ClientAnalyticsComponent({ searchParams: initialSearchParams }: ClientAnalyticsComponentProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const clientId = searchParams.get('client_id') || (
        Array.isArray(initialSearchParams?.client_id) 
            ? initialSearchParams?.client_id[0] 
            : initialSearchParams?.client_id
    ) || undefined

    // Helper function to parse date from URL param
    const parseUrlDate = (dateStr: string | string[] | undefined): Date | undefined => {
        if (!dateStr || Array.isArray(dateStr)) return undefined
        try {
            const parsed = new Date(dateStr + 'T00:00:00')
            return isNaN(parsed.getTime()) ? undefined : parsed
        } catch {
            return undefined
        }
    }

    // Helper function to update URL params
    const updateUrlParams = (updates: Record<string, string | undefined>) => {
        const params = new URLSearchParams(searchParams.toString())
        
        Object.entries(updates).forEach(([key, value]) => {
            if (value === undefined || value === '') {
                params.delete(key)
            } else {
                params.set(key, value)
            }
        })
        
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    // Defaults: last 7 days, daily granularity
    const today = useMemo(() => new Date(), [])
    const sevenDaysAgo = useMemo(() => {
        const d = new Date()
        d.setDate(d.getDate() - 6)
        return d
    }, [])

    // Initialize state from URL params or defaults
    const getInitialDateStart = () => {
        const urlDate = parseUrlDate(searchParams.get('start_date') || initialSearchParams?.start_date)
        return urlDate || sevenDaysAgo
    }
    
    const getInitialDateEnd = () => {
        const urlDate = parseUrlDate(searchParams.get('end_date') || initialSearchParams?.end_date)
        return urlDate || today
    }
    
    const getInitialGranularity = (): Granularity => {
        const urlGranularity = searchParams.get('granularity') || (
            Array.isArray(initialSearchParams?.granularity) 
                ? initialSearchParams?.granularity[0] 
                : initialSearchParams?.granularity
        )
        return (urlGranularity === 'hour' || urlGranularity === 'day' || urlGranularity === 'week' || urlGranularity === 'month') 
            ? urlGranularity 
            : 'day'
    }
    
    const getInitialAgentId = () => {
        const urlAgentId = searchParams.get('agent_id') || (
            Array.isArray(initialSearchParams?.agent_id) 
                ? initialSearchParams?.agent_id[0] 
                : initialSearchParams?.agent_id
        )
        return Array.isArray(urlAgentId) ? undefined : urlAgentId || undefined
    }

    const [dateRangeStart, setDateRangeStartState] = useState<Date | undefined>(getInitialDateStart())
    const [dateRangeEnd, setDateRangeEndState] = useState<Date | undefined>(getInitialDateEnd())
    const [granularity, setGranularityState] = useState<Granularity>(getInitialGranularity())
    const [agentId, setAgentIdState] = useState<string | undefined>(getInitialAgentId())
    const [agents, setAgents] = useState<AgentOption[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)

    // Wrapper functions that update both state and URL
    const setDateRangeStart = (date: Date | undefined) => {
        setDateRangeStartState(date)
        // Update URL immediately
        const params = new URLSearchParams(searchParams.toString())
        if (date) {
            params.set('start_date', formatDate(date, 'yyyy-MM-dd'))
        } else {
            params.delete('start_date')
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    const setDateRangeEnd = (date: Date | undefined) => {
        setDateRangeEndState(date)
        // Update URL immediately
        const params = new URLSearchParams(searchParams.toString())
        if (date) {
            params.set('end_date', formatDate(date, 'yyyy-MM-dd'))
        } else {
            params.delete('end_date')
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    const setGranularity = (newGranularity: Granularity) => {
        setGranularityState(newGranularity)
        // Update URL immediately
        const params = new URLSearchParams(searchParams.toString())
        params.set('granularity', newGranularity)
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    const setAgentId = (newAgentId: string | undefined) => {
        setAgentIdState(newAgentId)
        // Update URL immediately
        const params = new URLSearchParams(searchParams.toString())
        if (newAgentId) {
            params.set('agent_id', newAgentId)
        } else {
            params.delete('agent_id')
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    // Batch URL update function for multiple parameters
    const setBatchDateRange = (startDate: Date | undefined, endDate: Date | undefined) => {
        setDateRangeStartState(startDate)
        setDateRangeEndState(endDate)
        // Update URL with both dates at once
        const params = new URLSearchParams(searchParams.toString())
        if (startDate) {
            params.set('start_date', formatDate(startDate, 'yyyy-MM-dd'))
        } else {
            params.delete('start_date')
        }
        if (endDate) {
            params.set('end_date', formatDate(endDate, 'yyyy-MM-dd'))
        } else {
            params.delete('end_date')
        }
        router.replace(`?${params.toString()}`, { scroll: false })
    }

    // Fetch agents (client-scoped)
    useEffect(() => {
        let mounted = true
        ;(async () => {
            try {
                const agentList = await getClientAgents(clientId)
                if (!mounted) return
                const options: AgentOption[] = (agentList || []).map((a: any) => ({
                    id: a.id,
                    name: a?.data?.name || 'Unnamed Agent',
                }))
                setAgents(options)
            } catch (err) {
                console.error('Failed to fetch agents', err)
            }
        })()
        return () => {
            mounted = false
        }
    }, [clientId])

    const fetchAnalytics = async () => {
        if (!dateRangeStart || !dateRangeEnd) return
        setIsLoading(true)
        try {
            // Format using local date, not UTC, to avoid shifting the day
            const startDate = formatDate(dateRangeStart, 'yyyy-MM-dd')
            const endDate = formatDate(dateRangeEnd, 'yyyy-MM-dd')
            const analytics = await getAnalytics({
                clientId,
                dateRangeStart: startDate,
                dateRangeEnd: endDate,
                agentId,
                granularity,
            })
            setAnalyticsData(analytics as AnalyticsData)
        } catch (error) {
            console.error('Failed to fetch analytics:', error)
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-fetch whenever filters change
    useEffect(() => {
        fetchAnalytics()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRangeStart, dateRangeEnd, agentId, granularity, clientId])

    const chartConfig = {
        calls: {
            label: 'Calls',
            color: 'hsl(var(--primary))',
        },
    } as const

    // Dynamically compute allowed granularities based on the selected range length
    const allowedGranularities = useMemo((): Granularity[] => {
        if (!dateRangeStart || !dateRangeEnd) return ['hour']
        const start = new Date(dateRangeStart.getFullYear(), dateRangeStart.getMonth(), dateRangeStart.getDate())
        const end = new Date(dateRangeEnd.getFullYear(), dateRangeEnd.getMonth(), dateRangeEnd.getDate())
        const inclusiveDays = differenceInCalendarDays(end, start) + 1
        const monthSpan = differenceInCalendarMonths(end, start)

        const allowed: Granularity[] = ['hour']
        if (inclusiveDays >= 2) allowed.push('day')
        if (inclusiveDays >= 14) allowed.push('week')
        if (monthSpan >= 2 || inclusiveDays >= 60) allowed.push('month')
        return allowed
    }, [dateRangeStart, dateRangeEnd])

    // Clamp granularity to an allowed option when range changes
    useEffect(() => {
        if (!allowedGranularities.includes(granularity)) {
            setGranularity(allowedGranularities[0])
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowedGranularities.join(',')])

    const formatDuration = (seconds?: number) => {
        const s = Math.max(0, Math.floor(seconds || 0))
        const mPart = Math.floor(s / 60)
        const sPart = s % 60
        return `${mPart}m ${sPart}s`
    }

    const formatTooltipDateTime = (dateString: string, currentGranularity: Granularity) => {
        const date = parseISO(dateString)
        
        switch (currentGranularity) {
            case 'hour':
                return formatDate(date, 'EEEE, MMM d, yyyy \'at\' HH:00')
            case 'day':
                return formatDate(date, 'EEEE, MMM d, yyyy')
            case 'week':
                const weekEnd = new Date(date)
                weekEnd.setDate(date.getDate() + 6)
                return `Week of ${formatDate(date, 'MMM d')} - ${formatDate(weekEnd, 'MMM d, yyyy')}`
            case 'month':
                return formatDate(date, 'MMMM yyyy')
            default:
                return formatDate(date, 'MMM d, yyyy')
        }
    }

    const CustomTooltipContent = ({ active, payload, label }: any) => {
        if (!active || !payload?.length) return null
        
        const data = payload[0]?.payload
        if (!data) return null
        
        const formattedDateTime = formatTooltipDateTime(data.date, granularity)
        
        return (
            <div className="border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl">
                <div className="font-medium text-foreground">{formattedDateTime}</div>
                <div className="flex items-center gap-2">
                    <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                        style={{ backgroundColor: 'hsl(var(--primary))' }}
                    />
                    <div className="flex flex-1 justify-between leading-none items-center">
                        <span className="text-muted-foreground">Calls</span>
                        <span className="text-foreground font-mono font-medium tabular-nums">
                            {data.count.toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-full overflow-x-hidden">
            <Card>
                <CardHeader className="pb-0">
                    <CardTitle className="text-base">Filters</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap md:gap-4">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Start date</span>
                            <DatePicker
                                date={dateRangeStart}
                                onDateChange={setDateRangeStart}
                                placeholder="Start date"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">End date</span>
                            <DatePicker
                                date={dateRangeEnd}
                                onDateChange={setDateRangeEnd}
                                placeholder="End date"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Quick ranges</span>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    className="text-xs rounded-md border px-2 py-1 hover:bg-accent"
                                    onClick={() => {
                                        const now = new Date()
                                        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
                                        setBatchDateRange(startOfDay, now)
                                    }}
                                >
                                    Today
                                </button>
                                <button
                                    className="text-xs rounded-md border px-2 py-1 hover:bg-accent"
                                    onClick={() => {
                                        const now = new Date()
                                        const yesterday = new Date(now)
                                        yesterday.setDate(now.getDate() - 1)
                                        const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
                                        const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59)
                                        setBatchDateRange(startOfYesterday, endOfYesterday)
                                    }}
                                >
                                    Yesterday
                                </button>
                                <button
                                    className="text-xs rounded-md border px-2 py-1 hover:bg-accent"
                                    onClick={() => {
                                        const end = new Date()
                                        const start = new Date()
                                        start.setDate(end.getDate() - 6)
                                        const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
                                        setBatchDateRange(startOfDay, end)
                                    }}
                                >
                                    Last 7 days
                                </button>
                                <button
                                    className="text-xs rounded-md border px-2 py-1 hover:bg-accent"
                                    onClick={() => {
                                        const end = new Date()
                                        const start = new Date()
                                        start.setDate(end.getDate() - 29)
                                        const startOfDay = new Date(start.getFullYear(), start.getMonth(), start.getDate())
                                        setBatchDateRange(startOfDay, end)
                                    }}
                                >
                                    Last 30 days
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Agent</span>
                            <Select
                                value={agentId}
                                onValueChange={(value) => setAgentId(value === 'all' ? undefined : value)}
                            >
                                <SelectTrigger className="w-[260px]">
                                    <SelectValue placeholder="All agents" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All agents</SelectItem>
                                    {agents.map((a) => (
                                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">Granularity</span>
                            <ToggleGroup
                                type="single"
                                value={granularity}
                                onValueChange={(v) => setGranularity((v as Granularity) || 'day')}
                                className="bg-muted/40"
                                variant="outline"
                            >
                                <ToggleGroupItem value="hour" disabled={!allowedGranularities.includes('hour')}>Hour</ToggleGroupItem>
                                <ToggleGroupItem value="day" disabled={!allowedGranularities.includes('day')}>Day</ToggleGroupItem>
                                <ToggleGroupItem value="week" disabled={!allowedGranularities.includes('week')}>Week</ToggleGroupItem>
                                <ToggleGroupItem value="month" disabled={!allowedGranularities.includes('month')}>Month</ToggleGroupItem>
                            </ToggleGroup>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Total calls</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-24" />
                        ) : (
                            <div className="text-3xl font-semibold">
                                {analyticsData?.totals.totalCalls ?? 0}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Total duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-32" />
                        ) : (
                            <div className="text-3xl font-semibold">
                                {formatDuration(analyticsData?.totals.totalDurationSeconds)}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Avg. duration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <Skeleton className="h-8 w-28" />
                        ) : (
                            <div className="text-3xl font-semibold">
                                {formatDuration(analyticsData?.totals.averageDurationSeconds)}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Calls over time</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-[280px] w-full" />
                    ) : (
                        <ChartContainer config={chartConfig} className="h-[280px] w-full">
                            <AreaChart data={analyticsData?.timeseries || []} margin={{ left: 12, right: 12 }}>
                            <CartesianGrid vertical={false} strokeDasharray="4 4" />
                            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                            <YAxis width={40} allowDecimals={false} tickLine={false} axisLine={false} />
                            <ChartTooltip content={<CustomTooltipContent />} />
                            <Area type="monotone" dataKey="count" stroke="var(--color-calls)" fill="var(--color-calls)" fillOpacity={0.2} />
                            </AreaChart>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
