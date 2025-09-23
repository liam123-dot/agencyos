'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Mail, Copy } from "lucide-react"
import { toast } from "sonner"

interface ClientInvite {
    id: string
    email: string
    token: string
    created_at: string
}

interface ClientsInvitesTableProps {
    invites: ClientInvite[]
    organizationId: string
    organizationDomain?: string
}

export default function ClientsInvitesTable({ invites, organizationId, organizationDomain }: ClientsInvitesTableProps) {
    
    const copyInviteLink = async (token: string) => {
        // Build the invite URL - using organization domain if available, otherwise current origin
        const baseUrl = organizationDomain ? `https://${organizationDomain}` : window.location.origin
        const inviteUrl = `${baseUrl}/invite?token=${token}`
        
        try {
            await navigator.clipboard.writeText(inviteUrl)
            toast.success("Invite link copied to clipboard!")
        } catch (error) {
            console.error('Failed to copy invite link:', error)
            toast.error("Failed to copy invite link")
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>Pending Invitations</CardTitle>
                    <CardDescription>
                        Members who have been invited but haven't joined yet.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Email</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Invited</TableHead>
                            <TableHead className="w-[120px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invites.length > 0 ? (
                            invites.map((invite) => (
                                <TableRow key={invite.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    <Mail className="h-4 w-4" />
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{invite.email}</div>
                                                <div className="text-sm text-muted-foreground">Invitation sent</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            Pending
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {invite.created_at ? new Date(invite.created_at).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyInviteLink(invite.token)}
                                            className="h-8 px-2"
                                        >
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy invite link
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-muted-foreground">No pending invitations.</span>
                                        <span className="text-sm text-muted-foreground">All invites have been accepted or there are no pending invites.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}