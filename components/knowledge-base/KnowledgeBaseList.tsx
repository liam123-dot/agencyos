import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText } from "lucide-react"
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
        <div className="space-y-6">
            <Card className="border-border/60 shadow-sm">
                <CardHeader className="border-b border-border/40 bg-muted/20">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-base font-medium">
                            <FileText className="h-4 w-4" />
                            Knowledge Bases ({knowledgeBases.length})
                        </CardTitle>
                        <CreateKnowledgeBaseDialog />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {knowledgeBases.length === 0 ? (
                        <div className="text-center py-12 px-6">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No knowledge bases yet</p>
                            <p className="text-sm text-muted-foreground mt-1">Create your first knowledge base to get started</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead>Updated</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {knowledgeBases.map((kb) => (
                                    <KnowledgeBaseRow key={kb.id} knowledgeBase={kb} />
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
