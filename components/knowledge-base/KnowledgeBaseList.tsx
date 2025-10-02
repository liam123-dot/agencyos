import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getKnowledgeBases } from "@/app/api/knowledge-base/knowledgeBaseActions"
import { CreateKnowledgeBaseDialog } from "./CreateKnowledgeBaseDialog"
import { KnowledgeBaseRow } from "./KnowledgeBaseRow"

interface KnowledgeBase {
    id: string
    name: string
    client_id: string
    organization_id: string
    created_at: string
    updated_at: string
}

export async function KnowledgeBaseList() {
    const knowledgeBases: KnowledgeBase[] = await getKnowledgeBases()

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Knowledge Bases</CardTitle>
                        <CardDescription>
                            Manage your knowledge bases and their content.
                        </CardDescription>
                    </div>
                    <CreateKnowledgeBaseDialog />
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Updated</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {knowledgeBases.length > 0 ? (
                            knowledgeBases.map((kb) => (
                                <KnowledgeBaseRow key={kb.id} knowledgeBase={kb} />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-8">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="text-muted-foreground">No knowledge bases found.</span>
                                        <span className="text-sm text-muted-foreground">Create your first knowledge base to get started.</span>
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
