'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Check, Loader2, Trash2, Plus } from "lucide-react"
import { toast } from "sonner"
import { createOauthRedirect, getConnections, deleteConnection } from "@/app/api/knowledge-base/addKnowledge"

interface Connection {
    id: string
    name: string
    type: 'google_drive' | 'notion'
    createdAt: Date
    lastSyncedAt: Date | null
    syncing: boolean
}

interface IntegrationType {
    id: 'google-drive' | 'notion'
    name: string
    description: string
    sourceType: 'google_drive' | 'notion'
}

interface IntegrationsSectionProps {
    knowledgeBaseId: string
}

// Google Drive SVG Icon
const GoogleDriveIcon = () => (
    <svg width="32" height="32" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg">
        <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
        <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
        <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
        <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
        <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
        <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
)

// Notion SVG Icon
const NotionIcon = () => (
    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.724 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.91 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="#000"/>
    </svg>
)

export function IntegrationsSection({ knowledgeBaseId }: IntegrationsSectionProps) {
    const integrationTypes: IntegrationType[] = [
        {
            id: 'google-drive',
            name: 'Google Drive',
            description: 'Sync files and folders from your Google Drive',
            sourceType: 'google_drive'
        },
        {
            id: 'notion',
            name: 'Notion',
            description: 'Import pages and databases from Notion',
            sourceType: 'notion'
        },
    ]

    const [connections, setConnections] = useState<Connection[]>([])
    const [loading, setLoading] = useState(true)
    const [connectingType, setConnectingType] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    useEffect(() => {
        loadConnections()
    }, [knowledgeBaseId])

    const loadConnections = async () => {
        try {
            const result = await getConnections(knowledgeBaseId)
            const mappedConnections: Connection[] = result.map((conn: any) => ({
                id: conn.id,
                name: conn.name,
                type: conn.type,
                createdAt: new Date(conn.createdAt),
                lastSyncedAt: conn.lastSyncedAt ? new Date(conn.lastSyncedAt) : null,
                syncing: conn.syncing
            }))
            setConnections(mappedConnections)
        } catch (error) {
            console.error('Error loading connections:', error)
            toast.error('Failed to load connections')
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (integrationType: IntegrationType) => {
        setConnectingType(integrationType.id)
        try {
            await createOauthRedirect(integrationType.sourceType, knowledgeBaseId)
        } catch (error) {
            console.error('Error connecting:', error)
            toast.error(`Failed to connect to ${integrationType.name}`)
            setConnectingType(null)
        }
    }

    const handleDelete = async (connectionId: string, connectionName: string) => {
        setDeletingId(connectionId)
        try {
            await deleteConnection(connectionId)
            setConnections(prev => prev.filter(conn => conn.id !== connectionId))
            toast.success(`Disconnected ${connectionName}`)
        } catch (error) {
            console.error('Error deleting connection:', error)
            toast.error('Failed to disconnect')
        } finally {
            setDeletingId(null)
        }
    }

    const renderIcon = (type: 'google_drive' | 'notion') => {
        if (type === 'google_drive') {
            return <GoogleDriveIcon />
        } else if (type === 'notion') {
            return <NotionIcon />
        }
        return null
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                        <Card key={i} className="hover:border-primary/50 transition-colors">
                            <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                                        <div className="w-8 h-8 bg-muted animate-pulse rounded" />
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <div className="h-5 bg-muted animate-pulse rounded w-24" />
                                        <div className="h-4 bg-muted animate-pulse rounded w-full" />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="h-10 bg-muted animate-pulse rounded w-full" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Integration cards for connecting new sources */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {integrationTypes.map((integrationType) => (
                    <Card key={integrationType.id} className="hover:border-primary/50 transition-colors">
                        <CardHeader className="pb-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                                    {renderIcon(integrationType.sourceType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg">{integrationType.name}</CardTitle>
                                    <CardDescription className="mt-1.5">
                                        {integrationType.description}
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={() => handleConnect(integrationType)}
                                disabled={connectingType === integrationType.id}
                                className="w-full"
                            >
                                {connectingType === integrationType.id ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Connect
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Connected sources table */}
            {connections.length > 0 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Connected Sources</CardTitle>
                        <CardDescription className="text-xs">
                            {connections.length} {connections.length === 1 ? 'source' : 'sources'} connected
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y">
                            {connections.map((connection) => (
                                <div key={connection.id} className="flex items-center gap-3 p-3 hover:bg-muted/30 transition-colors">
                                    <div className="shrink-0">
                                        <div style={{ width: '20px', height: '20px' }} className="flex items-center justify-center">
                                            {renderIcon(connection.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium text-sm truncate">{connection.name}</span>
                                            <Check className="h-3 w-3 text-green-600 shrink-0" />
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {connection.syncing ? (
                                                <span className="flex items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Syncing...
                                                </span>
                                            ) : connection.lastSyncedAt ? (
                                                <span>Last synced: {connection.lastSyncedAt.toLocaleString()}</span>
                                            ) : (
                                                <span>Not synced yet</span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(connection.id, connection.name)}
                                        disabled={deletingId === connection.id}
                                        className="shrink-0 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    >
                                        {deletingId === connection.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

