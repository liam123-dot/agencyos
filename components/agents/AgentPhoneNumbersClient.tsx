'use client'

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Phone, Loader2, CheckCircle } from "lucide-react";
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

    return (
        <div className="space-y-6">
            {/* Connected Phone Numbers */}
            {localAssignedNumbers.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            Connected Phone Numbers
                        </CardTitle>
                        <CardDescription>
                            Phone numbers currently assigned to {agentName}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Account SID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Assigned Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localAssignedNumbers.map((number) => (
                                        <TableRow key={number.id}>
                                            <TableCell className="font-medium">
                                                {number.phone_number}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {number.twilio_account_sid ? 
                                                    `${number.twilio_account_sid.substring(0, 10)}...` : 
                                                    'N/A'
                                                }
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="default" className="bg-green-100 text-green-800">
                                                    Connected
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(number.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Available Phone Numbers */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5" />
                        Available Phone Numbers
                    </CardTitle>
                    <CardDescription>
                        Phone numbers that can be assigned to {agentName} ({localAvailableNumbers.length} available)
                    </CardDescription>
                </CardHeader>
                <CardContent>
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
                                        <TableHead>Phone Number</TableHead>
                                        <TableHead>Account SID</TableHead>
                                        <TableHead>Import Date</TableHead>
                                        <TableHead className="w-[120px]">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {localAvailableNumbers.map((number) => (
                                        <TableRow key={number.id}>
                                            <TableCell className="font-medium">
                                                {number.phone_number}
                                            </TableCell>
                                            <TableCell className="font-mono text-sm">
                                                {number.twilio_account_sid ? 
                                                    `${number.twilio_account_sid.substring(0, 10)}...` : 
                                                    'N/A'
                                                }
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(number.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    onClick={() => handleAssign(number.id, number.phone_number)}
                                                    disabled={isAssigning === number.id}
                                                    size="sm"
                                                    variant="outline"
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
                </CardContent>
            </Card>
        </div>
    );
}
