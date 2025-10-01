'use client'

import { Fragment, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
    Phone,
    ChevronRight,
    TrendingUp,
    DollarSign,
    Eye,
    Sparkles,
    Filter,
    Clock,
    Search,
    X,
    Timer,
    BarChart3,
    Loader2,
} from "lucide-react";
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    format as formatDate,
    subDays,
    startOfDay,
    endOfDay,
    parseISO,
    isSameDay,
    differenceInCalendarDays,
} from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

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

interface FilterClient {
    id: string;
    name: string;
}

interface FilterAgent {
    id: string;
    platform_id: string;
    platform: string;
    data: any;
    client_id: string;
}

type DateRangePreset =
    | "today"
    | "yesterday"
    | "last7"
    | "last14"
    | "last30"
    | "monthToDate"
    | "allTime";

const DATE_PRESET_LABELS: Record<DateRangePreset, string> = {
    today: "Today",
    yesterday: "Yesterday",
    last7: "Last 7 days",
    last14: "Last 14 days",
    last30: "Last 30 days",
    monthToDate: "Month to date",
    allTime: "All time",
};

const CURRENCY_RATES: Record<string, number> = {
    usd: 1.0,
    eur: 0.92,
    gbp: 0.79,
    cad: 1.35,
    aud: 1.52,
    jpy: 149.0,
    chf: 0.88,
    nzd: 1.64,
    sek: 10.5,
    nok: 10.8,
    dkk: 6.85,
    pln: 3.95,
    inr: 83.0,
    brl: 4.95,
    mxn: 17.0,
    zar: 18.5,
    sgd: 1.34,
    hkd: 7.82,
};

const CURRENCY_OPTIONS = [
    { value: 'ORIGINAL', label: 'Original Currency' },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'AUD', label: 'AUD ($)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'CHF', label: 'CHF (Fr)' },
    { value: 'NZD', label: 'NZD ($)' },
    { value: 'SEK', label: 'SEK (kr)' },
    { value: 'NOK', label: 'NOK (kr)' },
    { value: 'DKK', label: 'DKK (kr)' },
    { value: 'PLN', label: 'PLN (zł)' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'BRL', label: 'BRL (R$)' },
    { value: 'MXN', label: 'MXN ($)' },
    { value: 'ZAR', label: 'ZAR (R)' },
    { value: 'SGD', label: 'SGD ($)' },
    { value: 'HKD', label: 'HKD ($)' },
];

export function AnalyticsCallsComponent() {
    const router = useRouter();
    const pathname = usePathname();
    
    const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
    const [decimalPlaces, setDecimalPlaces] = useState<number>(2);
    const [displayCurrency, setDisplayCurrency] = useState<string>('USD');
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [compactView, setCompactView] = useState<boolean>(false);

    // Filter state
    const [clientFilter, setClientFilter] = useState('all');
    const [agentFilter, setAgentFilter] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [datePreset, setDatePreset] = useState<DateRangePreset>("allTime");

    // React Query for data fetching
    const { data: analyticsData, isLoading, error } = useAnalytics({
        clientId: clientFilter !== 'all' ? clientFilter : undefined,
        agentId: agentFilter !== 'all' ? agentFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
    });

    const updateFilters = (params: { client?: string; agent?: string; startDate?: string; endDate?: string }) => {
        if (params.client !== undefined) setClientFilter(params.client);
        if (params.agent !== undefined) setAgentFilter(params.agent);
        if (params.startDate !== undefined) setStartDate(params.startDate);
        if (params.endDate !== undefined) setEndDate(params.endDate);
    };

    const handleClientFilter = (value: string) => {
        setClientFilter(value);
        setAgentFilter('all');
    };

    const handleAgentFilter = (value: string) => {
        setAgentFilter(value);
    };

    const handleDateChange = (type: 'start' | 'end', value: string) => {
        if (type === 'start') {
            setStartDate(value);
        } else {
            setEndDate(value);
        }
        setDatePreset("allTime");
    };

    const applyDatePreset = (preset: DateRangePreset) => {
        const now = new Date();
        let presetStart: string = '';
        let presetEnd: string = '';

        switch (preset) {
            case "today": {
                const start = startOfDay(now);
                const end = endOfDay(now);
                presetStart = start.toISOString();
                presetEnd = end.toISOString();
                break;
            }
            case "yesterday": {
                const day = subDays(now, 1);
                presetStart = startOfDay(day).toISOString();
                presetEnd = endOfDay(day).toISOString();
                break;
            }
            case "last7": {
                const start = startOfDay(subDays(now, 6));
                const end = endOfDay(now);
                presetStart = start.toISOString();
                presetEnd = end.toISOString();
                break;
            }
            case "last14": {
                const start = startOfDay(subDays(now, 13));
                const end = endOfDay(now);
                presetStart = start.toISOString();
                presetEnd = end.toISOString();
                break;
            }
            case "last30": {
                const start = startOfDay(subDays(now, 29));
                const end = endOfDay(now);
                presetStart = start.toISOString();
                presetEnd = end.toISOString();
                break;
            }
            case "monthToDate": {
                const start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
                const end = endOfDay(now);
                presetStart = start.toISOString();
                presetEnd = end.toISOString();
                break;
            }
            case "allTime": {
                setStartDate('');
                setEndDate('');
                setDatePreset("allTime");
                return;
            }
            default:
                break;
        }

        setStartDate(presetStart);
        setEndDate(presetEnd);
        setDatePreset(preset);
    };

    const clearAllFilters = () => {
        setClientFilter('all');
        setAgentFilter('all');
        setStartDate('');
        setEndDate('');
        setDatePreset("allTime");
        setSearchTerm('');
    };

    const removeFilter = (type: 'client' | 'agent' | 'dates' | 'search') => {
        switch (type) {
            case 'client':
                setClientFilter('all');
                setAgentFilter('all');
                break;
            case 'agent':
                setAgentFilter('all');
                break;
            case 'dates':
                setStartDate('');
                setEndDate('');
                setDatePreset("allTime");
                break;
            case 'search':
                setSearchTerm('');
                break;
        }
    };

    const formatDuration = (seconds: number) => {
        if (!seconds || seconds === 0) return '0m 0s';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    };

    const formatTotalMinutes = (seconds: number) => {
        if (!seconds || seconds === 0) return '0m';
        const mins = Math.floor(seconds / 60);
        return `${mins.toLocaleString()}m`;
    };

    const convertCurrency = (amount: number, fromCurrency: string, toCurrency: string = displayCurrency) => {
        if (fromCurrency.toLowerCase() === toCurrency.toLowerCase()) {
            return amount;
        }
        
        // Convert to USD first if not already
        const usdAmount = fromCurrency.toLowerCase() === 'usd' 
            ? amount 
            : amount / (CURRENCY_RATES[fromCurrency.toLowerCase()] || 1);
        
        // Then convert to target currency
        const targetRate = CURRENCY_RATES[toCurrency.toLowerCase()] || 1;
        return usdAmount * targetRate;
    };

    const formatCurrency = (amount: number, currencyCode: string = displayCurrency, useCustomDecimals: boolean = true) => {
        const decimals = useCustomDecimals ? decimalPlaces : 2;
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currencyCode.toUpperCase(),
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            }).format(amount);
        } catch (error) {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
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

    const CostBreakdown = ({ costs, currency }: { costs: any[], currency: string }) => {
        if (!costs || costs.length === 0) {
            return <p className="text-xs text-slate-500">No cost breakdown available</p>;
        }

        const getCostTypeLabel = (costItem: any) => {
            switch (costItem.type) {
                case 'transcriber':
                    return `Transcription (${costItem.transcriber?.provider || 'unknown'})`;
                case 'model':
                    return `LLM (${costItem.model?.model || 'unknown'})`;
                case 'voice':
                    return `Voice (${costItem.voice?.provider || 'unknown'})`;
                case 'vapi':
                    return 'Vapi Platform';
                case 'analysis':
                    return `Analysis (${costItem.analysisType || 'unknown'})`;
                case 'knowledge-base':
                    return 'Knowledge Base';
                default:
                    return costItem.type || 'Other';
            }
        };

        const getCostDetails = (costItem: any) => {
            const details: string[] = [];
            if (costItem.minutes) details.push(`${costItem.minutes.toFixed(2)} min`);
            if (costItem.characters) details.push(`${costItem.characters} chars`);
            if (costItem.promptTokens) details.push(`${costItem.promptTokens} prompt tokens`);
            if (costItem.completionTokens) details.push(`${costItem.completionTokens} completion tokens`);
            return details.length > 0 ? details.join(', ') : null;
        };

        return (
            <div className="space-y-2 min-w-[300px]">
                <h4 className="text-sm font-semibold text-slate-900 mb-3">Cost Breakdown</h4>
                <div className="space-y-2">
                    {costs.map((costItem: any, index: number) => (
                        <div key={index} className="flex justify-between items-start gap-4 pb-2 border-b border-slate-100 last:border-0">
                            <div className="flex-1">
                                <p className="text-xs font-medium text-slate-700">
                                    {getCostTypeLabel(costItem)}
                                </p>
                                {getCostDetails(costItem) && (
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {getCostDetails(costItem)}
                                    </p>
                                )}
                            </div>
                            <span className="text-xs font-semibold text-slate-900 whitespace-nowrap">
                                {formatCurrency(costItem.cost, currency)}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center pt-2 border-t-2 border-slate-200">
                    <span className="text-sm font-bold text-slate-900">Total</span>
                    <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(costs.reduce((sum: number, c: any) => sum + (c.cost || 0), 0), currency)}
                    </span>
                </div>
            </div>
        );
    };

    const calls = analyticsData?.calls || [];
    const totalsRaw = analyticsData?.totals || {
        totalCost: 0,
        totalRevenue: 0,
        totalMargin: 0,
        totalCalls: 0,
        averageMargin: 0,
        marginPercentage: 0
    };
    
    // Convert totals to display currency (backend sends in USD)
    // When "ORIGINAL" is selected, keep in USD for totals since we can't mix currencies
    const effectiveDisplayCurrency = displayCurrency === 'ORIGINAL' ? 'USD' : displayCurrency;
    
    const totals = useMemo(() => ({
        totalCost: convertCurrency(totalsRaw.totalCost, 'USD', effectiveDisplayCurrency),
        totalRevenue: convertCurrency(totalsRaw.totalRevenue, 'USD', effectiveDisplayCurrency),
        totalMargin: convertCurrency(totalsRaw.totalMargin, 'USD', effectiveDisplayCurrency),
        totalCalls: totalsRaw.totalCalls,
        averageMargin: convertCurrency(totalsRaw.averageMargin, 'USD', effectiveDisplayCurrency),
        marginPercentage: totalsRaw.marginPercentage
    }), [totalsRaw, effectiveDisplayCurrency]);
    
    const filters = analyticsData?.filters || { clients: [], agents: [] };

    const filteredCalls = useMemo(() => {
        if (!searchTerm) return calls;

        const normalizedQuery = searchTerm.trim().toLowerCase();

        return calls.filter((call: CallWithAnalytics) => {
            const agentName = getAgentName(call.agents).toLowerCase();
            const clientName = call.clients?.name?.toLowerCase() || "";
            const clientEmail = call.clients?.email?.toLowerCase() || "";
            const description = call.data?.analysis?.summary?.toLowerCase() || "";
            const phone = getPhoneDisplay(call.data).toLowerCase();
            const status = getCallStatus(call.data).toLowerCase();

            return [
                agentName,
                clientName,
                clientEmail,
                description,
                phone,
                status,
            ].some((value) => value.includes(normalizedQuery));
        });
    }, [calls, searchTerm]);

    const appliedCalls = searchTerm ? filteredCalls : calls;

    // Calculate additional metrics
    const totalSeconds = appliedCalls.reduce((sum: number, call: CallWithAnalytics) => sum + call.seconds, 0);
    const avgCallDuration = appliedCalls.length > 0 ? totalSeconds / appliedCalls.length : 0;
    
    // Calculate cost and revenue per minute in display currency
    const costPerMinute = useMemo(() => {
        if (totalSeconds === 0) return 0;
        return totals.totalCost / (totalSeconds / 60);
    }, [totalSeconds, totals.totalCost]);
    
    const revenuePerMinute = useMemo(() => {
        if (totalSeconds === 0) return 0;
        return totals.totalRevenue / (totalSeconds / 60);
    }, [totalSeconds, totals.totalRevenue]);
    
    const marginPerMinute = useMemo(() => {
        if (totalSeconds === 0) return 0;
        return totals.totalMargin / (totalSeconds / 60);
    }, [totalSeconds, totals.totalMargin]);

    // Filter agents based on selected client
    const availableAgents = clientFilter !== 'all' 
        ? filters.agents.filter((agent: FilterAgent) => agent.client_id === clientFilter)
        : filters.agents;

    const getAgentNameFromData = (agent: FilterAgent | undefined) => {
        if (!agent) return 'Unknown Agent';
        if (agent.platform === 'vapi' && agent.data?.name) {
            return agent.data.name;
        }
        return `Agent ${agent.platform_id.slice(-8)}`;
    };

    const hasActiveFilters = clientFilter !== 'all' || agentFilter !== 'all' || startDate || endDate || searchTerm;

    const toggleExpandedRow = (callId: string) => {
        setExpandedCallId((prev) => (prev === callId ? null : callId));
    };

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-semibold text-red-600">Error loading analytics</p>
                            <p className="text-sm text-muted-foreground">Please try refreshing the page</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div className="flex items-center gap-3">
                                <Label className="text-sm font-medium">Quick Date Range</Label>
                                {isLoading && (
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="display-currency" className="text-xs text-muted-foreground whitespace-nowrap">
                                        Currency:
                                    </Label>
                                    <Select
                                        value={displayCurrency}
                                        onValueChange={setDisplayCurrency}
                                    >
                                        <SelectTrigger id="display-currency" className="h-8 w-[110px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CURRENCY_OPTIONS.map((currency) => (
                                                <SelectItem key={currency.value} value={currency.value}>
                                                    {currency.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="decimal-places" className="text-xs text-muted-foreground whitespace-nowrap">
                                        Precision:
                                    </Label>
                                    <Select
                                        value={decimalPlaces.toString()}
                                        onValueChange={(value) => setDecimalPlaces(parseInt(value))}
                                    >
                                        <SelectTrigger id="decimal-places" className="h-8 w-[110px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="2">2 decimals</SelectItem>
                                            <SelectItem value="3">3 decimals</SelectItem>
                                            <SelectItem value="4">4 decimals</SelectItem>
                                            <SelectItem value="5">5 decimals</SelectItem>
                                            <SelectItem value="6">6 decimals</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button
                                    variant={compactView ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setCompactView(!compactView)}
                                    className="gap-2 h-8"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    {compactView ? "Default" : "Compact"}
                                </Button>
                                {hasActiveFilters && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={clearAllFilters}
                                        className="h-8 text-xs"
                                    >
                                        Clear all filters
                                    </Button>
                                )}
                            </div>
                        </div>
                        <Tabs value={datePreset} onValueChange={(v) => applyDatePreset(v as DateRangePreset)}>
                            <TabsList className="grid w-full grid-cols-7 h-auto">
                                <TabsTrigger value="today" className="text-xs">Today</TabsTrigger>
                                <TabsTrigger value="yesterday" className="text-xs">Yesterday</TabsTrigger>
                                <TabsTrigger value="last7" className="text-xs">7 days</TabsTrigger>
                                <TabsTrigger value="last14" className="text-xs">14 days</TabsTrigger>
                                <TabsTrigger value="last30" className="text-xs">30 days</TabsTrigger>
                                <TabsTrigger value="monthToDate" className="text-xs">MTD</TabsTrigger>
                                <TabsTrigger value="allTime" className="text-xs">All</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        
                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="client-filter" className="text-xs font-medium">
                                    Client
                                </Label>
                                <Select value={clientFilter} onValueChange={handleClientFilter} disabled={isLoading}>
                                    <SelectTrigger id="client-filter" className="h-9">
                                        <SelectValue placeholder="All Clients" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Clients</SelectItem>
                                        {filters.clients.map((client: FilterClient) => (
                                            <SelectItem key={client.id} value={client.id}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="agent-filter" className="text-xs font-medium">
                                    Agent
                                </Label>
                                <Select 
                                    value={agentFilter} 
                                    onValueChange={handleAgentFilter}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="agent-filter" className="h-9">
                                        <SelectValue placeholder="All Agents" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Agents</SelectItem>
                                        {availableAgents.map((agent: FilterAgent) => (
                                            <SelectItem key={agent.id} value={agent.id}>
                                                {getAgentNameFromData(agent)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="start-date" className="text-xs font-medium">
                                    Start Date
                                </Label>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate ? formatDate(parseISO(startDate), 'yyyy-MM-dd') : ''}
                                    onChange={(e) => handleDateChange('start', e.target.value ? new Date(e.target.value).toISOString() : '')}
                                    disabled={isLoading}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="end-date" className="text-xs font-medium">
                                    End Date
                                </Label>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate ? formatDate(parseISO(endDate), 'yyyy-MM-dd') : ''}
                                    onChange={(e) => handleDateChange('end', e.target.value ? new Date(e.target.value).toISOString() : '')}
                                    disabled={isLoading}
                                    className="h-9"
                                />
                            </div>
                        </div>

                        {/* Active Filters Chips */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {clientFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 pr-1">
                                        Client: {filters.clients.find((c: FilterClient) => c.id === clientFilter)?.name}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => removeFilter('client')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {agentFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1 pr-1">
                                        Agent: {getAgentNameFromData(filters.agents.find((a: FilterAgent) => a.id === agentFilter))}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => removeFilter('agent')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {(startDate || endDate) && (
                                    <Badge variant="secondary" className="gap-1 pr-1">
                                        {DATE_PRESET_LABELS[datePreset] || 'Custom dates'}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => removeFilter('dates')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                                {searchTerm && (
                                    <Badge variant="secondary" className="gap-1 pr-1">
                                        Search: {searchTerm}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-4 w-4 p-0 hover:bg-transparent"
                                            onClick={() => removeFilter('search')}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Calls</p>
                        <Phone className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totals.totalCalls}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Minutes</p>
                        <Clock className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatTotalMinutes(totalSeconds)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                        <Timer className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatDuration(avgCallDuration)}</div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                        <DollarSign className="h-4 w-4 text-emerald-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.totalRevenue, effectiveDisplayCurrency)}</div>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(revenuePerMinute, effectiveDisplayCurrency)}/min
                                {displayCurrency === 'ORIGINAL' && <span className="ml-1">(USD totals)</span>}
                            </p>
                            {effectiveDisplayCurrency.toLowerCase() !== 'usd' && displayCurrency !== 'ORIGINAL' && (
                                <p className="text-xs text-slate-400">
                                    {formatCurrency(totalsRaw.totalRevenue, 'USD')} USD
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                        <DollarSign className="h-4 w-4 text-rose-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-600">{formatCurrency(totals.totalCost, effectiveDisplayCurrency)}</div>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-xs text-muted-foreground">
                                {formatCurrency(costPerMinute, effectiveDisplayCurrency)}/min
                                {displayCurrency === 'ORIGINAL' && <span className="ml-1">(USD totals)</span>}
                            </p>
                            {effectiveDisplayCurrency.toLowerCase() !== 'usd' && displayCurrency !== 'ORIGINAL' && (
                                <p className="text-xs text-slate-400">
                                    {formatCurrency(totalsRaw.totalCost, 'USD')} USD
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className={cn("text-2xl font-bold", getMarginStyles(totals.totalMargin))}>
                            {formatCurrency(totals.totalMargin, effectiveDisplayCurrency)}
                        </div>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <p className="text-xs text-muted-foreground">
                                {totals.marginPercentage.toFixed(1)}% margin · {formatCurrency(marginPerMinute, effectiveDisplayCurrency)}/min
                                {displayCurrency === 'ORIGINAL' && <span className="ml-1">(USD totals)</span>}
                            </p>
                            {effectiveDisplayCurrency.toLowerCase() !== 'usd' && displayCurrency !== 'ORIGINAL' && (
                                <p className="text-xs text-slate-400">
                                    {formatCurrency(totalsRaw.totalMargin, 'USD')} USD
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Calls Table */}
            <Card className="border-border/60 shadow-sm">
                <CardHeader className="border-b border-border/60">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h2 className="text-xl font-semibold">Call Details</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {appliedCalls.length} {appliedCalls.length === 1 ? 'call' : 'calls'} found
                            </p>
                        </div>
                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search calls by agent, client, phone..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 h-9"
                            />
                            {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="text-center space-y-3">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground">Loading analytics...</p>
                            </div>
                        </div>
                    ) : appliedCalls.length === 0 ? (
                        <div className="p-12 text-center">
                            <Phone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No calls found</h3>
                            <p className="text-muted-foreground text-sm">
                                {searchTerm || hasActiveFilters 
                                    ? "Try adjusting your filters or search term"
                                    : "Call data will appear here once calls are made"}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[220px] px-6">Agent</TableHead>
                                        <TableHead className="w-[180px]">Client</TableHead>
                                        <TableHead className="w-[100px]">Duration</TableHead>
                                        <TableHead className="w-[110px] text-right">Cost</TableHead>
                                        <TableHead className="w-[110px] text-right">Revenue</TableHead>
                                        <TableHead className="w-[110px] text-right">Margin</TableHead>
                                        <TableHead className="w-[80px] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {appliedCalls.map((call: CallWithAnalytics) => {
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
                                            type = 'Inbound';
                                        } else if (callType === 'outboundPhoneCall') {
                                            type = 'Outbound';
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
                                                    onClick={() => !compactView && toggleExpandedRow(call.id)}
                                                    data-state={isExpanded ? "selected" : undefined}
                                                    className={cn(
                                                        !compactView && "cursor-pointer",
                                                        "transition hover:bg-slate-50/50",
                                                        isExpanded && "bg-slate-50"
                                                    )}
                                                >
                                                    <TableCell className={cn("px-6", compactView ? "py-2" : "py-4")}>
                                                        <div className="flex items-center gap-3">
                                                            {!compactView && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        toggleExpandedRow(call.id);
                                                                    }}
                                                                    className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100"
                                                                >
                                                                    <ChevronRight
                                                                        className={cn(
                                                                            "h-3.5 w-3.5 transition-transform",
                                                                            isExpanded && "rotate-90"
                                                                        )}
                                                                    />
                                                                </button>
                                                            )}
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-sm font-semibold text-slate-900 truncate">{agentName}</span>
                                                                <span className="text-xs text-slate-500">{timeAgo}</span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={cn(compactView ? "py-2" : "py-4")}>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-medium text-slate-900 truncate">
                                                                {call.clients?.name || 'Unknown'}
                                                            </span>
                                                            {!compactView && (
                                                                <span className="text-xs text-slate-500 truncate">
                                                                    {call.clients?.email || ''}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={cn("text-sm text-slate-600", compactView ? "py-2" : "py-4")}>
                                                        {duration}
                                                    </TableCell>
                                                    <TableCell className={cn("text-sm text-right", compactView ? "py-2" : "py-4")}>
                                                        <div className="flex items-center justify-end gap-2">
                                                            <div className="flex flex-col items-end">
                                                                {displayCurrency === 'ORIGINAL' ? (
                                                                    <>
                                                                        <span className="text-rose-600 font-medium">
                                                                            {formatCurrency(call.costInLocalCurrency, call.currency)}
                                                                        </span>
                                                                        {!compactView && call.currency.toLowerCase() !== 'usd' && (
                                                                            <span className="text-xs text-slate-400">
                                                                                {formatCurrency(call.cost, 'USD')} USD
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-rose-600 font-medium">
                                                                            {formatCurrency(convertCurrency(call.costInLocalCurrency, call.currency, displayCurrency), displayCurrency)}
                                                                        </span>
                                                                        {!compactView && call.currency.toLowerCase() !== displayCurrency.toLowerCase() && (
                                                                            <span className="text-xs text-slate-400">
                                                                                {formatCurrency(call.costInLocalCurrency, call.currency)} orig
                                                                            </span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                            {!compactView && call.data?.costs && call.data.costs.length > 0 && (
                                                                <Popover>
                                                                    <PopoverTrigger asChild>
                                                                        <button
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            className="p-1 hover:bg-slate-100 rounded transition-colors"
                                                                        >
                                                                            <Eye className="h-4 w-4 text-slate-400 hover:text-slate-600" />
                                                                        </button>
                                                                    </PopoverTrigger>
                                                                    <PopoverContent align="end" className="w-auto p-4">
                                                                        <CostBreakdown costs={call.data.costs} currency={call.currency} />
                                                                    </PopoverContent>
                                                                </Popover>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={cn("text-sm text-right", compactView ? "py-2" : "py-4")}>
                                                        <div className="flex flex-col items-end">
                                                            {displayCurrency === 'ORIGINAL' ? (
                                                                <>
                                                                    <span className="text-emerald-600 font-medium">
                                                                        {formatCurrency(call.revenue, call.currency)}
                                                                    </span>
                                                                    {!compactView && call.currency.toLowerCase() !== 'usd' && (
                                                                        <span className="text-xs text-slate-400">
                                                                            {formatCurrency(convertCurrency(call.revenue, call.currency, 'USD'), 'USD')} USD
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className="text-emerald-600 font-medium">
                                                                        {formatCurrency(convertCurrency(call.revenue, call.currency, displayCurrency), displayCurrency)}
                                                                    </span>
                                                                    {!compactView && call.currency.toLowerCase() !== displayCurrency.toLowerCase() && (
                                                                        <span className="text-xs text-slate-400">
                                                                            {formatCurrency(call.revenue, call.currency)} orig
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={cn("text-sm text-right", compactView ? "py-2" : "py-4")}>
                                                        <div className="flex flex-col items-end">
                                                            {displayCurrency === 'ORIGINAL' ? (
                                                                <>
                                                                    <span className={getMarginStyles(call.margin)}>
                                                                        {formatCurrency(call.margin, call.currency)}
                                                                    </span>
                                                                    {!compactView && call.currency.toLowerCase() !== 'usd' && (
                                                                        <span className="text-xs text-slate-400">
                                                                            {formatCurrency(convertCurrency(call.margin, call.currency, 'USD'), 'USD')} USD
                                                                        </span>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <span className={getMarginStyles(call.margin)}>
                                                                        {formatCurrency(convertCurrency(call.margin, call.currency, displayCurrency), displayCurrency)}
                                                                    </span>
                                                                    {!compactView && call.currency.toLowerCase() !== displayCurrency.toLowerCase() && (
                                                                        <span className="text-xs text-slate-400">
                                                                            {formatCurrency(call.margin, call.currency)} orig
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className={cn("text-right", compactView ? "py-2" : "py-4")}>
                                                        {!compactView && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={(event) => {
                                                                    event.stopPropagation();
                                                                    toggleExpandedRow(call.id);
                                                                }}
                                                                className="h-8 rounded-full px-3 text-xs font-medium text-blue-600 hover:bg-blue-50"
                                                            >
                                                                {isExpanded ? "Hide" : "View"}
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                                {isExpanded && !compactView && (
                                                    <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                                                        <TableCell colSpan={7} className="px-6 pb-6 pt-4">
                                                            <div className="flex flex-col gap-5 text-sm text-slate-600">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    {type && (
                                                                        <Badge variant="secondary" className="rounded-full bg-slate-200/80 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                                                                            {type}
                                                                        </Badge>
                                                                    )}
                                                                    <Badge variant="secondary" className="rounded-full bg-slate-200/80 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                                                                        {phoneDisplay}
                                                                    </Badge>
                                                                    <Badge variant="secondary" className="rounded-full bg-slate-200/80 text-[11px] font-medium uppercase tracking-wide text-slate-600">
                                                                        Duration: {duration}
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
                                                                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                                                                    <div className="space-y-3 min-w-0">
                                                                        <p className="text-xs font-semibold uppercase text-slate-500">Summary</p>
                                                                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700 max-h-[200px] overflow-y-auto break-words whitespace-pre-wrap">
                                                                            {description || "No summary captured for this call."}
                                                                        </div>
                                                                        <p className="text-xs font-semibold uppercase text-slate-500 mt-4">Call Details</p>
                                                                        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                                                                            <dl className="space-y-2.5">
                                                                                <div className="flex items-center justify-between gap-4">
                                                                                    <dt className="text-xs text-slate-500">Started</dt>
                                                                                    <dd className="text-sm font-medium text-slate-700">
                                                                                        {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                                                                                    </dd>
                                                                                </div>
                                                                                {outcome && (
                                                                                    <div className="flex items-center justify-between gap-4">
                                                                                        <dt className="text-xs text-slate-500">Outcome</dt>
                                                                                        <dd className="text-sm font-medium text-slate-700 capitalize">
                                                                                            {outcome.split('-').join(' ')}
                                                                                        </dd>
                                                                                    </div>
                                                                                )}
                                                                                <div className="flex items-center justify-between gap-4">
                                                                                    <dt className="text-xs text-slate-500">Status</dt>
                                                                                    <dd>
                                                                                        <span className={cn(
                                                                                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                                                                                            statusStyles.badge
                                                                                        )}>
                                                                                            <span className={cn("h-1.5 w-1.5 rounded-full", statusStyles.dot)} />
                                                                                            {status}
                                                                                        </span>
                                                                                    </dd>
                                                                                </div>
                                                                            </dl>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-3 min-w-0">
                                                                        <p className="text-xs font-semibold uppercase text-slate-500">Transcript</p>
                                                                        {transcript.length > 0 ? (
                                                                            <ScrollArea className="h-[400px] rounded-xl border border-slate-200 bg-white">
                                                                                <div className="divide-y divide-slate-100 text-sm">
                                                                                    {transcript.map((entry) => (
                                                                                        <div key={entry.id} className="grid gap-2 px-4 py-3">
                                                                                            <div className="flex items-center justify-between gap-2">
                                                                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 flex-shrink-0">
                                                                                                    {entry.speaker}
                                                                                                </span>
                                                                                                {entry.time && (
                                                                                                    <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">
                                                                                                        {entry.time}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <p className="break-words whitespace-normal leading-relaxed text-slate-700 overflow-wrap-break-word word-break">
                                                                                                {entry.content}
                                                                                            </p>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                                <ScrollBar orientation="vertical" />
                                                                            </ScrollArea>
                                                                        ) : (
                                                                            <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                                                                Transcript unavailable for this call.
                                                                            </p>
                                                                        )}
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
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
