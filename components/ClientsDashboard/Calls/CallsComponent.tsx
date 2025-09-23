'use client'

import { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, Download, Phone, Filter, Play } from "lucide-react";
import { getCalls } from "./CallsServerComponent";
import { CallsPagination } from "./CallsPagination";
import { CallsLimitSelector } from "./CallsLimitSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { CallDetailsDialog } from "./CallDetailsDialog";
import { Vapi } from "@vapi-ai/server-sdk";

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
    data: Vapi.Call;
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
    
    // Modal state
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

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
            console.log('clientId', clientId);
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
            console.error('Error loading calls:', err);
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

    const handleViewDetails = (call: Call) => {
        setSelectedCall(call);
        setDialogOpen(true);
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

    const getStatusVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'default';
            case 'failed':
                return 'destructive';
            case 'in progress':
                return 'secondary';
            default:
                return 'secondary';
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
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Call History</h1>
                    <p className="text-muted-foreground text-sm">
                        View and manage all calls made through your agents
                    </p>
                </div>
            </div>

            {/* Search and Filters */}
            {/* <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search calls by phone number, agent, or transcript..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={handleStatusFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="in progress">In Progress</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={agentFilter} onValueChange={handleAgentFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="All Agents" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Agents</SelectItem>
                            {uniqueAgents.map((agent) => (
                                <SelectItem key={agent.id} value={agent.id}>
                                    {getAgentName(agent)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div> */}

            {/* Calls List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Recent Calls</h2>
                        <p className="text-sm text-muted-foreground">
                            {showLoading ? (
                                "Loading..."
                            ) : (
                                `Showing ${calls.length} of ${totalCount} calls`
                            )}
                        </p>
                    </div>
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        More Filters
                    </Button>
                </div>

                {showLoading ? (
                    <div className="space-y-2">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-muted rounded-full animate-pulse" />
                                            <div className="space-y-1">
                                                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                                <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                                            <div className="h-6 w-20 bg-muted rounded-full animate-pulse" />
                                            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : calls.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
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
                    <div className="space-y-2">
                        {calls.map((call) => {
                            console.log(call)
                            const status = getCallStatus(call.data);
                            const agentName = getAgentName(call.agents);
                            const duration = formatDuration(call.seconds);
                            const timeAgo = formatDistanceToNow(new Date(call.created_at), { addSuffix: true });
                            
                            // Extract dynamic data from call object
                            
                            const type = call.data.type; // can be webCall, inboundPhoneCall, outboundPhoneCall
                            const phoneDisplay = getPhoneDisplay(call.data);
                            const description = call.data.analysis?.summary
                            const outcome = call.data.endedReason

                            return (
                                <Card key={call.id}>
                                    <CardContent className="p-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-xs ${
                                                    status === 'completed' ? 'bg-green-500' : 
                                                    status === 'failed' ? 'bg-red-500' : 
                                                    status === 'in progress' ? 'bg-yellow-500' : 'bg-gray-500'
                                                }`}>
                                                    {status === 'completed' && '✓'}
                                                    {status === 'failed' && '✕'}
                                                    {status === 'in progress' && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="font-medium text-sm">{agentName}</span>
                                                        <Badge variant={getStatusVariant(status)} className="text-xs capitalize">
                                                            {status}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">{timeAgo}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                                                        <span>{phoneDisplay}</span>
                                                        <span>{duration}</span>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground max-w-md truncate">
                                                        {description}
                                                    </p>
                                                    {outcome && (
                                                        <p className="text-xs font-medium">
                                                            Outcome: {outcome}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(call)}>
                                                <Play className="h-4 w-4 mr-2" />
                                                View Details
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
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
            <CallDetailsDialog
                call={selectedCall}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    );
}
