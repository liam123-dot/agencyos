'use client'

import { useState } from "react"
import { CheckCircle2, XCircle, AlertCircle, Trash2, Loader2, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteAccount } from "@/app/s/[orgId]/api/connect/token/pipedream-actions"
import { toast } from "sonner"

interface ConnectionCardProps {
  app: {
    name: string
    imgSrc?: string
  }
  accounts: any[]
  clientId: string
  onDelete: (accountId: string) => void
}

export function ConnectionCard({ app, accounts, clientId, onDelete }: ConnectionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null)
  const [accountToDelete, setAccountToDelete] = useState<any>(null)

  const handleDelete = async () => {
    if (!accountToDelete) return
    
    setDeletingAccountId(accountToDelete.id)

    try {
      const result = await deleteAccount(clientId, accountToDelete.id)

      if (result.success) {
        toast.success(result.message || "Account disconnected successfully")
        setAccountToDelete(null)
        onDelete(accountToDelete.id) // Remove from UI
      } else {
        toast.error(result.error || "Failed to disconnect account")
      }
    } catch (error) {
      console.error("Error deleting account:", error)
      toast.error(error instanceof Error ? error.message : "Failed to disconnect account")
    } finally {
      setDeletingAccountId(null)
    }
  }

  // Calculate status summary
  const connectedCount = accounts.filter(acc => acc.healthy && !acc.dead).length
  const hasIssues = accounts.some(acc => acc.dead || !acc.healthy)

  return (
    <>
      <Card>
        <CardContent className="p-4">
          {/* App Header - Clickable to expand/collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            {app.imgSrc ? (
              <img 
                src={app.imgSrc} 
                alt={app.name}
                className="w-10 h-10 flex-shrink-0 rounded"
              />
            ) : (
              <div className="w-10 h-10 flex-shrink-0 bg-muted rounded flex items-center justify-center text-sm font-medium">
                {app.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm truncate">{app.name}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-muted-foreground">
                  {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
                </span>
                {hasIssues ? (
                  <div className="flex items-center gap-1 text-xs text-yellow-600">
                    <AlertCircle className="h-3 w-3" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-green-600">
                    <CheckCircle2 className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>

            <ChevronDown 
              className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {/* Accounts List - Collapsible */}
          {isExpanded && (
            <div className="space-y-2 mt-3 pt-3 border-t">
              {accounts.map((account) => {
                const isHealthy = account.healthy && !account.dead
                const isDead = account.dead
                
                return (
                  <div 
                    key={account.id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors ${isDead ? 'opacity-60' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">
                        {account.name || 'Connected Account'}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {isDead ? (
                          <div className="flex items-center gap-1 text-xs text-destructive">
                            <XCircle className="h-3 w-3" />
                            <span>Disconnected</span>
                          </div>
                        ) : isHealthy ? (
                          <div className="flex items-center gap-1 text-xs text-green-600">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Connected</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-yellow-600">
                            <AlertCircle className="h-3 w-3" />
                            <span>Issues</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        setAccountToDelete(account)
                      }}
                      disabled={deletingAccountId === account.id}
                    >
                      {deletingAccountId === account.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!accountToDelete} onOpenChange={(open) => !open && setAccountToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect <strong>{accountToDelete?.name || app.name}</strong>? 
              This will revoke access and you&apos;ll need to reconnect to use this integration again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!deletingAccountId}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={!!deletingAccountId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccountId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                'Disconnect'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

