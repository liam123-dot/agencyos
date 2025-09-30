'use server'

import { redirect } from "next/navigation";
import { getUser } from "../user/getUser"
import {
    addDays,
    addHours,
    addMonths,
    addWeeks,
    format,
    startOfDay,
    startOfHour,
    startOfMonth,
    startOfWeek,
} from "date-fns"

type Granularity = 'hour' | 'day' | 'week' | 'month'

export async function getAnalytics({clientId, dateRangeStart, dateRangeEnd, agentId, granularity}: {clientId?: string, dateRangeStart?: string, dateRangeEnd?: string, agentId?: string, granularity?: Granularity}) {

    const { userData, supabaseServerClient } = await getUser()
    
    if (!clientId) {
        clientId = userData.client_id;
        if (!clientId) {
            redirect('/auth')
        }
    }
    
    // Defaults: last 7 days
    if (!dateRangeEnd) {
        dateRangeEnd = new Date().toISOString().split('T')[0]
    }
    if (!dateRangeStart) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
        dateRangeStart = sevenDaysAgo.toISOString().split('T')[0]
    }
    const resolvedGranularity: Granularity = granularity || 'day'

    // if no agent id, get all

    console.log(clientId, dateRangeStart, dateRangeEnd, agentId, granularity)

    const query = supabaseServerClient
        .from('calls')
        .select('*')
        .eq('client_id', clientId)
        .gte('created_at', dateRangeStart)
        // include the entire end day by going to the next day and using lt
        .lt('created_at', addDays(new Date(dateRangeEnd), 1).toISOString())

    if (agentId) {
        query.eq('agent_id', agentId)
    }

    // console.log(query)

    const { data: calls, error: callsError } = await query;

    if (callsError) {
        throw new Error('Failed to fetch calls')
    }

    // Build time buckets across the selected range
    const startDate = startOfDay(new Date(dateRangeStart))
    const endDateExclusive = addDays(startOfDay(new Date(dateRangeEnd)), 1)

    const increment = (d: Date): Date => {
        switch (resolvedGranularity) {
            case 'hour':
                return addHours(d, 1)
            case 'week':
                return addWeeks(d, 1)
            case 'month':
                return addMonths(d, 1)
            case 'day':
            default:
                return addDays(d, 1)
        }
    }

    const normalize = (d: Date): Date => {
        switch (resolvedGranularity) {
            case 'hour':
                return startOfHour(d)
            case 'week':
                // week starts on Monday
                return startOfWeek(d, { weekStartsOn: 1 })
            case 'month':
                return startOfMonth(d)
            case 'day':
            default:
                return startOfDay(d)
        }
    }

    const labelFor = (d: Date): string => {
        switch (resolvedGranularity) {
            case 'hour':
                return format(d, 'MMM d, HH:00')
            case 'week':
                return `${format(d, 'MMM d')} - ${format(addDays(d, 6), 'MMM d')}`
            case 'month':
                return format(d, 'MMM yyyy')
            case 'day':
            default:
                return format(d, 'MMM d')
        }
    }

    // Prepare a map for counts
    const bucketCounts = new Map<string, number>()

    // Initialize all buckets to 0
    const buckets: { date: string; label: string }[] = []
    for (let cursor = normalize(startDate); cursor < endDateExclusive; cursor = increment(cursor)) {
        const key = normalize(cursor).toISOString()
        bucketCounts.set(key, 0)
        buckets.push({ date: key, label: labelFor(cursor) })
    }

    // Count calls into buckets
    for (const call of calls || []) {
        const createdAt = new Date(call.created_at)
        const normalized = normalize(createdAt)
        const key = normalized.toISOString()
        if (bucketCounts.has(key)) {
            bucketCounts.set(key, (bucketCounts.get(key) || 0) + 1)
        }
    }

    const timeseries = buckets.map((b) => ({
        date: b.date,
        label: b.label,
        count: bucketCounts.get(b.date) || 0,
    }))

    const totalDurationSeconds = (calls || []).reduce((sum: number, call: any) => {
        const seconds = typeof call?.seconds === 'number' ? call.seconds : 0
        return sum + (Number.isFinite(seconds) ? seconds : 0)
    }, 0)
    const totalCalls = calls?.length || 0
    const averageDurationSeconds = totalCalls > 0 ? Math.round(totalDurationSeconds / totalCalls) : 0

    return {
        totals: {
            totalCalls,
            totalDurationSeconds,
            averageDurationSeconds,
        },
        timeseries,
        filters: {
            clientId,
            agentId,
            granularity: resolvedGranularity,
            dateRange: {
                start: dateRangeStart,
                end: dateRangeEnd,
            },
        },
    }
}
