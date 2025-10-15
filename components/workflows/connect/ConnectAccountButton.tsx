'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ConnectAccountButtonProps {
  app: string
  clientId: string
  onSuccess?: (account: any) => void
  onError?: (error: Error) => void
  className?: string
  children?: React.ReactNode
  disabled?: boolean
}

export function ConnectAccountButton({
  app,
  clientId,
  onSuccess,
  onError,
  className,
  children,
  disabled
}: ConnectAccountButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    // Prevent double-clicks
    if (isLoading) {
      console.log("Already processing a connection request, ignoring click")
      return
    }

    setIsLoading(true)

    try {
      console.log(`Fetching connect token for app: ${app}, clientId: ${clientId}`)
      
      // Fetch the connect token and URL
      const response = await fetch('/api/connect/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clientId }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        console.error("Token fetch failed:", error)
        throw new Error(error.error || "Failed to fetch Connect token")
      }
      
      const data = await response.json()
      console.log("Received connect token, constructing URL with app:", app)

      // Add app parameter to the URL
      const connectUrl = new URL(data.connectLinkUrl)
      connectUrl.searchParams.set('app', app)
      
      console.log("Opening URL in new tab:", connectUrl.toString())
      
      // Open Pipedream Connect URL in a new tab
      const opened = window.open(connectUrl.toString(), '_blank', 'noopener,noreferrer')
      
      if (!opened) {
        toast.error("Pop-up blocked. Please allow pop-ups for this site.")
      } else {
        toast.success("Opening connection window...")
      }
      
      setIsLoading(false)
      
    } catch (error) {
      console.error("Connection error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to connect account")
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConnect}
      disabled={disabled || isLoading}
      variant="outline"
      className={className}
    >
      {isLoading ? "Connecting..." : children || `Connect ${app}`}
    </Button>
  )
}
