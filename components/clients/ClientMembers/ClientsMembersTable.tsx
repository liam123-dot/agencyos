import { getClientMembers } from "@/app/api/clients/clientMembers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import AddNewMember from "./AddNewMember"

export default async function ClientsMembersTable({clientId}: {clientId: string}) {
    const members = await getClientMembers(clientId)

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Client Members</CardTitle>
                        <CardDescription>
                            Manage members who have access to this client.
                        </CardDescription>
                    </div>
                    <AddNewMember clientId={clientId} />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[300px]">Member</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length > 0 ? (
                            members.map((member) => (
                                <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="text-xs">
                                                    {member.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium">{member.full_name || 'Unknown User'}</div>
                                                <div className="text-sm text-muted-foreground">{member.email}</div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            Active
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {member.created_at ? new Date(member.created_at).toLocaleDateString() : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-muted-foreground">No members found.</span>
                                        <span className="text-sm text-muted-foreground">Invite members to get started.</span>
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
