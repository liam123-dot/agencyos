'use client'

import { Fragment, useEffect, useState, useTransition, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Phone, ChevronRight, Play, Pause, Loader2 } from "lucide-react";
import { getCalls } from "./CallsServerComponent";
import { CallsPagination } from "./CallsPagination";
import { CallsLimitSelector } from "./CallsLimitSelector";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
    
    // Filter state - only agent filter
    const [agentFilter, setAgentFilter] = useState(searchParams.get('agent') || 'all');
    
    const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
    const [playingCallId, setPlayingCallId] = useState<string | null>(null);
    const [loadingCallId, setLoadingCallId] = useState<string | null>(null);
    const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
    const playbackRequestsRef = useRef<Map<string, number>>(new Map());

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

        // Reset to page 1 when agent filter changes
        if (params.agent !== undefined) {
            newSearchParams.set('page', '1');
        }

        router.push(`${pathname}?${newSearchParams.toString()}`);
    };

    const loadCalls = async (page: number, limit: number, agent?: string) => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getCalls({ 
                page, 
                limit, 
                clientId, 
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
            loadCalls(currentPage, currentLimit, agentFilter);
        });
    }, [currentPage, currentLimit, agentFilter]);

    // Cleanup audio elements on unmount
    useEffect(() => {
        return () => {
            audioRefs.current.forEach((audio) => {
                audio.pause();
                audio.src = "";
            });
            audioRefs.current.clear();
        };
    }, []);

    const handleAgentFilter = (value: string) => {
        setAgentFilter(value);
        updateURL({ agent: value });
    };

    const toggleExpandedRow = (callId: string) => {
        setExpandedCallId((prev) => (prev === callId ? null : callId));
    };

    const handleAudioPlayback = async (callId: string, audioUrl: string) => {
        // Validate audio URL
        if (!audioUrl || typeof audioUrl !== 'string' || audioUrl.trim() === '') {
            console.error('Invalid audio URL provided:', audioUrl);
            return;
        }

        // Increment the playback request id for this call to invalidate previous async steps
        const nextRequestId = (playbackRequestsRef.current.get(callId) ?? 0) + 1;
        playbackRequestsRef.current.set(callId, nextRequestId);

        // If this call is already playing or loading, pause/cancel it
        if (playingCallId === callId || loadingCallId === callId) {
            const audio = audioRefs.current.get(callId);
            if (audio) {
                if (!audio.paused) {
                    audio.pause();
                }
                audio.currentTime = 0;
                setPlayingCallId(null);
                setLoadingCallId(null);
            }
            return;
        }

        // Set loading state
        setLoadingCallId(callId);

        // Pause any currently playing audio
        if (playingCallId) {
            const currentAudio = audioRefs.current.get(playingCallId);
            if (currentAudio && !currentAudio.paused) {
                currentAudio.pause();
                currentAudio.currentTime = 0;
            }
            setPlayingCallId(null);
        }

        // Get or create audio element
        let audio = audioRefs.current.get(callId);
        const isNewAudio = !audio;
        
        if (!audio) {
            audio = new Audio();
            
            // Configure audio element
            audio.preload = 'auto';
            
            // Add event listeners
            audio.addEventListener('ended', () => {
                if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                    return;
                }
                setPlayingCallId(null);
                setLoadingCallId(null);
            });
            
            audio.addEventListener('error', (e) => {
                if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                    return;
                }
                setPlayingCallId(null);
                setLoadingCallId(null);
                const target = e.target as HTMLAudioElement;
                console.error('Error loading audio recording:', {
                    error: e,
                    errorCode: target.error?.code,
                    errorMessage: target.error?.message,
                    audioUrl: target.src,
                    networkState: target.networkState,
                    readyState: target.readyState
                });
            });

            audio.addEventListener('loadeddata', () => {
                if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                    return;
                }
                setLoadingCallId(null);
            });

            audio.addEventListener('canplay', () => {
                if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                    return;
                }
                setLoadingCallId(null);
            });
            
            audioRefs.current.set(callId, audio);
        }

        // Always ensure the src is set correctly before playing
        // (it might have been cleared after an error or need to be reset)
        const needsNewSrc = audio.src !== audioUrl;
        if (needsNewSrc) {
            audio.src = audioUrl;
        } else if (!audio.src) {
            // Some browsers may leave src empty after errors; ensure it's set
            audio.src = audioUrl;
        }

        try {
            if (isNewAudio || needsNewSrc) {
                await new Promise<void>((resolve, reject) => {
                    if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                        resolve();
                        return;
                    }

                    if (audio!.readyState >= 3) {
                        resolve();
                        return;
                    }

                    const onCanPlay = () => {
                        cleanup();
                        resolve();
                    };

                    const onError = (e: Event) => {
                        cleanup();
                        reject(e);
                    };

                    const cleanup = () => {
                        audio!.removeEventListener('canplay', onCanPlay);
                        audio!.removeEventListener('error', onError);
                    };

                    audio!.addEventListener('canplay', onCanPlay, { once: true });
                    audio!.addEventListener('error', onError, { once: true });
                    audio!.load();
                });
            }

            if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                return;
            }

            await audio.play();

            if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                return;
            }

            setPlayingCallId(callId);
            setLoadingCallId(null);
        } catch (error: any) {
            if (playbackRequestsRef.current.get(callId) !== nextRequestId) {
                return;
            }
            if (error.name !== 'AbortError') {
                console.error('Error playing audio:', error);
            }
            setPlayingCallId(null);
            setLoadingCallId(null);
        }
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
        <Card className="border-border/60 shadow-sm">
            <CardHeader className="border-b border-border/60">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">Call History</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            {!showLoading && calls.length > 0 && (
                                `${totalCount} total call${totalCount === 1 ? '' : 's'}`
                            )}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Select value={agentFilter} onValueChange={handleAgentFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by agent" />
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
                        <CallsLimitSelector currentLimit={serverLimit} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
            {showLoading ? (
                    <div className="p-6 space-y-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center justify-between border-b border-border/40 pb-4 last:border-0">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-slate-100 animate-pulse" />
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
                                        <div className="h-3 w-24 rounded bg-slate-100 animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="h-4 w-20 rounded bg-slate-100 animate-pulse" />
                                    <div className="h-6 w-24 rounded-full bg-slate-100 animate-pulse" />
                                    <div className="h-8 w-16 rounded bg-slate-100 animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : calls.length === 0 ? (
                    <div className="p-12 text-center">
                        <Phone className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No calls found</h3>
                        <p className="text-muted-foreground text-sm">
                            {agentFilter !== 'all' 
                                ? 'No calls found for the selected agent'
                                : 'Start making calls to see them appear here'
                            }
                        </p>
                    </div>
                ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[220px] px-6">Agent</TableHead>
                                    <TableHead className="w-[160px] px-4">Status</TableHead>
                                    <TableHead className="w-[200px] px-4">Customer</TableHead>
                                    <TableHead className="w-[140px] px-4">Duration</TableHead>
                                    <TableHead className="w-[80px] px-4">Recording</TableHead>
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
                                    const recordingUrl = (call.data as any).stereoRecordingUrl;
                                    const isPlaying = playingCallId === call.id;
                                    const isLoading = loadingCallId === call.id;

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
                                                <TableCell className="px-4 align-middle">
                                                    {recordingUrl ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleAudioPlayback(call.id, recordingUrl);
                                                            }}
                                                            disabled={isLoading}
                                                            className="h-8 w-8 rounded-full p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 disabled:opacity-70"
                                                            aria-label={isLoading ? "Loading..." : isPlaying ? "Pause recording" : "Play recording"}
                                                        >
                                                            {isLoading ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : isPlaying ? (
                                                                <Pause className="h-4 w-4" />
                                                            ) : (
                                                                <Play className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">N/A</span>
                                                    )}
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
                                                    <TableCell colSpan={6} className="px-6 pb-6 pt-4">
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
                )}
            </CardContent>
            {/* Pagination */}
            {totalPages > 1 && !showLoading && calls.length > 0 && (
                <div className="border-t border-border/60 px-6 py-4">
                    <CallsPagination
                        currentPage={currentPage}
                        totalPages={Math.max(totalPages, 1)}
                    />
                </div>
            )}
        </Card>
    );
}
