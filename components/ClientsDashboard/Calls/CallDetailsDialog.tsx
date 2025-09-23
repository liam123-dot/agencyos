'use client'

import { formatDistanceToNow, format } from "date-fns";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Clock, Phone, User, Calendar, Download, MessageSquare } from "lucide-react";
import { Vapi } from "@vapi-ai/server-sdk";

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
}

interface CallDetailsDialogProps {
    call: Call | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CallDetailsDialog({ call, open, onOpenChange }: CallDetailsDialogProps) {
    if (!call) return null;

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
        
        if (agent.platform === 'vapi' && agent.data?.name) {
            return agent.data.name;
        }
        return `Agent ${agent.platform_id.slice(-8)}`;
    };

    const getCallStatus = (callData: any) => {
        if (callData?.status) {
            // Ensure we return a string, not an object
            return typeof callData.status === 'string' ? callData.status : String(callData.status);
        }
        return 'completed';
    };

    const getCallType = (callData: any) => {
        if (callData?.type) {
            // Ensure we return a string, not an object
            return typeof callData.type === 'string' ? callData.type : String(callData.type);
        }
        return 'unknown';
    };

    const getPhoneNumber = (callData: any) => {

        if (callData?.customer?.number) {
            // Ensure we return a string, not an object
            return typeof callData.customer.number === 'string' ? callData.customer.number : String(callData.customer.number);
        }
        return 'Unknown';
    };

    const getTranscript = (callData: any) => {
        if (callData?.transcript) {
            return callData.transcript;
        }
        if (callData?.messages && Array.isArray(callData.messages)) {
            return callData.messages
                .filter((msg: any) => msg.message)
                .map((msg: any) => `${msg.role}: ${msg.message}`)
                .join('\n');
        }
        return null;
    };

    const getAudioRecordingUrl = (callData: any) => {
        if (callData?.recordingUrl) {
            return callData.recordingUrl;
        }
        if (callData?.artifact?.recordingUrl) {
            return callData.artifact.recordingUrl;
        }
        return null;
    };

    const getEndReason = (callData: any) => {
        if (callData?.endedReason) {
            // Ensure we have a string before calling replace methods
            const reason = typeof callData.endedReason === 'string' ? callData.endedReason : String(callData.endedReason);
            return reason.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
        }
        return 'Unknown';
    };

    const isWebCall = (callData: any) => {
        return callData?.type === 'webCall';
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Call Details
                    </DialogTitle>
                    <DialogDescription>
                        View detailed information about this call
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <User className="h-4 w-4" />
                                Agent
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {getAgentName(call.agents)}
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Clock className="h-4 w-4" />
                                Duration
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {formatDuration(call.seconds)}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                                <Calendar className="h-4 w-4" />
                                Started
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(call.created_at), 'PPp')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium">Status</div>
                            <Badge 
                                variant={getCallStatus(call.data) === 'completed' ? 'default' : 'secondary'}
                            >
                                {getCallStatus(call.data)}
                            </Badge>
                        </div>
                    </div>

                    <Separator />

                    {/* Call Details */}
                    <div className="space-y-4">
                        <h3 className="font-medium">Call Information</h3>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Type:</span>
                                <span className="ml-2 text-muted-foreground capitalize">
                                    {getCallType(call.data).replace(/([A-Z])/g, ' $1').toLowerCase()}
                                </span>
                            </div>
                            
                            {!isWebCall(call.data) && (
                                <div>
                                    <span className="font-medium">Phone Number:</span>
                                    <span className="ml-2 text-muted-foreground">
                                        {getPhoneNumber(call.data)}
                                    </span>
                                </div>
                            )}
                            
                            <div>
                                <span className="font-medium">End Reason:</span>
                                <span className="ml-2 text-muted-foreground">
                                    {getEndReason(call.data)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Audio Recording */}
                    {getAudioRecordingUrl(call.data) && (
                        <>
                            <Separator />
                            
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-medium flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        Audio Recording
                                    </h3>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const link = document.createElement('a');
                                            link.href = getAudioRecordingUrl(call.data);
                                            link.download = `call-${call.id}.mp3`;
                                            link.click();
                                        }}
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>

                                <audio
                                    src={getAudioRecordingUrl(call.data)}
                                    preload="metadata"
                                    className="w-full"
                                    controls
                                />
                            </div>
                        </>
                    )}

                    {/* Call Summary */}
                    {call.data.analysis?.summary && (
                        <>
                            <Separator />
                            
                            <div className="space-y-4">
                                <h3 className="font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Call Summary
                                </h3>
                                
                                <div className="bg-muted/50 rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground">
                                        {call.data.analysis.summary}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Transcript */}
                    {getTranscript(call.data) && (
                        <>
                            <Separator />
                            
                            <div className="space-y-4">
                                <h3 className="font-medium flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Transcript
                                </h3>
                                
                                <div className="bg-muted/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                                    <pre className="text-sm whitespace-pre-wrap text-muted-foreground">
                                        {getTranscript(call.data)}
                                    </pre>
                                </div>
                            </div>
                        </>
                    )}


                    {/* Technical Details */}
                    {call.data && Object.keys(call.data).length > 0 && (
                        <>
                            <Separator />
                            
                            <div className="space-y-4">
                                <h3 className="font-medium">Technical Details</h3>
                                
                                <div className="text-xs">
                                    <div className="font-medium mb-2">Call ID:</div>
                                    <code className="text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                                        {call.id}
                                    </code>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
