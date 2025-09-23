"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { connectDomain } from "@/app/api/organizations/connectDomain"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Globe } from "lucide-react"

interface ConnectDomainProps {
  organizationName: string
}

export default function ConnectDomain({ organizationName }: ConnectDomainProps) {
    const [domain, setDomain] = useState('')
    const [isConnecting, setIsConnecting] = useState(false)

    const handleConnectDomain = async () => {
        if (!domain.trim()) {
            toast.error("Please enter a domain")
            return
        }

        setIsConnecting(true)
        const { success, error } = await connectDomain(domain.trim())
        
        if (success) {
            toast.success("Domain connected successfully. Configure DNS settings to complete verification.")
            // Refresh the page to show the verification component
            window.location.reload()
        } else {
            toast.error(error || "Failed to connect domain")
        }
        setIsConnecting(false)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Domain Connection
                </CardTitle>
                <CardDescription>
                    Connect a custom domain to {organizationName}. After connecting, you'll need to configure DNS settings. 
                    <strong>DNS verification can take up to 48 hours to complete.</strong>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Input
                    placeholder="example.com"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    disabled={isConnecting}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleConnectDomain()
                        }
                    }}
                />
            </CardContent>
            <CardFooter>
                <Button 
                    onClick={handleConnectDomain} 
                    disabled={isConnecting || !domain.trim()}
                    className="w-full"
                >
                    {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Connect Domain
                </Button>
            </CardFooter>
        </Card>
    )
}