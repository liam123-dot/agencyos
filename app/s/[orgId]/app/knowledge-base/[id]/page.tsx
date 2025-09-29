import { KnowledgeBaseWrapper } from "@/components/knowledge-base/KnowledgeBaseWrapper";

export default async function KnowledgeBasePage({params}: {params: Promise<{id: string}>}) {
    const {id} = await params

    return (
        <div className="container mx-auto py-6">
            <KnowledgeBaseWrapper knowledgeBaseId={id} />
        </div>
    )
}