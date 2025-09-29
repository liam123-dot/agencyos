'use client'

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Save, Loader2 } from "lucide-react"
import { updateVapiAgent, UpdateAgentConfigData } from "@/app/api/agents/updateVapiAgent"
import { toast } from "sonner"
interface VapiAgent {
  id: string
  name?: string
  firstMessage?: string
  firstMessageInterruptionsEnabled?: boolean
  voicemailMessage?: string
  endCallMessage?: string
  model?: any
}

interface AgentConfigurationTabsProps {
  agentId: string
  vapiAgent: VapiAgent
}

export function AgentConfigurationTabs({ agentId, vapiAgent }: AgentConfigurationTabsProps) {
  const [loading, setLoading] = useState(false)
  
  // Extract system message from model.messages
  const systemMessage = (() => {
    if (!vapiAgent.model || !('messages' in vapiAgent.model)) return ''
    const messages = vapiAgent.model.messages
    if (!Array.isArray(messages)) return ''
    const systemMsg = messages.find(msg => msg.role === 'system')
    return systemMsg?.content || ''
  })()
  
  const [formData, setFormData] = useState({
    name: vapiAgent.name || '',
    systemMessage: systemMessage,
    firstMessage: vapiAgent.firstMessage || '',
    firstMessageInterruptionsEnabled: vapiAgent.firstMessageInterruptionsEnabled ?? false,
    voicemailMessage: vapiAgent.voicemailMessage || '',
    endCallMessage: vapiAgent.endCallMessage || '',
  })

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updateData: UpdateAgentConfigData = {
        name: formData.name,
        systemMessage: formData.systemMessage,
        firstMessage: formData.firstMessage,
        firstMessageInterruptionsEnabled: formData.firstMessageInterruptionsEnabled,
        voicemailMessage: formData.voicemailMessage,
        endCallMessage: formData.endCallMessage,
      }

      await updateVapiAgent(agentId, updateData)
      toast.success('Agent configuration updated successfully!')
    } catch (error) {
      console.error('Error updating agent:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update agent configuration')
    } finally {
      setLoading(false)
    }
  }

  const hasChanges = 
    formData.name !== (vapiAgent.name || '') ||
    formData.systemMessage !== systemMessage ||
    formData.firstMessage !== (vapiAgent.firstMessage || '') ||
    formData.firstMessageInterruptionsEnabled !== (vapiAgent.firstMessageInterruptionsEnabled ?? false) ||
    formData.voicemailMessage !== (vapiAgent.voicemailMessage || '') ||
    formData.endCallMessage !== (vapiAgent.endCallMessage || '')

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="system">System Prompt</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic configuration for your agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                The main instructions that guide your agent's behavior and responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemMessage">System Message</Label>
                <Textarea
                  id="systemMessage"
                  value={formData.systemMessage}
                  onChange={(e) => handleInputChange('systemMessage', e.target.value)}
                  placeholder="Enter your agent's system prompt here..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Messages</CardTitle>
              <CardDescription>
                Configure the messages your agent uses in different scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="firstMessage">First Message</Label>
                <Textarea
                  id="firstMessage"
                  value={formData.firstMessage}
                  onChange={(e) => handleInputChange('firstMessage', e.target.value)}
                  placeholder="The first message your agent will say when answering a call"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="firstMessageInterruptionsEnabled"
                  checked={formData.firstMessageInterruptionsEnabled}
                  onCheckedChange={(checked) => 
                    handleInputChange('firstMessageInterruptionsEnabled', checked === true)
                  }
                />
                <Label 
                  htmlFor="firstMessageInterruptionsEnabled" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Allow interruptions during first message
                </Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voicemailMessage">Voicemail Message</Label>
                <Textarea
                  id="voicemailMessage"
                  value={formData.voicemailMessage}
                  onChange={(e) => handleInputChange('voicemailMessage', e.target.value)}
                  placeholder="The message your agent will leave when calling goes to voicemail"
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endCallMessage">End Call Message</Label>
                <Textarea
                  id="endCallMessage"
                  value={formData.endCallMessage}
                  onChange={(e) => handleInputChange('endCallMessage', e.target.value)}
                  placeholder="The message your agent will say before ending a call"
                  className="min-h-[100px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>
                Advanced configuration options for your agent
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Advanced settings will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading || !hasChanges}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  )
}
