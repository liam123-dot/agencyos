'use server'

import { getClientAgents } from "@/app/api/agents/getClientAgents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UnassignAgentButton } from "./UnassignAgentButton"

export async function ClientAgentsListServer({ clientId }: { clientId: string }) {
    const agents = await getClientAgents(clientId)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Assigned Agents</CardTitle>
                <CardDescription>
                    Agents currently assigned to this client.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Platform</TableHead>
                            <TableHead>Last Modified</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agents.length > 0 ? (
                            agents.map((agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">
                                        {agent.data?.name || 'Unnamed Agent'}
                                    </TableCell>
                                    <TableCell className="capitalize">
                                        {agent.platform}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(agent.updated_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <UnassignAgentButton 
                                            agentId={agent.id}
                                            agentName={agent.data?.name || 'Unnamed Agent'}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground">
                                    No agents assigned to this client.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
