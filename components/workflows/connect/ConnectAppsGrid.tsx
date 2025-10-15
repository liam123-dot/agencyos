'use client'

import { useState } from "react"
import { ConnectAccountButton } from "./ConnectAccountButton"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Loader2 } from "lucide-react"
import { searchApps } from "@/app/s/[orgId]/api/connect/token/pipedream-actions"
import { toast } from "sonner"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ConnectAppsGridProps {
  clientId: string
  onSuccess?: (account: any, app: string) => void
}

interface PipedreamApp {
  name: string
  nameSlug: string
  imgSrc?: string
  description?: string
  featuredWeight?: number
}

export function ConnectAppsGrid({
  clientId,
  onSuccess
}: ConnectAppsGridProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [apps, setApps] = useState<PipedreamApp[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term")
      return
    }

    setIsLoading(true)
    setHasSearched(true)
    
    try {
      const result = await searchApps(searchQuery, clientId)
      
      if (result.success) {
        // Sort by featuredWeight in descending order (higher values first)
        const sortedApps = (result.apps as PipedreamApp[]).sort((a, b) => {
          const weightA = a.featuredWeight ?? 0
          const weightB = b.featuredWeight ?? 0
          return weightB - weightA
        })
        setApps(sortedApps)
      } else {
        toast.error(result.error || "Failed to search apps")
        setApps([])
      }
    } catch (error) {
      toast.error("An error occurred while searching")
      setApps([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search apps (e.g., Google, Slack, GitHub)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Button 
          onClick={handleSearch}
          disabled={isLoading || !searchQuery.trim()}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Apps Grid */}
      {!isLoading && apps.length > 0 && (
        <TooltipProvider>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {apps.map((app) => (
              <Tooltip key={app.nameSlug}>
                <TooltipTrigger asChild>
                  <ConnectAccountButton
                    app={app.nameSlug}
                    clientId={clientId}
                    onSuccess={(account) => onSuccess?.(account, app.nameSlug)}
                    className="h-auto flex-col gap-2 p-4 hover:bg-accent"
                  >
                    <div className="flex flex-col items-center gap-2 w-full">
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
                      <div className="text-sm font-medium text-center line-clamp-2 w-full break-words">
                        {app.name}
                      </div>
                      {app.description && (
                        <div className="text-xs text-muted-foreground line-clamp-2 w-full break-words text-center">
                          {app.description}
                        </div>
                      )}
                    </div>
                  </ConnectAccountButton>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">{app.name}</p>
                  {app.description && (
                    <p className="text-sm">{app.description}</p>
                  )}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      )}

      {/* Empty States */}
      {!isLoading && hasSearched && apps.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No apps found matching &quot;{searchQuery}&quot;</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try a different search term
          </p>
        </div>
      )}

      {!isLoading && !hasSearched && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">Search to find apps to connect</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try searching for &quot;Google&quot;, &quot;Slack&quot;, &quot;GitHub&quot;, or any other app
          </p>
        </div>
      )}
    </div>
  )
}

