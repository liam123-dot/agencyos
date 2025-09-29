export type KnowledgeType = 'website' | 'file' | 'text'
export type KnowledgeStatus = 'not-started' | 'pending' | 'processing' | 'processing-ragie' | 'failed' | 'succeeded'

export interface BaseKnowledge {
    id: string
    type: KnowledgeType
    title: string
    status: KnowledgeStatus
    clientId?: string
    organizationId: string
    externalId?: string
    knowledgeBaseId?: string
    created_at: string | Date
    updated_at: string | Date
}

export interface BaseKnowledgeDTO {
    type: KnowledgeType
    title: string
    status?: KnowledgeStatus
}

export interface WebsiteKnowledge extends BaseKnowledge {
    type: 'website'
    url: string
}

export interface WebsiteKnowledgeDTO extends BaseKnowledgeDTO {
    type: 'website'
    url: string
}

export interface FileKnowledge extends BaseKnowledge {
    type: 'file'
    fileName: string
    // fileUrl: string
    uploadStatus: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface FileKnowledgeDTO extends BaseKnowledgeDTO {
    type: 'file'
    fileName: string
    uploadStatus?: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface TextKnowledge extends BaseKnowledge {
    type: 'text'
    content: string
    wordCount: number
}

export interface TextKnowledgeDTO extends BaseKnowledgeDTO {
    type: 'text'
    content: string
    wordCount: number
}

export type Knowledge = WebsiteKnowledge | FileKnowledge | TextKnowledge
export type KnowledgeDTO = WebsiteKnowledgeDTO | FileKnowledgeDTO | TextKnowledgeDTO

export interface KnowledgeBase {
    id: string
    name: string
    clientId?: string
    organizationId: string
    items: Knowledge[]
    totalItems: number
    created_at: string | Date
    updated_at: string | Date
}
