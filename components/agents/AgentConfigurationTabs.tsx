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

interface SmartEndpointingPlan {
  provider?: string
  waitFunction?: string
}

interface StartSpeakingPlan {
  waitSeconds?: number
  smartEndpointingPlan?: SmartEndpointingPlan
}

interface StopSpeakingPlan {
  voiceSeconds?: number
}

interface VapiAgent {
  id: string
  name?: string
  firstMessage?: string
  firstMessageInterruptionsEnabled?: boolean
  voicemailMessage?: string
  endCallMessage?: string
  startSpeakingPlan?: StartSpeakingPlan
  stopSpeakingPlan?: StopSpeakingPlan
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
    startSpeakingPlan: {
      waitSeconds: vapiAgent.startSpeakingPlan?.waitSeconds ?? 0.3,
      smartEndpointingPlan: {
        provider: vapiAgent.startSpeakingPlan?.smartEndpointingPlan?.provider ?? 'livekit',
        waitFunction: vapiAgent.startSpeakingPlan?.smartEndpointingPlan?.waitFunction ?? '(20 + 500 * sqrt(x) + 2500 * x^3 + 700 + 4000 * max(0, x-0.5)) / 2',
      }
    },
    stopSpeakingPlan: {
      voiceSeconds: vapiAgent.stopSpeakingPlan?.voiceSeconds ?? 0.1,
    }
  })

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNestedInputChange = (
    section: 'startSpeakingPlan' | 'stopSpeakingPlan',
    field: string,
    value: number,
    nestedField?: string,
    stringValue?: string
  ) => {
    setFormData(prev => {
      if (nestedField) {
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: {
              ...(prev[section] as any)[field],
              [nestedField]: stringValue !== undefined ? stringValue : value
            }
          }
        }
      }
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }
    })
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
        startSpeakingPlan: formData.startSpeakingPlan,
        stopSpeakingPlan: formData.stopSpeakingPlan,
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
    formData.endCallMessage !== (vapiAgent.endCallMessage || '') ||
    formData.startSpeakingPlan.waitSeconds !== (vapiAgent.startSpeakingPlan?.waitSeconds ?? 0.3) ||
    formData.startSpeakingPlan.smartEndpointingPlan.provider !== (vapiAgent.startSpeakingPlan?.smartEndpointingPlan?.provider ?? 'livekit') ||
    formData.startSpeakingPlan.smartEndpointingPlan.waitFunction !== (vapiAgent.startSpeakingPlan?.smartEndpointingPlan?.waitFunction ?? '(20 + 500 * sqrt(x) + 2500 * x^3 + 700 + 4000 * max(0, x-0.5)) / 2') ||
    formData.stopSpeakingPlan.voiceSeconds !== (vapiAgent.stopSpeakingPlan?.voiceSeconds ?? 0.1)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
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
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter agent name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="systemMessage">System Prompt</Label>
                <Textarea
                  id="systemMessage"
                  value={formData.systemMessage}
                  onChange={(e) => handleInputChange('systemMessage', e.target.value)}
                  placeholder="Enter your agent's system prompt here..."
                  className="min-h-[400px] font-mono text-sm"
                />
              </div>
              
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
            <CardContent className="space-y-6">
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
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold">Start Speaking Plan</h3>
                <div className="space-y-2">
                  <Label htmlFor="waitSeconds">Wait Seconds</Label>
                  <Input
                    id="waitSeconds"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.startSpeakingPlan.waitSeconds}
                    onChange={(e) => handleNestedInputChange('startSpeakingPlan', 'waitSeconds', parseFloat(e.target.value))}
                    placeholder="0.3"
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to wait before the agent starts speaking
                  </p>
                </div>
                
                {/* <div className="space-y-4 pl-4 border-l-2">
                  <h4 className="text-sm font-medium">Smart Endpointing Plan (LiveKit)</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input
                      id="provider"
                      type="text"
                      value={formData.startSpeakingPlan.smartEndpointingPlan.provider}
                      onChange={(e) => handleNestedInputChange('startSpeakingPlan', 'smartEndpointingPlan', 0, 'provider', e.target.value)}
                      placeholder="livekit"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="waitFunction">Wait Function</Label>
                    <Textarea
                      id="waitFunction"
                      value={formData.startSpeakingPlan.smartEndpointingPlan.waitFunction}
                      onChange={(e) => handleNestedInputChange('startSpeakingPlan', 'smartEndpointingPlan', 0, 'waitFunction', e.target.value)}
                      placeholder="(20 + 500 * sqrt(x) + 2500 * x^3 + 700 + 4000 * max(0, x-0.5)) / 2"
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Mathematical function to determine wait time based on speech pattern
                    </p>
                  </div>
                </div> */}
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold">Stop Speaking Plan</h3>
                <div className="space-y-2">
                  <Label htmlFor="voiceSeconds">Voice Seconds</Label>
                  <Input
                    id="voiceSeconds"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.stopSpeakingPlan.voiceSeconds}
                    onChange={(e) => handleNestedInputChange('stopSpeakingPlan', 'voiceSeconds', parseFloat(e.target.value))}
                    placeholder="0.1"
                  />
                  <p className="text-xs text-muted-foreground">
                    How long to wait after detecting voice before stopping
                  </p>
                </div>
              </div>
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
