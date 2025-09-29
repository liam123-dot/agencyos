'use client'

import { useEffect, useState, useCallback, useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AddLink } from "./AddLink"
import { AddText } from "@/components/knowledge-base/AddText"
import { KnowledgeOverview } from "./KnowledgeOverview"
import { KnowledgeBaseBreadcrumb } from "./KnowledgeBaseBreadcrumb"
import { Knowledge, FileKnowledge, KnowledgeStatus } from "@/lib/types/knowledge"
import { getKnowledge } from "@/app/api/knowledge-base/addKnowledge"

interface ManageKnowledgeBaseProps {
    knowledgeBaseId?: string
    knowledgeBaseName?: string
}

export function ManageKnowledgeBase({ knowledgeBaseId, knowledgeBaseName = "My Knowledge Base" }: ManageKnowledgeBaseProps) {
    const [knowledgeItems, setKnowledgeItems] = useState<Knowledge[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCheckingStatus, setIsCheckingStatus] = useState(false)
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

    const fetchKnowledge = useCallback(async () => {
        setIsLoading(true)
        if (!knowledgeBaseId) {
            setIsLoading(false)
            setKnowledgeItems([])
            stopStatusPolling()
            return null;
        }
        try {
            const knowledge = await getKnowledge(knowledgeBaseId)
            // Map processing-ragie to processing for display
            const displayKnowledge = knowledge?.map(item => ({
                ...item,
                status: item.status === 'processing-ragie' ? 'processing' as KnowledgeStatus : item.status
            })) || []
            setKnowledgeItems(displayKnowledge)
            
            // Check if there are any items that need status polling
            const itemsNeedingPolling = knowledge?.filter(item => 
                item.status === 'not-started' || 
                item.status === 'processing' || 
                item.status === 'processing-ragie' || 
                item.status === 'pending'
            ) || []
            
            if (itemsNeedingPolling.length > 0) {
                startStatusPolling(itemsNeedingPolling)
            } else {
                stopStatusPolling()
            }
            
        } catch (error) {
            console.error('Error fetching knowledge:', error)
            setKnowledgeItems([])
        } finally {
            setIsLoading(false)
        }
    }, [knowledgeBaseId])

    const startStatusPolling = useCallback((itemsNeedingPolling: Knowledge[]) => {
        // Clear any existing polling
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
        }

        const recheckKnowledge = async () => {
            setIsCheckingStatus(true)
            try {
                if (!knowledgeBaseId) return
                
                const knowledge = await getKnowledge(knowledgeBaseId)
                // Map processing-ragie to processing for display
                const displayKnowledge = knowledge?.map(item => ({
                    ...item,
                    status: item.status === 'processing-ragie' ? 'processing' as KnowledgeStatus : item.status
                })) || []
                setKnowledgeItems(displayKnowledge)
                
                // Check if we still have items that need polling
                const stillNeedingPolling = knowledge?.filter(item => 
                    item.status === 'not-started' || 
                    item.status === 'processing' || 
                    item.status === 'processing-ragie' || 
                    item.status === 'pending'
                ) || []
                
                if (stillNeedingPolling.length === 0) {
                    stopStatusPolling()
                    return
                }
            } catch (error) {
                console.error('Error during status polling:', error)
            } finally {
                setIsCheckingStatus(false)
            }
        }

        // Check immediately
        recheckKnowledge()

        // Set up polling interval (every 15 seconds)
        pollingIntervalRef.current = setInterval(recheckKnowledge, 15000)
    }, [knowledgeBaseId])

    const stopStatusPolling = useCallback(() => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current)
            pollingIntervalRef.current = null
        }
        setIsCheckingStatus(false)
    }, [])

    const handleAddWebsiteKnowledge = () => {
        // Refetch knowledge base contents after successful addition
        fetchKnowledge()
    }

    const handleAddFileKnowledge = (newItem: Omit<FileKnowledge, 'created_at' | 'updated_at'>) => {
        const knowledge: FileKnowledge = {
            ...newItem,
            created_at: new Date(),
            updated_at: new Date(),
        }
        setKnowledgeItems(prev => [knowledge, ...prev])
    }

    // Text uses the same onSuccess behavior as website: refresh from server

    const handleDeleteKnowledge = (id: string) => {
        setKnowledgeItems(prev => prev.filter(item => item.id !== id))
    }

    useEffect(() => {
        fetchKnowledge()
        
        // Cleanup polling interval on unmount
        return () => {
            stopStatusPolling()
        }
    }, [fetchKnowledge, stopStatusPolling])

    if (!knowledgeBaseId) {
        return <div>Knowledge base ID is required</div>
    }

    return (
        <div className="space-y-6">
            <KnowledgeBaseBreadcrumb knowledgeBaseName={knowledgeBaseName} />

            <Card>
                <CardHeader>
                    <CardTitle>Add Content to Knowledge Base</CardTitle>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="website" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="website">Website</TabsTrigger>
                            {/* <TabsTrigger value="file">Upload File</TabsTrigger> */}
                            <TabsTrigger value="text">Text Input</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="website" className="mt-6">
                            <AddLink onSuccess={handleAddWebsiteKnowledge} knowledgeBaseId={knowledgeBaseId} />
                        </TabsContent>
                        
                        {/* <TabsContent value="file" className="mt-6">
                            <AddPdf onSuccess={handleAddFileKnowledge} knowledgeBaseId={knowledgeBaseId} />
                        </TabsContent> */}
                        
                        <TabsContent value="text" className="mt-6">
                            <AddText onSuccess={handleAddWebsiteKnowledge} knowledgeBaseId={knowledgeBaseId} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            <KnowledgeOverview 
                knowledge={knowledgeItems} 
                onDelete={handleDeleteKnowledge}
                isLoading={isLoading}
                isCheckingStatus={isCheckingStatus}
            />
        </div>
    )
}
