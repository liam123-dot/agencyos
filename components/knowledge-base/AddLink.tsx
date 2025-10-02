'use client'

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X, Plus, Link as LinkIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { addMultipleWebsiteKnowledge, getKnowledge } from "@/app/api/knowledge-base/addKnowledge"
import { WebsiteKnowledge, WebsiteKnowledgeDTO } from "@/lib/types/knowledge"
import { mapWebsite } from "@/app/api/knowledge-base/firecrawl"

interface AddLinkProps {
    onSuccess?: () => void
    knowledgeBaseId: string
}

interface URLItem {
    id: string
    url: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    error?: string
}

export function AddLink({ onSuccess, knowledgeBaseId }: AddLinkProps) {
    const [inputUrl, setInputUrl] = useState('')
    const [urlList, setUrlList] = useState<URLItem[]>([])
    const [scrapeLoading, setScrapeLoading] = useState(false)
    const [addingAll, setAddingAll] = useState(false)
    const [storedKnowledge, setStoredKnowledge] = useState<WebsiteKnowledge[]>([])
    const [loadingStored, setLoadingStored] = useState(true)

    useEffect(() => {
        const fetchStoredKnowledge = async () => {
            try {
                setLoadingStored(true)
                const knowledge = await getKnowledge(knowledgeBaseId)
                // Filter for website type knowledge only
                const websiteKnowledge = knowledge.filter(item => item.type === 'website') as WebsiteKnowledge[]
                setStoredKnowledge(websiteKnowledge)
            } catch (error) {
                console.error('Error fetching stored knowledge:', error)
            } finally {
                setLoadingStored(false)
            }
        }
        
        fetchStoredKnowledge()
    }, [knowledgeBaseId])

    const normalizeUrl = (raw: string): string | null => {
        try {
            const url = new URL(raw.trim())
            // Lowercase protocol and host
            url.protocol = url.protocol.toLowerCase()
            url.hostname = url.hostname.toLowerCase()
            // Remove fragment
            url.hash = ''
            // Normalize trailing slash (keep root only)
            if (url.pathname.endsWith('/') && url.pathname !== '/') {
                url.pathname = url.pathname.replace(/\/+$/, '')
            }
            // Remove common tracking params and sort remaining
            const trackingParams = new Set(['utm_source','utm_medium','utm_campaign','utm_term','utm_content','gclid','fbclid'])
            const params = new URLSearchParams(url.search)
            for (const key of Array.from(params.keys())) {
                if (trackingParams.has(key)) {
                    params.delete(key)
                }
            }
            // Sort params for stable ordering
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

    const addUrlToList = () => {
        if (!inputUrl.trim()) {
            toast.error("Please enter a URL")
            return
        }
        
        const normalized = normalizeUrl(inputUrl)
        if (!normalized) {
            toast.error("Please enter a valid URL (e.g., https://example.com)")
            return
        }

        // Check for duplicates (normalized)
        if (urlList.some(item => item.url === normalized)) {
            toast.error("This URL is already in the list")
            return
        }

        const newUrl: URLItem = {
            id: Date.now().toString(),
            url: normalized,
            status: 'pending'
        }
        setUrlList(prev => [...prev, newUrl])
        setInputUrl('')
        toast.success("URL added to list")
    }

    const removeUrl = (id: string) => {
        setUrlList(prev => prev.filter(item => item.id !== id))
        toast.success("URL removed from list")
    }

    const clearAllUrls = () => {
        const urlCount = urlList.length
        setUrlList([])
        toast.success(`Cleared ${urlCount} URLs from list`)
    }

    const handleScrape = async () => {
        if (!inputUrl.trim()) {
            toast.error("Please enter a URL to scrape")
            return
        }

        setScrapeLoading(true)
        const toastId = toast.loading("Scraping website for links...")
        
        try {
            const normalizedInput = normalizeUrl(inputUrl)
            if (!normalizedInput) {
                toast.dismiss(toastId)
                toast.error("Please enter a valid URL (e.g., https://example.com)")
                return
            }
            const result = await mapWebsite(normalizedInput)
            
            toast.dismiss(toastId)
            
            // Handle server-side errors
            if (!result.success) {
                toast.error(result.message || "Failed to scrape website")
                return
            }
            
            // Add the original URL first (if not already in list)
            if (!urlList.some(item => item.url === normalizedInput)) {
                const newUrl: URLItem = {
                    id: Date.now().toString(),
                    url: normalizedInput,
                    status: 'pending'
                }
                setUrlList(prev => [...prev, newUrl])
            }
            
            let addedCount = 0
            
            // Add discovered links from response
            if (result.links && Array.isArray(result.links)) {
                const existingSet = new Set(urlList.map(u => u.url))
                const newUrls: URLItem[] = []
                for (const link of result.links) {
                    const normalized = normalizeUrl(link)
                    if (!normalized) continue
                    if (normalized === normalizedInput) continue
                    if (existingSet.has(normalized)) continue
                    existingSet.add(normalized)
                    newUrls.push({
                        id: `${Date.now()}-${Math.random()}`,
                        url: normalized,
                        status: 'pending'
                    })
                }
                
                if (newUrls.length > 0) {
                    setUrlList(prev => [...prev, ...newUrls])
                    addedCount = newUrls.length
                }
            }
            
            setInputUrl('')
            
            // Show success message from server or default
            if (result.message) {
                toast.success(result.message)
            } else if (addedCount > 0) {
                toast.success(`Successfully scraped and added ${addedCount} new URLs`)
            } else {
                toast.success("Original URL added (no additional links found)")
            }
            
        } catch (error) {
            toast.dismiss(toastId)
            // This should rarely happen now since errors are handled server-side
            console.error('Unexpected client-side error:', error)
            toast.error("An unexpected error occurred while scraping")
        } finally {
            setScrapeLoading(false)
        }
    }

    const handleAddAll = async () => {
        const pendingUrls = urlList.filter(item => item.status === 'pending')
        if (pendingUrls.length === 0) {
            toast.error("No URLs to add")
            return
        }
        
        setAddingAll(true)
        const toastId = toast.loading(`Adding ${pendingUrls.length} URLs to knowledge base...`)
        
        try {
            // Update pending URLs to processing status
            setUrlList(prev => prev.map(item => 
                item.status === 'pending' ? { ...item, status: 'processing' } : item
            ))
            
            // Extract URLs from pending items (normalized already); dedupe just in case
            const urlsToAdd = Array.from(new Set(pendingUrls.map(item => item.url)))
            
            // Call the batch add function
            const result = await addMultipleWebsiteKnowledge(urlsToAdd, knowledgeBaseId)
            
            if (result.success) {
                toast.dismiss(toastId)
                toast.success(`Successfully added all ${pendingUrls.length} URLs to knowledge base`)
                
                // Clear the URL list
                setUrlList([])
                
                // Refresh stored knowledge
                const knowledge = await getKnowledge(knowledgeBaseId)
                const websiteKnowledge = knowledge.filter(item => item.type === 'website') as WebsiteKnowledge[]
                setStoredKnowledge(websiteKnowledge)
                
                if (onSuccess) {
                    onSuccess()
                }
            }
            
        } catch (error) {
            toast.dismiss(toastId)
            
            // Update all processing URLs to error status
            setUrlList(prev => prev.map(item => 
                item.status === 'processing' 
                    ? { ...item, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
                    : item
            ))
            
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            toast.error(`Failed to add URLs: ${errorMessage}`)
            console.error('Batch add error:', error)
        } finally {
            setAddingAll(false)
        }
    }

    const getStatusColor = (status: URLItem['status']) => {
        switch (status) {
            case 'pending': return 'bg-gray-100 text-gray-800'
            case 'processing': return 'bg-blue-100 text-blue-800'
            case 'completed': return 'bg-green-100 text-green-800'
            case 'error': return 'bg-red-100 text-red-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusIcon = (status: URLItem['status']) => {
        switch (status) {
            case 'processing': return <Loader2 className="h-3 w-3 animate-spin" />
            case 'completed': return <LinkIcon className="h-3 w-3" />
            case 'error': return <X className="h-3 w-3" />
            default: return <LinkIcon className="h-3 w-3" />
        }
    }

    return (
        <div className="space-y-4">
            {urlList.length > 0 && (
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">URLs in queue:</span>
                    <Badge variant="secondary">
                        {urlList.length} URL{urlList.length !== 1 ? 's' : ''}
                    </Badge>
                </div>
            )}
            
            {/* URL Input Section */}
            <div className="flex space-x-2">
                <Input
                    type="url"
                    placeholder="https://example.com"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    disabled={scrapeLoading || addingAll}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault()
                            addUrlToList()
                        }
                    }}
                />
                <Button 
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addUrlToList}
                    disabled={!inputUrl.trim() || scrapeLoading || addingAll}
                >
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            
            {/* Action Buttons */}
            <div className="flex space-x-2">
                <Button 
                    type="button"
                    variant="outline"
                    onClick={handleScrape}
                    disabled={!inputUrl.trim() || scrapeLoading || addingAll}
                    className="flex-1"
                >
                    {scrapeLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Scraping...
                        </>
                    ) : (
                        'Scrape & Add Links'
                    )}
                </Button>
                
                {urlList.length > 0 && (
                    <Button 
                        type="button"
                        variant="outline"
                        onClick={clearAllUrls}
                        disabled={addingAll}
                    >
                        Clear All
                    </Button>
                )}
            </div>

            {/* URL List */}
            {urlList.length > 0 && (
                <div className="space-y-4">
                    <div className="border rounded-lg">
                        <div className="p-3 border-b bg-gray-50">
                            <h4 className="text-sm font-medium">URLs to Add</h4>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto">
                            <div className="p-2 space-y-2">
                                {urlList.map((urlItem) => (
                                    <div key={urlItem.id} className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50 gap-2">
                                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                                            <span className="text-sm truncate block max-w-full" title={urlItem.url}>
                                                {urlItem.url}
                                            </span>
                                            {urlItem.error && (
                                                <div className="flex items-center shrink-0">
                                                    <AlertCircle className="h-3 w-3 text-red-500 mr-1" />
                                                    <span className="text-xs text-red-600 hidden sm:inline" title={urlItem.error}>
                                                        Error
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        {urlItem.status !== 'processing' && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeUrl(urlItem.id)}
                                                disabled={addingAll}
                                                className="shrink-0 p-1"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Add All Button */}
                    <div className="flex justify-center">
                        <Button 
                            type="button"
                            onClick={handleAddAll}
                            disabled={addingAll || urlList.filter(item => item.status === 'pending').length === 0}
                            className="w-full max-w-md"
                            size="lg"
                        >
                            {addingAll ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Adding All URLs...
                                </>
                            ) : (
                                `Add All URLs (${urlList.filter(item => item.status === 'pending').length} pending)`
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Stored Website Knowledge */}
            <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-medium mb-3">Stored Website Knowledge</h3>
                {loadingStored ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : storedKnowledge.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No website knowledge stored yet. Add URLs above to get started.
                    </p>
                ) : (
                    <div className="border rounded-lg">
                        <div className="max-h-[40vh] overflow-y-auto">
                            <div className="divide-y">
                                {storedKnowledge.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                                        <div className="shrink-0">
                                            {item.status === 'succeeded' ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                            ) : item.status === 'processing' || item.status === 'processing-ragie' || item.status === 'pending' ? (
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                            ) : item.status === 'failed' ? (
                                                <AlertCircle className="h-4 w-4 text-red-600" />
                                            ) : (
                                                <LinkIcon className="h-4 w-4 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate block max-w-full" title={item.title || item.url}>
                                                {item.title || item.url || 'Untitled'}
                                            </div>
                                            {item.url && (
                                                <div className="text-xs text-muted-foreground truncate block max-w-full" title={item.url}>
                                                    {item.url}
                                                </div>
                                            )}
                                        </div>
                                        <Badge variant={
                                            item.status === 'succeeded' ? 'default' :
                                            item.status === 'failed' ? 'destructive' :
                                            'secondary'
                                        } className="shrink-0 text-xs">
                                            {item.status === 'processing-ragie' ? 'processing' : item.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
