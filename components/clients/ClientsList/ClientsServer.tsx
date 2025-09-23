'use server'

import { getOrg } from "@/app/api/user/selected-organization/getOrg"
import { getClients } from "@/app/api/clients/getClients"
import { CreateClient } from "./CreateClient"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"

export async function ClientsServer() {
    const { organization } = await getOrg()

    if (!organization) {
        return <div>Organization not found</div>
    }

    const clients = await getClients(organization.id)

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Clients</CardTitle>
                        <CardDescription>
                            A list of clients for {organization.name}.
                        </CardDescription>
                    </div>
                    <CreateClient />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Created At</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clients.length > 0 ? (
                            clients.map((client) => (
                                <TableRow key={client.id} className="cursor-pointer">
                                    <TableCell className="font-medium">
                                        <Link href={`/app/clients/${client.id}`} className="block">
                                            {client.name}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/app/clients/${client.id}`} className="block">
                                            {new Date(client.created_at).toLocaleDateString()}
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={2} className="text-center">
                                    No clients found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

