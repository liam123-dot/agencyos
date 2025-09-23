
'use server'

import { getClientAgents } from "@/app/api/agents/getClientAgents"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { headers } from "next/headers"


export async function ClientAgentsListServer({ clientId, orgId }: { clientId?: string; orgId?: string }) {
    console.log('clientId', clientId)
    console.log('orgId', orgId)
    const agents = await getClientAgents(clientId)
    
    // Get domain context from middleware
    const headersList = await headers()
    const isMainDomain = headersList.get('x-is-main-domain') === 'true'
    
    // Only use s/[orgId] prefix if we're on the main domain AND have an orgId
    // If we're on a subdomain, never use the s/[orgId] prefix
    const shouldUsePlatformPrefix = isMainDomain && !!orgId
    const baseUrl = shouldUsePlatformPrefix ? `/s/${orgId}` : ''
    const queryString = clientId ? `?client_id=${clientId}` : ''
    
    console.log('isMainDomain', isMainDomain)
    console.log('shouldUsePlatformPrefix', shouldUsePlatformPrefix)
    console.log('baseUrl', baseUrl)
    console.log('queryString', queryString)

    return (
        <Card>
            <CardHeader>
                <div>
                    <CardTitle>Agents</CardTitle>
                    <CardDescription>
                        A list of your agents.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Last Modified</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {agents.length > 0 ? (
                            agents.map((agent) => {
                                const agentUrl = `${baseUrl}/app/agents/${agent.id}${queryString}`
                                return (
                                    <TableRow key={agent.id} className="cursor-pointer">
                                        <TableCell className="font-medium">
                                            <Link href={agentUrl} className="block">
                                                {agent.data?.name || 'Unnamed Agent'}
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Link href={agentUrl} className="block">
                                                {new Date(agent.updated_at).toLocaleDateString()}
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">
                                    No agents found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

