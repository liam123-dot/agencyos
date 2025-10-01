'use client'

import { Fragment, useState } from "react";
import { Phone, ChevronRight, TrendingUp, DollarSign, Percent } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Agent {
    id: string;
    platform_id: string;
    platform: string;
    data: any;
}

interface Client {
    id: string;
    name: string;
    email: string;
}

interface Subscription {
    id: string;
    per_second_price_cents: number;
    base_amount_cents: number;
    minutes_included: number;
    currency: string;
}

interface CallWithAnalytics {
    id: string;
    agent_id: string | null;
    client_id: string;
    organization_id: string;
    seconds: number;
    data: any;
    created_at: string;
    updated_at: string;
    agents: Agent | null;
    clients: Client | null;
    subscriptions: Subscription | null;
    cost: number;
    revenue: number;
    margin: number;
    costInLocalCurrency: number;
    currency: string;
}

interface AnalyticsData {
    calls: CallWithAnalytics[];
    totals: {
        totalCost: number;
        totalRevenue: number;
        totalMargin: number;
        totalCalls: number;
        averageMargin: number;
        marginPercentage: number;
    };
}

interface AnalyticsCallsComponentProps {
    analyticsData: AnalyticsData;
}

export function AnalyticsCallsComponent({ analyticsData }: AnalyticsCallsComponentProps) {
    const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode.toUpperCase(),
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        } catch (error) {
            // Fallback if currency code is invalid
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(amount);
        }
    };

    const getAgentName = (agent: Agent | null) => {
        if (!agent) return 'Unknown Agent';
        if (agent.platform === 'vapi' && agent.data?.name) {
            return agent.data.name;
        }
        return `Agent ${agent.platform_id.slice(-8)}`;
    };

    const getCallStatus = (callData: any) => {
        if (callData?.status) {
            return typeof callData.status === 'string' ? callData.status : String(callData.status);
        }
        return 'completed';
    };

    const getStatusStyles = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return {
                    dot: 'bg-emerald-500',
                    badge: 'bg-emerald-50 text-emerald-600',
                };
            case 'failed':
                return {
                    dot: 'bg-rose-500',
                    badge: 'bg-rose-50 text-rose-600',
                };
            case 'in progress':
                return {
                    dot: 'bg-amber-400',
                    badge: 'bg-amber-50 text-amber-600',
                };
            default:
                return {
                    dot: 'bg-slate-400',
                    badge: 'bg-slate-100 text-slate-600',
                };
        }
    };

    const getMarginStyles = (margin: number) => {
        if (margin > 0) {
            return 'text-emerald-600 font-semibold';
        } else if (margin < 0) {
            return 'text-rose-600 font-semibold';
        }
        return 'text-slate-600';
    };

    const toggleExpandedRow = (callId: string) => {
        setExpandedCallId((prev) => (prev === callId ? null : callId));
    };

    const getPhoneDisplay = (callData: any) => {
        if (callData?.type === 'webCall') {
            return 'Web Call';
        }
        return callData?.customer?.number || 'Unknown';
    };

    const getTranscriptEntries = (callData: any, agentLabel: string) => {
        const entries: { speaker: string; content: string; id: string | number; time?: string }[] = [];
        const assistantRoles = new Set(["assistant", "assistant_message", "bot", "ai", "agent", "assistantresponse", "assistant_response", "assistantoutput"]);
        const customerRoles = new Set(["user", "customer", "caller", "human", "client", "customer_message", "user_message", "customerresponse"]);

        if (Array.isArray(callData?.messages)) {
            callData.messages.forEach((msg: any, index: number) => {
                const rawContent = msg?.message ?? msg?.content;
                const content = typeof rawContent === 'string' ? rawContent.trim() : '';
                if (!content) {
                    return;
                }

                const rawRole = msg?.role ?? msg?.speaker ?? msg?.source;
                const role = typeof rawRole === 'string' ? rawRole.toLowerCase() : '';
                const timestamp = msg?.timestamp ?? msg?.time ?? msg?.created_at;
                const timeLabel = typeof timestamp === 'string' && timestamp.trim().length > 0 ? timestamp : undefined;

                let speaker: string | null = null;
                if (assistantRoles.has(role)) {
                    speaker = agentLabel || 'Agent';
                } else if (customerRoles.has(role)) {
                    speaker = 'Customer';
                }

                if (!speaker) {
                    return;
                }

                entries.push({
                    speaker,
                    content,
                    id: msg?.id ?? `${role || 'entry'}-${index}`,
                    time: timeLabel,
                });
            });
        }

        if (entries.length === 0 && typeof callData?.transcript === 'string' && callData.transcript.trim().length > 0) {
            entries.push({
                speaker: agentLabel || 'Transcript',
                content: callData.transcript.trim(),
                id: 'transcript',
            });
        }

        return entries;
    };

    const { calls, totals } = analyticsData;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                        <Phone className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalCalls}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalRevenue, 'USD')}</div>
                        <p className="text-xs text-muted-foreground mt-1">USD equivalent</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                        <DollarSign className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">{formatCurrency(totals.totalCost, 'USD')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Vapi charges (USD)</p>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Margin</p>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", getMarginStyles(totals.totalMargin))}>
                            {formatCurrency(totals.totalMargin, 'USD')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {totals.marginPercentage.toFixed(1)}% margin
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Calls Table */}
            <Card className="border-border/60 shadow-sm">
                <CardHeader className="border-b border-border/60">
                    <div>
                        <h2 className="text-xl font-semibold">Call Details</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Detailed breakdown of all calls with cost and revenue analysis
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {calls.length === 0 ? (
                        <div className="p-12 text-center">
                            <Phone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No calls found</h3>
                            <p className="text-muted-foreground text-sm">
                                Call data will appear here once calls are made
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px] px-6">Agent</TableHead>
                                    <TableHead className="w-[180px] px-4">Client</TableHead>
                                    <TableHead className="w-[120px] px-4">Duration</TableHead>
                                    <TableHead className="w-[100px] px-4 text-right">Cost</TableHead>
                                    <TableHead className="w-[100px] px-4 text-right">Revenue</TableHead>
                                    <TableHead className="w-[100px] px-4 text-right">Margin</TableHead>
                                    <TableHead className="w-[100px] px-6 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calls.map((call) => {
                                    const status = getCallStatus(call.data);
                                    const agentName = getAgentName(call.agents);
                                    const duration = formatDuration(call.seconds);
                                    const timeAgo = formatDistanceToNow(new Date(call.created_at), { addSuffix: true });
                                    const statusStyles = getStatusStyles(status);
                                    const isExpanded = expandedCallId === call.id;

                                    const callType = call.data.call?.type;
                                    let type;
                                    if (callType === 'webCall') {
                                        type = 'Web Call';
                                    } else if (callType === 'inboundPhoneCall') {
                                        type = 'Inbound Phone Call';
                                    } else if (callType === 'outboundPhoneCall') {
                                        type = 'Outbound Phone Call';
                                    } else {
                                        type = 'Unknown';
                                    }

                                    const phoneDisplay = getPhoneDisplay(call.data);
                                    const description = call.data.analysis?.summary;
                                    const outcome = call.data.endedReason;
                                    const transcript = getTranscriptEntries(call.data, agentName);

                                    return (
                                        <Fragment key={call.id}>
                                            <TableRow
                                                onClick={() => toggleExpandedRow(call.id)}
                                                data-state={isExpanded ? "selected" : undefined}
                                                className={cn(
                                                    "cursor-pointer transition hover:bg-slate-50",
                                                    isExpanded && "bg-slate-50"
                                                )}
                                            >
                                                <TableCell className="px-6 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                toggleExpandedRow(call.id);
                                                            }}
                                                            aria-expanded={isExpanded}
                                                            aria-label={isExpanded ? "Collapse details" : "Expand details"}
                                                            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                                                        >
                                                            <ChevronRight
                                                                className={cn(
                                                                    "h-4 w-4 transition-transform",
                                                                    isExpanded && "rotate-90"
                                                                )}
                                                            />
                                                        </button>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-semibold text-slate-900">{agentName}</span>
                                                            <span className="text-xs text-slate-500">{timeAgo}</span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 align-middle">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium text-slate-900">
                                                            {call.clients?.name || 'Unknown'}
                                                        </span>
                                                        <span className="text-xs text-slate-500">
                                                            {call.clients?.email || ''}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 text-sm text-slate-600 align-middle">{duration}</TableCell>
                                                <TableCell className="px-4 text-sm text-slate-600 align-middle text-right">
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-rose-600 font-medium">{formatCurrency(call.costInLocalCurrency, call.currency)}</span>
                                                        {call.currency.toLowerCase() !== 'usd' && (
                                                            <span className="text-xs text-slate-400">{formatCurrency(call.cost, 'USD')}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 text-sm text-slate-600 align-middle text-right">
                                                    <span className="text-emerald-600 font-medium">{formatCurrency(call.revenue, call.currency)}</span>
                                                </TableCell>
                                                <TableCell className="px-4 text-sm align-middle text-right">
                                                    <span className={getMarginStyles(call.margin)}>{formatCurrency(call.margin, call.currency)}</span>
                                                </TableCell>
                                                <TableCell className="px-6 text-right align-middle">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            toggleExpandedRow(call.id);
                                                        }}
                                                        className="ml-auto h-9 rounded-full px-3 text-sm font-medium text-blue-600 hover:bg-blue-50"
                                                    >
                                                        {isExpanded ? "Hide" : "View"}
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            {isExpanded && (
                                                <TableRow className="bg-slate-50/70">
                                                    <TableCell colSpan={7} className="px-6 pb-6 pt-4">
                                                        <div className="flex flex-col gap-5 text-sm text-slate-600">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                {type && (
                                                                    <Badge variant="secondary" className="rounded-full bg-slate-200/80 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                                                                        {type}
                                                                    </Badge>
                                                                )}
                                                                <Badge variant="secondary" className="rounded-full bg-slate-200/80 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                                                                    Call #{call.id.slice(-8)}
                                                                </Badge>
                                                                <Badge variant="secondary" className="rounded-full bg-slate-200/80 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                                                                    Duration {duration}
                                                                </Badge>
                                                                <Badge variant="secondary" className="rounded-full bg-slate-200/80 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                                                                    {phoneDisplay}
                                                                </Badge>
                                                                {call.subscriptions ? (
                                                                    <Badge variant="secondary" className="rounded-full bg-emerald-100 text-[11px] font-medium uppercase tracking-wide text-emerald-700">
                                                                        {formatCurrency((call.subscriptions.per_second_price_cents / 100), call.currency)}/sec
                                                                    </Badge>
                                                                ) : (
                                                                    <Badge variant="secondary" className="rounded-full bg-amber-100 text-[11px] font-medium uppercase tracking-wide text-amber-700">
                                                                        No Subscription
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)]">
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold uppercase text-slate-500">Summary</p>
                                                                    <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 text-pretty">
                                                                        {description || "No summary captured for this call."}
                                                                    </p>
                                                                    <div className="space-y-2">
                                                                        <p className="text-xs font-semibold uppercase text-slate-500">Transcript</p>
                                                                        {transcript.length > 0 ? (
                                                                            <ScrollArea className="h-60 rounded-xl border border-slate-200 bg-white">
                                                                                <ol className="divide-y divide-slate-100 text-sm">
                                                                                    {transcript.map((entry) => (
                                                                                        <li key={entry.id} className="grid gap-2 px-4 py-3">
                                                                                            <div className="flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                                                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px]">
                                                                                                    {entry.speaker}
                                                                                                </span>
                                                                                                {entry.time && (
                                                                                                    <span className="text-[10px] font-medium capitalize text-slate-400">
                                                                                                        {entry.time}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="break-words leading-relaxed text-slate-700 text-wrap">
                                                                                                {entry.content}
                                                                                            </p>
                                                                                        </li>
                                                                                    ))}
                                                                                </ol>
                                                                                <ScrollBar orientation="vertical" />
                                                                            </ScrollArea>
                                                                        ) : (
                                                                            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                                                                Transcript unavailable for this call.
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-semibold uppercase text-slate-500">Financial Details</p>
                                                                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                                                        <dl className="space-y-3">
                                                                            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                                                                                <dt className="text-xs text-slate-500">Vapi Cost ({call.currency.toUpperCase()})</dt>
                                                                                <dd className="text-sm font-semibold text-rose-600">
                                                                                    {formatCurrency(call.costInLocalCurrency, call.currency)}
                                                                                </dd>
                                                                            </div>
                                                                            {call.currency.toLowerCase() !== 'usd' && (
                                                                                <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                                                                                    <dt className="text-xs text-slate-400">Vapi Cost (USD)</dt>
                                                                                    <dd className="text-xs text-slate-400">
                                                                                        {formatCurrency(call.cost, 'USD')}
                                                                                    </dd>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center justify-between gap-4 pb-2 border-b border-slate-100">
                                                                                <dt className="text-xs text-slate-500">Client Revenue ({call.currency.toUpperCase()})</dt>
                                                                                <dd className="text-sm font-semibold text-emerald-600">
                                                                                    {formatCurrency(call.revenue, call.currency)}
                                                                                </dd>
                                                                            </div>
                                                                            <div className="flex items-center justify-between gap-4 pt-1">
                                                                                <dt className="text-xs font-bold text-slate-700">Profit Margin ({call.currency.toUpperCase()})</dt>
                                                                                <dd className={cn("text-base font-bold", getMarginStyles(call.margin))}>
                                                                                    {formatCurrency(call.margin, call.currency)}
                                                                                </dd>
                                                                            </div>
                                                                        </dl>
                                                                    </div>
                                                                    <p className="text-xs font-semibold uppercase text-slate-500 mt-4">Call Details</p>
                                                                    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                                                                        <dl className="space-y-2">
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <dt className="text-xs text-slate-500">Started</dt>
                                                                                <dd className="text-sm font-medium text-slate-700">
                                                                                    {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                                                                                </dd>
                                                                            </div>
                                                                            {outcome && (
                                                                                <div className="flex items-center justify-between gap-4">
                                                                                    <dt className="text-xs text-slate-500">Outcome</dt>
                                                                                    <dd className="text-sm font-medium text-slate-700">
                                                                                        {outcome
                                                                                            .split('-')
                                                                                            .join(' ')
                                                                                            .replace(/^([a-zA-Z])/, (m: string) => m.toUpperCase())}
                                                                                    </dd>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex items-center justify-between gap-4">
                                                                                <dt className="text-xs text-slate-500">Status</dt>
                                                                                <dd>
                                                                                    <span className={cn(
                                                                                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                                                                                        statusStyles.badge
                                                                                    )}>
                                                                                        <span className={cn("h-2 w-2 rounded-full", statusStyles.dot)} />
                                                                                        {status}
                                                                                    </span>
                                                                                </dd>
                                                                            </div>
                                                                        </dl>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

