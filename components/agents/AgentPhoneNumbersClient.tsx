'use client'

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Phone, Loader2, CheckCircle, Plus } from "lucide-react";
import { assignPhoneNumberToAgent } from "@/app/api/phone-numbers/assignToAgent";
import { unassignPhoneNumberFromAgent } from "@/app/api/phone-numbers/unassignFromAgent";
import { toast } from "sonner";

interface PhoneNumber {
    id: string;
    phone_number: string;
    source: string;
    twilio_account_sid: string;
    created_at: string;
    agent_id?: string;
}

interface AgentPhoneNumbersClientProps {
    agentId: string;
    assignedNumbers: PhoneNumber[];
    availableNumbers: PhoneNumber[];
    agentName: string;
}

export function AgentPhoneNumbersClient({ 
    agentId, 
    assignedNumbers, 
    availableNumbers, 
    agentName 
}: AgentPhoneNumbersClientProps) {
    const [isAssigning, setIsAssigning] = useState<string | null>(null);
    const [isUnassigning, setIsUnassigning] = useState<string | null>(null);
    const [localAssignedNumbers, setLocalAssignedNumbers] = useState(assignedNumbers);
    const [localAvailableNumbers, setLocalAvailableNumbers] = useState(availableNumbers);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleAssign = async (phoneNumberId: string, phoneNumber: string) => {
        setIsAssigning(phoneNumberId);
        
        try {
            const result = await assignPhoneNumberToAgent(phoneNumberId, agentId);
            
            if (result.success) {
                // Move the phone number from available to assigned
                const numberToMove = localAvailableNumbers.find(num => num.id === phoneNumberId);
                if (numberToMove) {
                    setLocalAssignedNumbers(prev => [...prev, { ...numberToMove, agent_id: agentId }]);
                    setLocalAvailableNumbers(prev => prev.filter(num => num.id !== phoneNumberId));
                }
                setIsModalOpen(false);
                toast.success(`Phone number ${phoneNumber} assigned to ${agentName}`);
            } else {
                toast.error(`Failed to assign phone number: ${result.error}`);
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsAssigning(null);
        }
    };

    const handleUnassign = async (phoneNumberId: string, phoneNumber: string) => {
        setIsUnassigning(phoneNumberId);
        
        try {
            const result = await unassignPhoneNumberFromAgent(phoneNumberId);
            
            if (result.success) {
                // Move the phone number from assigned to available
                const numberToMove = localAssignedNumbers.find(num => num.id === phoneNumberId);
                if (numberToMove) {
                    const unassignedNumber = { ...numberToMove, agent_id: undefined };
                    setLocalAvailableNumbers(prev => [...prev, unassignedNumber]);
                    setLocalAssignedNumbers(prev => prev.filter(num => num.id !== phoneNumberId));
                }
                toast.success(`Phone number ${phoneNumber} unassigned from ${agentName}`);
            } else {
                toast.error(`Failed to unassign phone number: ${result.error}`);
            }
        } catch (error) {
            toast.error('An unexpected error occurred');
        } finally {
            setIsUnassigning(null);
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Connected Phone Numbers
                        </CardTitle>
                        <CardDescription>
                            Phone numbers currently assigned to {agentName}
                        </CardDescription>
                    </div>
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Number
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-none max-h-[80vh] overflow-y-auto w-fit min-w-[600px] max-w-[90vw]">
                            <DialogHeader>
                                <DialogTitle>Available Phone Numbers</DialogTitle>
                                <DialogDescription>
                                    Select a phone number to assign to {agentName} ({localAvailableNumbers.length} available)
                                </DialogDescription>
                            </DialogHeader>
                            {localAvailableNumbers.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-2">
                                        No phone numbers available to assign.
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Import phone numbers from Twilio in the client settings to make them available for assignment.
                                    </p>
                                </div>
                            ) : (
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-auto">Phone Number</TableHead>
                                                <TableHead className="w-auto">Account SID</TableHead>
                                                <TableHead className="w-auto">Import Date</TableHead>
                                                <TableHead className="w-auto text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {localAvailableNumbers.map((number) => (
                                                <TableRow key={number.id}>
                                                    <TableCell className="font-medium whitespace-nowrap">
                                                        {number.phone_number}
                                                    </TableCell>
                                                    <TableCell className="font-mono text-sm whitespace-nowrap">
                                                        {number.twilio_account_sid ? 
                                                            `${number.twilio_account_sid.substring(0, 10)}...` : 
                                                            'N/A'
                                                        }
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground whitespace-nowrap">
                                                        {new Date(number.created_at).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            onClick={() => handleAssign(number.id, number.phone_number)}
                                                            disabled={isAssigning === number.id}
                                                            size="sm"
                                                            variant="outline"
                                                            className="whitespace-nowrap"
                                                        >
                                                            {isAssigning === number.id ? (
                                                                <>
                                                                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                                    Assigning...
                                                                </>
                                                            ) : (
                                                                'Assign'
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {localAssignedNumbers.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-2">
                            No phone numbers connected to this agent.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Click "Add Number" above to assign a phone number to this agent.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-auto">Phone Number</TableHead>
                                    <TableHead className="w-auto">Account SID</TableHead>
                                    <TableHead className="w-auto">Status</TableHead>
                                    <TableHead className="w-auto">Assigned Date</TableHead>
                                    <TableHead className="w-auto text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {localAssignedNumbers.map((number) => (
                                    <TableRow key={number.id}>
                                        <TableCell className="font-medium whitespace-nowrap">
                                            {number.phone_number}
                                        </TableCell>
                                        <TableCell className="font-mono text-sm whitespace-nowrap">
                                            {number.twilio_account_sid ? 
                                                `${number.twilio_account_sid.substring(0, 10)}...` : 
                                                'N/A'
                                            }
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="bg-green-100 text-green-800 whitespace-nowrap">
                                                Connected
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground whitespace-nowrap">
                                            {new Date(number.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                onClick={() => handleUnassign(number.id, number.phone_number)}
                                                disabled={isUnassigning === number.id}
                                                size="sm"
                                                variant="outline"
                                                className="whitespace-nowrap"
                                            >
                                                {isUnassigning === number.id ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                                        Unassigning...
                                                    </>
                                                ) : (
                                                    'Unassign'
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
