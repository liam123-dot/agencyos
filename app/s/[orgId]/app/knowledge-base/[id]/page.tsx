import { getConnections } from "@/app/api/knowledge-base/addKnowledge";
import { KnowledgeBaseWrapper } from "@/components/knowledge-base/KnowledgeBaseWrapper";

export default async function KnowledgeBasePage({params}: {params: Promise<{id: string}>}) {
    const {id} = await params
    await getConnections(id)
    return (
        <div className="p-4 md:p-6">
            <KnowledgeBaseWrapper knowledgeBaseId={id} />
        </div>
    )
}