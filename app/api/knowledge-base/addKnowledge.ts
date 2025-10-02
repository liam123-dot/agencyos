'use server'

import { revalidatePath } from "next/cache"
import { clientDashboardAuth } from "../clients/clientDashboardAuth"
import { FileKnowledgeDTO, TextKnowledgeDTO, FileKnowledge } from "@/lib/types/knowledge"
import { scrapeWebsite } from "./firecrawl"
import { Ragie } from "ragie"
import { after } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { SupabaseClient } from "@supabase/supabase-js"
import { ConnectorSource } from "ragie/models/components/connectorsource"
import { redirect } from "next/navigation"


export async function addMultipleWebsiteKnowledge(
    urls: string[],
    knowledgeBaseId: string,
    clientId?: string
): Promise<{ success: true }> {
    // Validate inputs
    if (!urls || urls.length === 0) {
        throw new Error('URLs array is required and cannot be empty')
    }
    
    if (!knowledgeBaseId) {
        throw new Error('Knowledge base ID is required')
    }

    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)
    
    // Normalize and de-duplicate incoming URLs
    const normalizedSet = new Set<string>()
    const normalizedUrls: string[] = []
    for (const raw of urls) {
        const normalized = normalizeUrl(raw)
        if (!normalized) {
            continue
        }
        if (!normalizedSet.has(normalized)) {
            normalizedSet.add(normalized)
            normalizedUrls.push(normalized)
        }
    }

    if (normalizedUrls.length === 0) {
        throw new Error('No valid URLs to add')
    }

    // Process each URL
    for (const url of normalizedUrls) {
        try {
            // Validate URL format
            new URL(url)
            
            // Skip if an identical URL already exists for this client/org/base
            const { data: existing } = await supabaseServerClient
                .from('knowledge')
                .select('id')
                .eq('type', 'website')
                .eq('url', url)
                .eq('client_id', client.id)
                .eq('organization_id', client.organization_id)
                .eq('knowledge_base_id', knowledgeBaseId)
                .limit(1)
                .maybeSingle()

            if (existing) {
                continue
            }

            const { data, error } = await supabaseServerClient.from('knowledge').insert({
                type: 'website',
                url: url,
                client_id: client.id,
                organization_id: client.organization_id,
                status: 'not-started',
                knowledge_base_id: knowledgeBaseId,
                title: new URL(url).hostname
            })
            
            if (error) {
                console.error('Database error for URL', url, ':', error)
                throw new Error(`Failed to add ${url}: ${error.message}`)
            }
            
        } catch (error) {
            console.error('Error processing URL', url, ':', error)
            throw new Error(`Failed to process URLs: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }
    
    // Revalidate the knowledge base page to refresh the data
    revalidatePath(`/s/${client.organization_id}/app/knowledge-base`, 'page')
    revalidatePath(`/s/${client.organization_id}/app/knowledge-base/${knowledgeBaseId}`, 'page')
    
    return { success: true }
}

export async function addTextKnowledge(
    knowledgeBaseId: string,
    textDTO: TextKnowledgeDTO, 
    clientId?: string
): Promise<{ success: true }> {
    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)

    if (!textDTO?.content?.trim()) {
        throw new Error('Text content is required')
    }

    // Create initial knowledge record in processing state
    const { data: inserted, error: insertError } = await supabaseServerClient
        .from('knowledge')
        .insert({
            type: 'text',
            title: textDTO.title,
            content: textDTO.content,
            word_count: textDTO.wordCount,
            client_id: client.id,
            organization_id: client.organization_id,
            knowledge_base_id: knowledgeBaseId,
            status: 'processing'
        })
        .select('id')
        .single()

    if (insertError) {
        throw insertError
    }

    // Create a Ragie document from the raw text
    const ragieResponse = await ragie.documents.createRaw({
        data: textDTO.content,
        partition: knowledgeBaseId,
        metadata: {
            knowledge_base_id: knowledgeBaseId
        }
    })

    // Link the Ragie document to the knowledge record and move to processing-ragie
    await supabaseServerClient
        .from('knowledge')
        .update({
            status: 'processing-ragie',
            external_id: ragieResponse.id
        })
        .eq('id', inserted.id)

    // Revalidate pages to refresh UI
    revalidatePath(`/s/${client.organization_id}/app/knowledge-base`, 'page')
    revalidatePath(`/s/${client.organization_id}/app/knowledge-base/${knowledgeBaseId}`, 'page')

    return { success: true }
}

export async function addFileKnowledge(
    fileDTO: FileKnowledgeDTO, 
    file: File, 
    knowledgeBaseId: string,
    clientId?: string
): Promise<FileKnowledge> {
    // TODO: Implement actual logic
    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)
    
    // Validate file
    if (!file) {
        throw new Error('No file provided')
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
        throw new Error('File size must be less than 10MB')
    }

    // Supported file types
    const supportedTypes = [
        'application/pdf',
        'text/csv',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
        'application/msword', // .doc
        'image/jpeg',
        'image/png'
    ];

    if (!supportedTypes.includes(file.type)) {
        throw new Error('Unsupported file type. Supported types: PDF, CSV, TXT, DOC, DOCX, JPEG, PNG')
    }

    // TODO: Upload file to storage
    // TODO: Insert into database with fileDTO data
    // TODO: Call Supermemory API if needed
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('containerTags', knowledgeBaseId)

    const response = await fetch('https://api.supermemory.ai/v3/documents/file', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.SUPERMEMORY_API_KEY}`
        },
        body: formData
    })

    console.log('supermemory response', response)

    const data = await response.json()

    console.log('supermemory data', data)

    const {error: knowledgeError} = await supabaseServerClient.from('knowledge').insert({
        type: fileDTO.type,
        title: fileDTO.title,
        file_name: file.name,
        client_id: client.id,
        organization_id: client.organization_id,
        status: 'processing',
        knowledge_base_id: knowledgeBaseId,
        external_id: data.id,
        created_at: new Date(),
        updated_at: new Date()
    })

    console.log('supermemory knowledge error', knowledgeError)
    
    const knowledge = await fetchKnowledgeFromExternalId(supabaseServerClient, data.id)

    // Mock response for testing
    return {
        id: knowledge?.id,
        ...fileDTO,
        clientId: client.id,
        organizationId: client.organizationId,
        externalId: data.id,
        status: 'processing',
        knowledgeBaseId: knowledgeBaseId,
        uploadStatus: 'completed',
        created_at: new Date(),
        updated_at: new Date()
    }
}

export async function checkKnowledgeStatus(clientId?: string) {
    console.log('Checking knowledge statuses for', clientId)
    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)
    const { data, error } = await supabaseServerClient
        .from('knowledge')
        .select('id, status, external_id, type, knowledge_base_id')
        .eq('client_id', client.id)
        .eq('organization_id', client.organization_id)

    if (error) {
        console.error('Error loading knowledge for status checks:', error)
        return
    }

    if (!data || data.length === 0) {
        return
    }

    // Process sequentially to avoid unhandled promise rejections and to reduce rate limiting risk
    for (const item of data) {
        try {
            // Handle Ragie-tracked documents
            if ((item.status === 'processing-ragie' && item.external_id) || (item.type === 'website' && item.status === 'processing' && item.external_id)) {
                const document = await ragie.documents.get({
                    documentId: item.external_id,
                    partition: item.knowledge_base_id
                })
                const ragieStatus = document?.status

                let newStatus: string | null = null
                if (ragieStatus === 'ready') {
                    newStatus = 'succeeded'
                } else if (ragieStatus === 'failed') {
                    newStatus = 'failed'
                } else {
                    // Keep in processing-ragie state while Ragie is still working
                    newStatus = item.status === 'processing-ragie' ? null : 'processing-ragie'
                }

                if (newStatus && newStatus !== item.status) {
                    await supabaseServerClient.from('knowledge').update({status: newStatus}).eq('id', item.id)
                }
                continue
            }

            // Handle Supermemory-tracked documents (files) stuck in processing with an external_id
            if (item.status === 'processing' && item.external_id && (item.type === 'file')) {
                const supermemoryStatus = await fetchSupermemoryDocumentStatus(item.external_id)
                if (!supermemoryStatus) {
                    continue
                }

                let newStatus: string | null = null
                if (supermemoryStatus === 'ready') {
                    newStatus = 'succeeded'
                } else if (supermemoryStatus === 'failed') {
                    newStatus = 'failed'
                } else {
                    // remain in processing
                    newStatus = null
                }

                if (newStatus && newStatus !== item.status) {
                    await supabaseServerClient.from('knowledge').update({status: newStatus}).eq('id', item.id)
                }
                continue
            }
        } catch (e) {
            console.error('Error checking status for knowledge item', item.id, e)
        }
    }
    return
}

export async function getKnowledge(knowledgeBaseId: string, clientId?: string) {
    const { client, supabaseServerClient } = await clientDashboardAuth(clientId)
    const { data, error } = await supabaseServerClient.from('knowledge').select('*').eq('knowledge_base_id', knowledgeBaseId).eq('client_id', client.id).eq('organization_id', client.organization_id)
    console.log('getting')
    if (error) {
        console.error('Error fetching knowledge:', error)
        return []
    
    }

    if (!data || data.length === 0) {
        return []
    }

    // if any have not-started, kick off the processing
    if (data.some(item => item.status === 'not-started')) {
        after(() => {
            processKnowledge(client.id)
        })
    }

    if (data.some(item => item.status === 'processing-ragie')) {
        after(() => {
            checkKnowledgeStatus(client.id)
        })
    }

    // If any items are in processing with an external_id (e.g., Supermemory text/file, or inconsistent website state), trigger status checks
    if (data.some(item => item.status === 'processing' && item.external_id)) {
        after(() => {
            checkKnowledgeStatus(client.id)
        })
    }

    // Map database fields to TypeScript interface
    return data?.map(item => ({
        id: item.id,
        type: item.type,
        title: item.title,
        status: item.status,
        clientId: item.client_id,
        organizationId: item.organization_id,
        externalId: item.external_id,
        knowledgeBaseId: item.knowledge_base_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        // Website-specific fields
        url: item.url,
        scraped: item.scraped,
        scrapedContent: item.scraped_content,
        favicon: item.favicon,
        // File-specific fields
        fileName: item.file_name,
        fileSize: item.file_size,
        fileType: item.file_type,
        filePath: item.file_path,
        uploadStatus: item.upload_status,
        // Text-specific fields
        content: item.content,
        wordCount: item.word_count,
    })) || []
}

async function fetchKnowledgeFromExternalId(supabaseServerClient: SupabaseClient, externalId: string) {
    const { data, error } = await supabaseServerClient.from('knowledge').select('*').eq('external_id', externalId).single();
    if (error) {
        console.error('Error fetching knowledge from external ID:', error)
        return null
    }
    return data
}

async function processKnowledge(client_id: string) {

    const supabaseServerClient = await createServerClient()

    const { data } = await supabaseServerClient.from('knowledge').select('*').eq('client_id', client_id).eq('status', 'not-started')

    if (!data) {
        return
    }

    // all the ones we have, set to pending

    for (const item of data) {
        await supabaseServerClient.from('knowledge').update({status: 'pending'}).eq('id', item.id)
    }

    // now process the ones we have

    for (const item of data) {
        if (item.type === 'website') {
            const website = await fetchWebsiteKnowledge(supabaseServerClient, item.url, item.knowledge_base_id, item.id)
        }
    }

}

const ragie = new Ragie({auth: process.env.RAGIE_API_KEY})

async function fetchWebsiteKnowledge(supabaseServerClient: SupabaseClient, url: string, knowledge_base_id: string, knowledge_id: string) {

    // 

    const { data, error } = await supabaseServerClient.from('knowledge').update({status: 'processing'}).eq('id', knowledge_id)

    if (error) {
        console.error('Error updating knowledge status:', error)
    }

    const website = await scrapeWebsite(url)
    if (!website.success) {
        console.error('Error scraping website:', website.error)
        return
    }
    const ragieResponse = await ragie.documents.createDocumentFromUrl({
        url: url,
        partition: knowledge_base_id,
        metadata: {
            knowledge_base_id: knowledge_base_id
        }
    })

    console.log('ragieResponse', ragieResponse)
    
    await supabaseServerClient.from('knowledge').update({status: 'processing-ragie', external_id: ragieResponse.id}).eq('id', knowledge_id)

    return website


}

async function fetchSupermemoryDocumentStatus(documentId: string): Promise<string | null> {
    try {
        const response = await fetch(`https://api.supermemory.ai/v3/documents/${documentId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${process.env.SUPERMEMORY_API_KEY}`
            }
        })
        if (!response.ok) {
            console.error('Failed to fetch Supermemory document status', documentId, response.status)
            return null
        }
        const data = await response.json()
        return data?.status || null
    } catch (error) {
        console.error('Error fetching Supermemory document status', documentId, error)
        return null
    }
}

function normalizeUrl(raw: string): string | null {
    try {
        const url = new URL(raw.trim())
        url.protocol = url.protocol.toLowerCase()
        url.hostname = url.hostname.toLowerCase()
        url.hash = ''
        if (url.pathname.endsWith('/') && url.pathname !== '/') {
            url.pathname = url.pathname.replace(/\/+$/, '')
        }
        const trackingParams = new Set(['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'])
        const params = new URLSearchParams(url.search)
        for (const key of Array.from(params.keys())) {
            if (trackingParams.has(key)) {
                params.delete(key)
            }
        }
        const sorted = new URLSearchParams()
        Array.from(params.keys()).sort().forEach(k => {
            const values = params.getAll(k)
            values.forEach(v => sorted.append(k, v))
        })
        url.search = sorted.toString() ? `?${sorted.toString()}` : ''
        return `${url.protocol}//${url.host}${url.pathname}${url.search}`
    } catch {
        return null
    }
}


export async function createOauthRedirect(source: string, knowledgeBaseId: string) {

    const supabaseServerClient = await createServerClient()
    const { data: knowledgeBase, error: knowledgeBaseError } = await supabaseServerClient.from('knowledge_base').select('*').eq('id', knowledgeBaseId).single()

    if (knowledgeBaseError) {
        console.error('Error fetching knowledge base', knowledgeBaseError)
        throw new Error('Failed to fetch knowledge base')
    }

    const { data: organization, error: organizationError } = await supabaseServerClient.from('organizations').select('*').eq('id', knowledgeBase.organization_id).single()
    if (organizationError) {
        console.error('Error fetching organization', organizationError)
        throw new Error('Failed to fetch organization')
    }

    console.log('knowledge base', knowledgeBase)

    const redirectUri = `https://${organization.domain}/app/knowledge-base/${knowledgeBaseId}`
    console.log('redirectUri', redirectUri)
    
    const result = await ragie.connections.createOAuthRedirectUrl({
        sourceType: source as ConnectorSource,
        partition: knowledgeBaseId,
        redirectUri: redirectUri,
        metadata: {
            knowledge_base_id: knowledgeBaseId,
            organization_id: knowledgeBase.organization_id
        }
    })

    console.log('oauth redirect', result)

    redirect(result.url)

}

export async function getConnections(knowledgeBaseId: string) {
    const result = await ragie.connections.list({
        partition: knowledgeBaseId
    })
    return result.result.connections
}

export async function deleteConnection(connectionId: string) {
    const result = await ragie.connections.delete({connectionId: connectionId, deleteConnectionPayload: {keepFiles: true}})
    console.log('connection deleted', result)
    return result
}
