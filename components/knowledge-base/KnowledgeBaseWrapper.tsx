import { getKnowledgeBaseById } from "@/app/api/knowledge-base/knowledgeBaseActions"
import { ManageKnowledgeBase } from "./ManageKnowledgeBase"

interface KnowledgeBase {
    id: string
    name: string
    client_id: string
    organization_id: string
    created_at: string
    updated_at: string
}

interface KnowledgeBaseWrapperProps {
    knowledgeBaseId: string
}

export async function KnowledgeBaseWrapper({ knowledgeBaseId }: KnowledgeBaseWrapperProps) {
    const knowledgeBase: KnowledgeBase = await getKnowledgeBaseById(knowledgeBaseId)

    return (
        <ManageKnowledgeBase 
            knowledgeBaseId={knowledgeBaseId}
            knowledgeBaseName={knowledgeBase.name}
        />
    )
}
