'use client'

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CallDetailsDialog } from "./CallDetailsDialog";

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
    data: any;
    created_at: string;
    updated_at: string;
    agents: Agent | null;
}

interface CallsTableProps {
    calls: Call[];
    isLoading?: boolean;
}

export function CallsTable({ calls, isLoading }: CallsTableProps) {
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const handleRowClick = (call: Call) => {
        setSelectedCall(call);
        setDialogOpen(true);
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getAgentName = (agent: Agent | null) => {
        // Handle case where agent might be null or undefined
        if (!agent) {
            return 'Unknown Agent';
        }
        
        // Handle case where agent might be an unexpected object type
        if (typeof agent !== 'object' || !agent.platform_id) {
            console.error('Invalid agent object:', agent);
            return 'Unknown Agent';
        }
        
        // Extract name from agent data based on platform
        if (agent.platform === 'vapi' && agent.data?.name) {
            return agent.data.name;
        }
        return `Agent ${agent.platform_id.slice(-8)}`;
    };

    const getCallStatus = (callData: any) => {
        // Extract status from call data if available
        if (callData?.status) {
            // Ensure we return a string, not an object
            return typeof callData.status === 'string' ? callData.status : String(callData.status);
        }
        return 'completed';
    };

    if (isLoading) {
        return <CallsTableSkeleton />;
    }

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Calls</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Agent</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {calls.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        No calls found
                                    </TableCell>
                                </TableRow>
                            ) : (
                                calls.map((call) => (
                                    <TableRow
                                        key={call.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => handleRowClick(call)}
                                    >
                                        <TableCell className="font-medium">
                                            {getAgentName(call.agents)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDuration(call.seconds)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge 
                                                variant={getCallStatus(call.data) === 'completed' ? 'default' : 'secondary'}
                                            >
                                                {getCallStatus(call.data)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <CallDetailsDialog
                call={selectedCall}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </>
    );
}

function CallsTableSkeleton() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Agent</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                                <TableCell>
                                    <Skeleton className="h-4 w-32" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-16" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </TableCell>
                                <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
