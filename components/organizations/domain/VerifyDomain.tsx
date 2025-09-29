"use client"

import { checkVerificationStatus, removeDomain } from "@/app/api/organizations/connectDomain"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle, Globe, Copy, Trash2, Check, ExternalLink } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"

interface VerifyDomainProps {
  organizationName: string
}

interface VerificationStatus {
  verified: boolean
  domain: string
  ownershipVerified?: boolean
  step?: 'ownership' | 'dns' | 'completed' | 'unknown'
  ownershipVerification?: any[]
  dnsConfiguration?: any[]
  verificationData?: any[]
  recommendedIPv4?: any
  recommendedCNAME?: any
  error?: boolean
}

export default function VerifyDomain({ organizationName }: VerifyDomainProps) {
    const [isChecking, setIsChecking] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)
    const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null)
    const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set())

    const checkStatus = async (showToast: boolean = false) => {
        setIsChecking(true)
        try {
            const status = await checkVerificationStatus()
            setVerificationStatus(status as VerificationStatus)
            
            if (showToast) {
                if (status.verified) {
                    toast.success("Domain verified successfully!")
                } else {
                    toast.warning("DNS not yet verified. This can take up to 48 hours to propagate.")
                }
            }
        } catch (error) {
            if (showToast) {
                toast.error("Failed to check verification status")
            }
            console.error(error)
        }
        setIsChecking(false)
    }

    const handleVerifyDomain = async () => {
        await checkStatus(true)
    }

    const handleRemoveDomain = async () => {
        setIsRemoving(true)
        const { success, error } = await removeDomain()
        
        if (success) {
            toast.success("Domain removed successfully")
            // Reset verification status to trigger re-render
            setVerificationStatus(null)
            // Check status again to refresh the component
            await checkStatus(false)
        } else {
            toast.error(error || "Failed to remove domain")
        }
        setIsRemoving(false)
    }

    const copyToClipboard = (text: string, itemId: string) => {
        navigator.clipboard.writeText(text)
        setCopiedItems(prev => new Set([...prev, itemId]))
        // Reset the checkmark after 2 seconds
        setTimeout(() => {
            setCopiedItems(prev => {
                const newSet = new Set(prev)
                newSet.delete(itemId)
                return newSet
            })
        }, 2000)
    }

    const formatHostName = (domain: string, baseDomain: string) => {
        // If it's the exact base domain, use @
        if (domain === baseDomain) {
            return '@'
        }
        
        // If it's a subdomain, extract just the subdomain part
        if (domain.endsWith('.' + baseDomain)) {
            return domain.replace('.' + baseDomain, '')
        }
        
        // Handle cases where domain might be a different format
        // Check if the domain contains the base domain
        if (domain.includes(baseDomain)) {
            const parts = domain.split('.')
            const baseParts = baseDomain.split('.')
            
            // If we have more parts than the base domain, it's a subdomain
            if (parts.length > baseParts.length) {
                // Return the subdomain parts (everything before the base domain)
                const subdomainParts = parts.slice(0, parts.length - baseParts.length)
                return subdomainParts.join('.')
            }
        }
        
        // Fallback to the full domain
        return domain
    }

    const isRootDomain = (domain: string) => {
        // A root domain has no subdomain parts (e.g., "example.com" vs "www.example.com")
        // Count the number of dots - root domains typically have 1 dot for .com, .org, etc.
        // or 2 dots for .co.uk, .com.au, etc.
        const parts = domain.split('.')
        
        // Common TLDs that are root domains with 2+ parts
        const commonTLDs = [
            'co.uk', 'com.au', 'co.za', 'co.nz', 'com.br', 'co.jp', 
            'co.in', 'com.mx', 'co.kr', 'com.sg', 'co.il', 'com.tr'
        ]
        
        // Check if it ends with a common multi-part TLD
        for (const tld of commonTLDs) {
            if (domain.endsWith('.' + tld)) {
                const beforeTld = domain.replace('.' + tld, '')
                // If there are no more dots before the TLD, it's a root domain
                return !beforeTld.includes('.')
            }
        }
        
        // For standard TLDs (.com, .org, .net, etc.), check if there's only one dot
        return parts.length === 2
    }

    // Check verification status on component mount (without toast)
    useEffect(() => {
        checkStatus(false)
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    {verificationStatus?.step === 'ownership' ? 'Domain Ownership Verification' : 'Domain Verification'}
                    {verificationStatus?.verified && (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                        </Badge>
                    )}
                    {verificationStatus?.step === 'ownership' && (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Step 1 of 2
                        </Badge>
                    )}
                    {verificationStatus?.step === 'dns' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Step 2 of 2
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>
                    {verificationStatus?.domain ? (
                        <>
                            {verificationStatus.step === 'ownership' 
                                ? `First, verify ownership of ${verificationStatus.domain} for ${organizationName}`
                                : `Configure DNS settings for ${verificationStatus.domain} for ${organizationName}`
                            }
                        </>
                    ) : (
                        <>Verifying your domain configuration for {organizationName}</>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {verificationStatus?.verified ? (
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            Your domain is successfully verified and configured!
                        </AlertDescription>
                    </Alert>
                ) : verificationStatus?.step === 'ownership' ? (
                    <div className="space-y-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                First, you need to verify ownership of your domain. Add the TXT record below to your DNS settings.
                            </AlertDescription>
                        </Alert>
                        
                        {verificationStatus.ownershipVerification?.map((verification, index) => {
                            const formattedHost = formatHostName(verification.domain, verificationStatus.domain)
                            return (
                                <div key={index} className="p-4 border rounded-lg bg-muted/50">
                                    <div className="mb-4">
                                        <h4 className="font-medium">TXT Record (Ownership Verification)</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Name/Host:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                    {formattedHost}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(formattedHost, `ownership-host-${index}`)}
                                                    className="shrink-0"
                                                >
                                                    {copiedItems.has(`ownership-host-${index}`) ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Value:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm bg-background px-2 py-1 rounded border flex-1 break-all">
                                                    {verification.value}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(verification.value, `ownership-value-${index}`)}
                                                    className="shrink-0"
                                                >
                                                    {copiedItems.has(`ownership-value-${index}`) ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        
                        <Alert>
                            <AlertDescription className="text-sm">
                                <strong>Important:</strong> After adding the TXT record, wait a few minutes for DNS propagation, then click "Refresh Status" to continue to the next step.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : verificationStatus?.step === 'dns' ? (
                    <div className="space-y-4">
                        <Alert>
                            <CheckCircle className="h-4 w-4" />
                            <AlertDescription>
                                Great! Domain ownership verified. Now configure your DNS settings with the values below.
                            </AlertDescription>
                        </Alert>
                        
                        {verificationStatus.dnsConfiguration?.map((config, index) => {
                            const formattedHost = formatHostName(config.domain || verificationStatus.domain, verificationStatus.domain)
                            return (
                                <div key={index} className="p-4 border rounded-lg bg-muted/50">
                                    <div className="mb-4">
                                        <h4 className="font-medium">{config.type} Record</h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Name/Host:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                    {formattedHost}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(formattedHost, `dns-host-${index}`)}
                                                    className="shrink-0"
                                                >
                                                    {copiedItems.has(`dns-host-${index}`) ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground mb-1">Value:</p>
                                            <div className="flex items-center gap-2">
                                                <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                    {config.value}
                                                </code>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(config.value, `dns-value-${index}`)}
                                                    className="shrink-0"
                                                >
                                                    {copiedItems.has(`dns-value-${index}`) ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        
                        {/* Handle misconfigured domains with recommended records */}
                        {(verificationStatus.recommendedIPv4 || verificationStatus.recommendedCNAME) && (() => {
                            const isRoot = isRootDomain(verificationStatus.domain)
                            const showARecord = isRoot && verificationStatus.recommendedIPv4
                            const showCNAMERecord = !isRoot && verificationStatus.recommendedCNAME
                            
                            // If we don't have the appropriate record type for the domain type, don't show anything
                            if (!showARecord && !showCNAMERecord) {
                                return null
                            }
                            
                            return (
                                <div className="p-4 border rounded-lg bg-muted/50">
                                    <div className="mb-4">
                                        <h4 className="font-medium">
                                            {showARecord ? 'A Record' : 'CNAME Record'}
                                        </h4>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {isRoot ? 'Root domain - use A record' : 'Subdomain - use CNAME record'}
                                        </p>
                                    </div>
                                    
                                    {showARecord && (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Name/Host:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                        @
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard('@', 'dns-a-record-host')}
                                                        className="shrink-0"
                                                    >
                                                        {copiedItems.has('dns-a-record-host') ? (
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Value:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                        {Array.isArray(verificationStatus.recommendedIPv4) 
                                                            ? verificationStatus.recommendedIPv4[0]?.value || verificationStatus.recommendedIPv4[0] 
                                                            : verificationStatus.recommendedIPv4}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(
                                                            Array.isArray(verificationStatus.recommendedIPv4) 
                                                                ? verificationStatus.recommendedIPv4[0]?.value || verificationStatus.recommendedIPv4[0] 
                                                                : verificationStatus.recommendedIPv4, 
                                                            'dns-a-record-value'
                                                        )}
                                                        className="shrink-0"
                                                    >
                                                        {copiedItems.has('dns-a-record-value') ? (
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {showCNAMERecord && (
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Name/Host:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                        {formatHostName(verificationStatus.domain, verificationStatus.domain.split('.').slice(-2).join('.'))}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(formatHostName(verificationStatus.domain, verificationStatus.domain.split('.').slice(-2).join('.')), 'dns-cname-record-host')}
                                                        className="shrink-0"
                                                    >
                                                        {copiedItems.has('dns-cname-record-host') ? (
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Value:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                        {Array.isArray(verificationStatus.recommendedCNAME) 
                                                            ? verificationStatus.recommendedCNAME[0]?.value || verificationStatus.recommendedCNAME[0] 
                                                            : verificationStatus.recommendedCNAME}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(
                                                            Array.isArray(verificationStatus.recommendedCNAME) 
                                                                ? verificationStatus.recommendedCNAME[0]?.value || verificationStatus.recommendedCNAME[0] 
                                                                : verificationStatus.recommendedCNAME, 
                                                            'dns-cname-record-value'
                                                        )}
                                                        className="shrink-0"
                                                    >
                                                        {copiedItems.has('dns-cname-record-value') ? (
                                                            <Check className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Copy className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })()}
                        
                        <Alert>
                            <AlertDescription>
                                <strong>DNS propagation can take up to 48 hours to complete.</strong>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : verificationStatus ? (
                    <div className="space-y-4">
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                DNS not yet verified. Please configure your DNS settings with the values below. 
                                <strong>DNS propagation can take up to 48 hours.</strong>
                            </AlertDescription>
                        </Alert>
                        
                        {/* Apply the same root domain logic to the fallback section */}
                        {(verificationStatus.recommendedIPv4 || verificationStatus.recommendedCNAME) && (() => {
                            const isRoot = isRootDomain(verificationStatus.domain)
                            const showARecord = isRoot && verificationStatus.recommendedIPv4
                            const showCNAMERecord = !isRoot && verificationStatus.recommendedCNAME
                            
                            // If we don't have the appropriate record type for the domain type, don't show anything
                            if (!showARecord && !showCNAMERecord) {
                                return null
                            }
                            
                            return (
                                <>
                                    {showARecord && (
                                        <div className="p-4 border rounded-lg bg-muted/50">
                                            <div className="mb-4">
                                                <h4 className="font-medium">A Record</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Root domain - use A record</p>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Name/Host:</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                            @
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard('@', 'a-record-host')}
                                                            className="shrink-0"
                                                        >
                                                            {copiedItems.has('a-record-host') ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Value:</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                            {Array.isArray(verificationStatus.recommendedIPv4) 
                                                                ? verificationStatus.recommendedIPv4[0]?.value || verificationStatus.recommendedIPv4[0] 
                                                                : verificationStatus.recommendedIPv4}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(
                                                                Array.isArray(verificationStatus.recommendedIPv4) 
                                                                    ? verificationStatus.recommendedIPv4[0]?.value || verificationStatus.recommendedIPv4[0] 
                                                                    : verificationStatus.recommendedIPv4, 
                                                                'a-record-value'
                                                            )}
                                                            className="shrink-0"
                                                        >
                                                            {copiedItems.has('a-record-value') ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {showCNAMERecord && (
                                        <div className="p-4 border rounded-lg bg-muted/50">
                                            <div className="mb-4">
                                                <h4 className="font-medium">CNAME Record</h4>
                                                <p className="text-xs text-muted-foreground mt-1">Subdomain - use CNAME record</p>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Name/Host:</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                            {formatHostName(verificationStatus.domain, verificationStatus.domain.split('.').slice(-2).join('.'))}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(formatHostName(verificationStatus.domain, verificationStatus.domain.split('.').slice(-2).join('.')), 'cname-record-host')}
                                                            className="shrink-0"
                                                        >
                                                            {copiedItems.has('cname-record-host') ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground mb-1">Value:</p>
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm bg-background px-2 py-1 rounded border flex-1">
                                                            {Array.isArray(verificationStatus.recommendedCNAME) 
                                                                ? verificationStatus.recommendedCNAME[0]?.value || verificationStatus.recommendedCNAME[0] 
                                                                : verificationStatus.recommendedCNAME}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => copyToClipboard(
                                                                Array.isArray(verificationStatus.recommendedCNAME) 
                                                                    ? verificationStatus.recommendedCNAME[0]?.value || verificationStatus.recommendedCNAME[0] 
                                                                    : verificationStatus.recommendedCNAME, 
                                                                'cname-record-value'
                                                            )}
                                                            className="shrink-0"
                                                        >
                                                            {copiedItems.has('cname-record-value') ? (
                                                                <Check className="h-4 w-4 text-green-600" />
                                                            ) : (
                                                                <Copy className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Checking verification status...</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex gap-2">
                {verificationStatus?.verified ? (
                    <>
                        <Button 
                            onClick={() => window.open(`https://${verificationStatus.domain}`, '_blank')}
                            className="flex items-center gap-2 flex-1"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Visit Site
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleRemoveDomain}
                            disabled={isRemoving}
                            className="flex-1"
                        >
                            {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Domain
                        </Button>
                    </>
                ) : (
                    <>
                        <Button 
                            onClick={handleVerifyDomain} 
                            disabled={isChecking}
                            variant="outline"
                            className="flex-1"
                        >
                            {isChecking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Refresh Status
                        </Button>
                        <Button 
                            variant="destructive"
                            onClick={handleRemoveDomain}
                            disabled={isRemoving}
                            className="flex-1"
                        >
                            {isRemoving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Domain
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    )
}