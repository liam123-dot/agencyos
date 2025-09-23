
'use client'

import { getClient } from "@/app/api/clients/getClient"
import { useState, useEffect } from "react"
import { ArrowLeft } from "lucide-react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

// Client type based on database schema
interface Client {
    id: string
    name: string
    organization_id: string
    stripe_customer_id?: string
    created_at: string
    updated_at: string
    twilio_account_sid?: string
    twilio_auth_token?: string
}

export function PlatformUserBanner() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const clientId = searchParams.get('client_id')
    const [isLoading, setIsLoading] = useState(true)
    const [returnIsLoading, setReturnIsLoading] = useState(false)
    const [client, setClient] = useState<Client | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchClientData() {
            if (!clientId) {
                setIsLoading(false)
                return
            }
            
            try {
                const clientData = await getClient(clientId)
                setClient(clientData)
                setError(null)
            } catch (err) {
                console.error('Error fetching client:', err)
                setError('Failed to load client information')
            } finally {
                setIsLoading(false)
            }
        }

        fetchClientData()
    }, [clientId])

    const handleReturnToAdmin = () => {
        // Navigate back to the main admin dashboard
        setReturnIsLoading(true)
        router.push('/app/clients')
    }

    if (!clientId) return null

    return (
        <div className="w-full bg-muted/30 border-b border-border px-6 py-3 sticky top-0 z-10">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {isLoading ? (
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm text-muted-foreground">Loading client...</span>
                        </div>
                    ) : error ? (
                        <span className="text-sm text-destructive">{error}</span>
                    ) : client ? (
                        <span className="font-medium text-foreground">
                            Viewing <span className="font-semibold">{client.name}</span> Dashboard
                        </span>
                    ) : (
                        <span className="text-sm text-muted-foreground">Client not found</span>
                    )}
                </div>
                
                <Button
                    disabled={returnIsLoading}
                    variant="outline"
                    size="sm"
                    onClick={handleReturnToAdmin}
                    className="gap-2"
                >
                    {returnIsLoading ? (
                        <div className="h-4 w-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <ArrowLeft className="h-4 w-4" />
                    )}
                    {returnIsLoading ? 'Loading...' : 'Return to Admin Dashboard'}
                </Button>
            </div>
        </div>
    )
}
