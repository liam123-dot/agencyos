'use client'

import { Fragment, useEffect, useState, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Phone, Filter, ChevronRight } from "lucide-react";
import { getCalls } from "./CallsServerComponent";
import { CallsPagination } from "./CallsPagination";
import { CallsLimitSelector } from "./CallsLimitSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Vapi } from "@vapi-ai/server-sdk";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface CallsComponentProps {
    initialPage?: number;
    initialLimit?: number;
    clientId?: string;
}

interface Agent {
    id: string;
    platform_id: string;
    platform: string;
    data: any;
}

interface Call {
    id: string;
    agent_id: string | null;
    client_id: string;
    organization_id: string;
    seconds: number;
    data: Vapi.ServerMessageEndOfCallReport;
    created_at: string;
    updated_at: string;
    agents: Agent | null;
    messages?: any[];
}

interface CallsData {
    calls: Call[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    limit: number;
}

export function CallsComponent({ initialPage = 1, initialLimit = 10, clientId }: CallsComponentProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    
    const [callsData, setCallsData] = useState<CallsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();
    
    // Filter states
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
    const [agentFilter, setAgentFilter] = useState(searchParams.get('agent') || 'all');
    
    const [expandedCallId, setExpandedCallId] = useState<string | null>(null);

    const currentPage = parseInt(searchParams.get('page') || initialPage.toString(), 10);
    const currentLimit = parseInt(searchParams.get('limit') || initialLimit.toString(), 10);

    const updateURL = (params: Record<string, string>) => {
        const newSearchParams = new URLSearchParams(searchParams);
        
        Object.entries(params).forEach(([key, value]) => {
            if (value && value !== 'all' && value !== '') {
                newSearchParams.set(key, value);
            } else {
                newSearchParams.delete(key);
            }
        });

        // Reset to page 1 when filters change
        if (params.search !== undefined || params.status !== undefined || params.agent !== undefined) {
            newSearchParams.set('page', '1');
        }

        router.push(`${pathname}?${newSearchParams.toString()}`);
    };

    const loadCalls = async (page: number, limit: number, search?: string, status?: string, agent?: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCalls({ 
                page, 
                limit, 
                clientId, 
                search: search || searchQuery,
                status: status === 'all' ? undefined : status,
                agent: agent === 'all' ? undefined : agent
            });
            setCallsData(data);
        } catch (err) {
            setError('Failed to load calls');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            loadCalls(currentPage, currentLimit, searchQuery, statusFilter, agentFilter);
        });
    }, [currentPage, currentLimit, searchQuery, statusFilter, agentFilter]);

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        updateURL({ search: value, status: statusFilter, agent: agentFilter });
    };

    const handleStatusFilter = (value: string) => {
        setStatusFilter(value);
        updateURL({ search: searchQuery, status: value, agent: agentFilter });
    };

    const handleAgentFilter = (value: string) => {
        setAgentFilter(value);
        updateURL({ search: searchQuery, status: statusFilter, agent: value });
    };

    const toggleExpandedRow = (callId: string) => {
        setExpandedCallId((prev) => (prev === callId ? null : callId));
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
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

    const getUniqueAgents = () => {
        if (!callsData?.calls) return [];
        const agents = new Map();
        callsData.calls.forEach(call => {
            if (call.agents) {
                agents.set(call.agents.id, call.agents);
            }
        });
        return Array.from(agents.values());
    };

    const getPhoneDisplay = (callData: any) => {
        if (callData?.type === 'webCall') {
            return 'Web Call';
        }
        return callData?.customer?.number || 'Unknown';
    };

const assistantRoles = new Set(["assistant", "assistant_message", "bot", "ai", "agent", "assistantresponse", "assistant_response", "assistantoutput"]);
const customerRoles = new Set(["user", "customer", "caller", "human", "client", "customer_message", "user_message", "customerresponse"]);

const getTranscriptEntries = (callData: any, agentLabel: string) => {
    const entries: { speaker: string; content: string; id: string | number; time?: string }[] = [];

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

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive text-lg">{error}</p>
                <p className="text-muted-foreground text-sm mt-2">
                    Please try refreshing the page
                </p>
            </div>
        );
    }

    const showLoading = isLoading || isPending;
    const calls = callsData?.calls || [];
    const totalCount = callsData?.totalCount || 0;
    const totalPages = callsData?.totalPages || 1;
    const serverLimit = callsData?.limit || currentLimit;
    const uniqueAgents = getUniqueAgents();

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <div className="rounded-2xl border border-slate-100 bg-white px-6 py-6 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Call History</h1>
                        <p className="text-sm text-slate-500">
                            View and manage all calls made through your agents
                        </p>
                    </div>
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                        <div className="relative w-full sm:w-auto sm:min-w-[280px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Search call transcripts, agents, numbers..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 pl-9 text-sm focus:border-blue-500 focus:bg-white"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={statusFilter} onValueChange={handleStatusFilter}>
                                <SelectTrigger className="h-11 w-[150px] rounded-xl border-slate-200 bg-white text-sm">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                    <SelectItem value="in progress">In Progress</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={agentFilter} onValueChange={handleAgentFilter}>
                                <SelectTrigger className="h-11 w-[150px] rounded-xl border-slate-200 bg-white text-sm">
                                    <SelectValue placeholder="Agent" />
                                </SelectTrigger>
                                <SelectContent align="end">
                                    <SelectItem value="all">All Agents</SelectItem>
                                    {uniqueAgents.map((agent) => (
                                        <SelectItem key={agent.id} value={agent.id}>
                                            {getAgentName(agent)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" size="sm" className="h-11 rounded-xl border-slate-200 bg-white text-sm text-slate-700">
                                <Filter className="mr-2 h-4 w-4" />
                                More Filters
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Recent Calls</h2>
                        <p className="text-sm text-slate-500">
                            {!showLoading && (
                                `Showing ${calls.length} of ${totalCount} calls`
                            )}
                        </p>
                    </div>
                    <CallsLimitSelector currentLimit={serverLimit} />
                </div>

                {showLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="border-slate-100 shadow-sm">
                                <CardContent className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100" />
                                        <div className="space-y-2">
                                            <div className="h-4 w-32 rounded bg-slate-100" />
                                            <div className="h-3 w-40 rounded bg-slate-100" />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-4 w-20 rounded bg-slate-100" />
                                        <div className="h-6 w-24 rounded-full bg-slate-100" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : calls.length === 0 ? (
                    <Card className="border-slate-100">
                        <CardContent className="p-10 text-center">
                            <Phone className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                            <h3 className="text-lg font-semibold mb-1">No calls found</h3>
                            <p className="text-muted-foreground text-sm">
                                {searchQuery || statusFilter !== 'all' || agentFilter !== 'all' 
                                    ? 'Try adjusting your search filters'
                                    : 'Start making calls to see them here'
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 shadow-sm">
                        <Table className="min-w-full bg-white">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[220px] px-6">Agent</TableHead>
                                    <TableHead className="w-[160px] px-4">Status</TableHead>
                                    <TableHead className="w-[200px] px-4">Customer</TableHead>
                                    <TableHead className="w-[140px] px-4">Duration</TableHead>
                                    <TableHead className="w-[120px] px-6 text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {calls.map((call) => {
                                    const status = getCallStatus(call.data);
                                    const agentName = getAgentName(call.agents);
                                    const duration = formatDuration(call.seconds);
                                    const timeAgo = formatDistanceToNow(new Date(call.created_at), { addSuffix: true });
                                    const statusStyles = getStatusStyles(status);

                                    const callType = call.data.call?.type
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
                                    const isExpanded = expandedCallId === call.id;

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
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                                                        statusStyles.badge
                                                    )}>
                                                        <span className={cn("h-2 w-2 rounded-full", statusStyles.dot)} />
                                                        {status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="px-4 align-middle">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-medium text-slate-600">{type}</span>
                                                        {/* if type is not web call, show the phone number */}
                                                        {type !== 'Web Call' && (
                                                            <span className="text-sm font-medium text-slate-600">{phoneDisplay}</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="px-4 text-sm text-slate-600 align-middle">{duration}</TableCell>
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
                                                    <TableCell colSpan={5} className="px-6 pb-6 pt-4">
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
                                                                    <p className="text-xs font-semibold uppercase text-slate-500">Details</p>
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
                                                                                            .replace(/^([a-zA-Z])/, (m) => m.toUpperCase())}
                                                                                    </dd>
                                                                                </div>
                                                                            )}
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
                    </div>
                )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center pt-2">
                    <CallsPagination
                        currentPage={currentPage}
                        totalPages={Math.max(totalPages, 1)}
                    />
                </div>
            )}

            {/* Call Details Modal */}
            {/* <CallDetailsDialog
                call={selectedCall}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            /> */}
        </div>
    );
}
