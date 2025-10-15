'use client'

import { useState, useEffect } from "react"
import { getExistingConnections } from "@/app/s/[orgId]/api/connect/token/pipedream-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ConnectionCard } from "./ConnectionCard"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { RefreshCw } from "lucide-react"

interface ExistingConnectionsProps {
  clientId: string
}

export function ExistingConnections({ clientId }: ExistingConnectionsProps) {
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConnections = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getExistingConnections(clientId)

      if (result.success) {
        setAccounts(result.accounts)
      } else {
        setError(result.error || "Failed to load connections")
      }
    } catch (err) {
      console.error("Error fetching connections:", err)
      setError("Failed to load connections")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = (accountId: string) => {
    // Optimistically remove from UI
    setAccounts(prevAccounts => prevAccounts.filter(acc => acc.id !== accountId))
  }

  useEffect(() => {
    fetchConnections()
  }, [clientId])

  if (isLoading && accounts.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Connected Accounts</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled
            title="Loading connections"
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
          </Button>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Connected Accounts</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchConnections}
            disabled={isLoading}
            title="Retry loading connections"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">{error}</p>
          <p className="text-xs text-muted-foreground mt-2">
            Click the refresh button to try again
          </p>
        </div>
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No connected accounts yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Search and connect apps above to get started
        </p>
      </div>
    )
  }

  // Group accounts by app name
  const groupedAccounts = accounts.reduce((groups, account) => {
    const appName = account.app?.name || 'Unknown App'
    if (!groups[appName]) {
      groups[appName] = []
    }
    groups[appName].push(account)
    return groups
  }, {} as Record<string, any[]>)

  // Sort groups alphabetically by app name
  const sortedAppNames = Object.keys(groupedAccounts).sort()

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Connected Accounts</h3>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{accounts.length}</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchConnections}
            disabled={isLoading}
            title="Refresh connections"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedAppNames.map((appName) => {
          const appAccounts = groupedAccounts[appName]
          const firstAccount = appAccounts[0]
          
          return (
            <ConnectionCard
              key={appName}
              app={{
                name: appName,
                imgSrc: firstAccount.app?.imgSrc
              }}
              accounts={appAccounts}
              clientId={clientId}
              onDelete={handleDeleteAccount}
            />
          )
        })}
      </div>
    </div>
  )
}
