'use client'

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Download } from "lucide-react"
import { getVapiAgentsExcludingExisting } from "@/app/api/agents/getVapiAgents"
import { assignVapiAgentToClient } from "@/app/api/agents/assignAgentToClient"
import { toast } from "sonner"

interface VapiAgent {
  id: string
  name: string
  firstMessage?: string
  voice?: {
    voiceId: string
    provider: string
  }
  model?: {
    model: string
    provider: string
  }
  createdAt: string
  updatedAt: string
}

export default function ImportAgent({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState("vapi")
  const [agents, setAgents] = useState<VapiAgent[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAgents = useCallback(async () => {
    if (provider !== "vapi") return
    
    setLoading(true)
    try {
      const data = await getVapiAgentsExcludingExisting(clientId)
      setAgents(data)
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }, [provider, clientId])

  useEffect(() => {
    if (open && provider) {
      fetchAgents()
    }
  }, [open, provider, fetchAgents])


function AgentCard({ 
  agent, 
  clientId, 
  onImportSuccess 
}: { 
  agent: VapiAgent
  clientId: string
  onImportSuccess: () => void
}) {
  const [importing, setImporting] = useState(false)

  const handleImport = async () => {
    setImporting(true)
    try {
      await assignVapiAgentToClient(clientId, agent.id)
      toast.success(`Agent "${agent.name}" imported successfully!`)
      // Close dialog after successful import
      onImportSuccess()
    } catch (error) {
      console.error('Error importing agent:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to import agent')
    } finally {
      setImporting(false)
    }
  }
  
  return (
    <Card key={agent.id} className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{agent.name}</CardTitle>
          <Button
            size="sm"
            onClick={() => handleImport()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Import"
            )}
          </Button>
        </div>
        {agent.firstMessage && (
          <CardDescription className="line-clamp-2">
            {agent.firstMessage}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-3">
          {agent.voice && (
            <Badge variant="secondary">
              Voice: {agent.voice.voiceId}
            </Badge>
          )}
          {agent.model && (
            <Badge variant="outline">
              Model: {agent.model.model}
            </Badge>
          )}
          <Badge variant="outline" className="text-xs">
            Updated: {new Date(agent.updatedAt).toLocaleDateString()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Import Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Agent</DialogTitle>
          <DialogDescription>
            Select a provider and choose an agent to import to this client.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium mb-3 block">Provider</label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger>
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vapi">Vapi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading agents...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {agents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No agents available to import
                </div>
              ) : (
                agents.map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    clientId={clientId}
                    onImportSuccess={() => setOpen(false)}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}