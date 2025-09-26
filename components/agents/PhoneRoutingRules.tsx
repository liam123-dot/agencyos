'use client'

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
    Clock, 
    Plus, 
    Trash2, 
    Phone, 
    Bot, 
    Calendar,
    AlertTriangle,
    CheckCircle,
    RotateCcw,
    Edit
} from "lucide-react"
import { toast } from "sonner"

import { ClientRoutingRule, RoutingRuleDTO } from "@/lib/types/routing-rules"
import { createRoutingRule, updateRoutingRule, deleteRoutingRule } from "@/app/api/agents/routing-rules/actions"

interface PhoneRoutingRulesClientProps {
    agentId: string
    agentName: string
    assignedNumbers: string[]
    initialRules: ClientRoutingRule[]
}

const DAYS = [
    { key: 'Mon', label: 'Mon' },
    { key: 'Tue', label: 'Tue' },
    { key: 'Wed', label: 'Wed' },
    { key: 'Thu', label: 'Thu' },
    { key: 'Fri', label: 'Fri' },
    { key: 'Sat', label: 'Sat' },
    { key: 'Sun', label: 'Sun' }
]

export function PhoneRoutingRulesClient({ agentId, agentName, assignedNumbers, initialRules }: PhoneRoutingRulesClientProps) {
    const [rules, setRules] = useState<ClientRoutingRule[]>(initialRules)
    const [isAddingRule, setIsAddingRule] = useState(false)
    const [editingRuleId, setEditingRuleId] = useState<string | null>(null)
    const [newRule, setNewRule] = useState<Partial<ClientRoutingRule>>({
        name: '',
        enabled: true,
        timeRange: { start: '09:00', end: '17:00' },
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        routeTo: ''
    })

    // Check for overlapping rules
    const checkForOverlaps = useCallback((testRule: ClientRoutingRule, excludeId?: string) => {
        const overlappingRules = rules.filter(rule => {
            if (rule.id === excludeId || !rule.enabled) return false
            
            // Check if days overlap
            const daysOverlap = testRule.days.some(day => rule.days.includes(day))
            if (!daysOverlap) return false
            
            // Check if time ranges overlap
            const testStart = timeToMinutes(testRule.timeRange.start)
            const testEnd = timeToMinutes(testRule.timeRange.end)
            const ruleStart = timeToMinutes(rule.timeRange.start)
            const ruleEnd = timeToMinutes(rule.timeRange.end)
            
            return (testStart < ruleEnd && testEnd > ruleStart)
        })
        
        return overlappingRules
    }, [rules])

    const timeToMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
    }

    const minutesToTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
    }

    const generatePreview = (rule: Partial<ClientRoutingRule>) => {
        if (!rule.timeRange || !rule.days || rule.days.length === 0) return ''
        
        const daysText = rule.days.length === 7 ? 'Daily' : 
                        rule.days.length === 5 && !rule.days.includes('Sat') && !rule.days.includes('Sun') ? 'Weekdays' :
                        rule.days.length === 2 && rule.days.includes('Sat') && rule.days.includes('Sun') ? 'Weekends' :
                        rule.days.join(', ')
        
        const timeText = `${rule.timeRange.start} - ${rule.timeRange.end}`
        
        const actionText = rule.routeTo ? `route calls to ${rule.routeTo}` : 'route calls to selected number'
        
        return `${daysText} from ${timeText}, ${actionText}`
    }

    const addRule = async () => {
        if (!newRule.name || !newRule.routeTo || !newRule.timeRange) {
            toast.error('Please fill in all required fields')
            return
        }

        try {
            if (editingRuleId) {
                // Update existing rule
                const existingRule = rules.find(r => r.id === editingRuleId)
                if (!existingRule) return
                
                const ruleToUpdate: ClientRoutingRule = {
                    ...existingRule,
                    ...newRule as ClientRoutingRule,
                    id: editingRuleId
                }
                
                const overlaps = checkForOverlaps(ruleToUpdate, editingRuleId)
                if (overlaps.length > 0) {
                    toast.error(`This rule overlaps with: ${overlaps.map(r => r.name).join(', ')}`)
                    return
                }

                const updateData: Partial<RoutingRuleDTO> = {
                    name: newRule.name,
                    enabled: newRule.enabled ?? true,
                    start_time: newRule.timeRange.start,
                    end_time: newRule.timeRange.end,
                    days: newRule.days || [],
                    route_to: newRule.routeTo
                }

                const result = await updateRoutingRule(editingRuleId, updateData)
                
                if (result.success) {
                    setRules(prev => prev.map(rule => 
                        rule.id === editingRuleId ? ruleToUpdate : rule
                    ))
                    toast.success('Routing rule updated successfully')
                } else {
                    toast.error(result.error || 'Failed to update routing rule')
                    return
                }
            } else {
                // Add new rule
                const ruleToAdd: ClientRoutingRule = {
                    ...newRule as ClientRoutingRule,
                    id: Date.now().toString(), // Temporary ID, will be replaced by server
                    priority: rules.length + 1
                }

                const overlaps = checkForOverlaps(ruleToAdd)
                if (overlaps.length > 0) {
                    toast.error(`This rule overlaps with: ${overlaps.map(r => r.name).join(', ')}`)
                    return
                }

                const createData: RoutingRuleDTO = {
                    agent_id: agentId,
                    organization_id: '', // This will be set by the server action
                    name: newRule.name!,
                    enabled: newRule.enabled ?? true,
                    start_time: newRule.timeRange.start,
                    end_time: newRule.timeRange.end,
                    days: newRule.days || [],
                    route_to: newRule.routeTo!
                }

                const result = await createRoutingRule(createData)
                
                if (result.success && result.data) {
                    // Convert the server response to client format
                    const newClientRule: ClientRoutingRule = {
                        id: result.data.id,
                        name: result.data.name,
                        enabled: result.data.enabled,
                        priority: rules.length + 1,
                        timeRange: {
                            start: result.data.start_time.slice(0, 5),
                            end: result.data.end_time.slice(0, 5)
                        },
                        days: result.data.days,
                        routeTo: result.data.route_to
                    }
                    
                    setRules(prev => [...prev, newClientRule])
                    toast.success('Routing rule added successfully')
                } else {
                    toast.error(result.error || 'Failed to create routing rule')
                    return
                }
            }

            // Reset form
            setNewRule({
                name: '',
                enabled: true,
                timeRange: { start: '09:00', end: '17:00' },
                days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                routeTo: ''
            })
            setIsAddingRule(false)
            setEditingRuleId(null)
        } catch (error) {
            console.error('Error saving routing rule:', error)
            toast.error('An unexpected error occurred')
        }
    }

    const editRule = (rule: ClientRoutingRule) => {
        setNewRule({
            name: rule.name,
            enabled: rule.enabled,
            timeRange: rule.timeRange,
            days: rule.days,
            routeTo: rule.routeTo
        })
        setEditingRuleId(rule.id)
        setIsAddingRule(true)
    }

    const deleteRule = async (id: string) => {
        try {
            const result = await deleteRoutingRule(id)
            
            if (result.success) {
                setRules(prev => prev.filter(rule => rule.id !== id))
                toast.success('Routing rule deleted')
            } else {
                toast.error(result.error || 'Failed to delete routing rule')
            }
        } catch (error) {
            console.error('Error deleting routing rule:', error)
            toast.error('An unexpected error occurred')
        }
    }

    const toggleRule = (id: string) => {
        setRules(prev => prev.map(rule => 
            rule.id === id ? { ...rule, enabled: !rule.enabled } : rule
        ))
    }

    const cancelEdit = () => {
        setNewRule({
            name: '',
            enabled: true,
            timeRange: { start: '09:00', end: '17:00' },
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            routeTo: ''
        })
        setIsAddingRule(false)
        setEditingRuleId(null)
    }

    const updateRulePriority = (id: string, direction: 'up' | 'down') => {
        const ruleIndex = rules.findIndex(rule => rule.id === id)
        if (ruleIndex === -1) return
        
        const newIndex = direction === 'up' ? ruleIndex - 1 : ruleIndex + 1
        if (newIndex < 0 || newIndex >= rules.length) return
        
        const newRules = [...rules]
        const [movedRule] = newRules.splice(ruleIndex, 1)
        newRules.splice(newIndex, 0, movedRule)
        
        // Update priorities
        newRules.forEach((rule, index) => {
            rule.priority = index + 1
        })
        
        setRules(newRules)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Phone Routing Rules
                </CardTitle>
                <CardDescription>
                    Create time-based rules to automatically route incoming calls to different numbers. 
                    Outside of these rules, calls will go to the agent.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Rules Summary */}
                {rules.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium">Rules Summary</h3>
                            <Badge variant="secondary">{rules.filter(r => r.enabled && r.id !== editingRuleId).length} active</Badge>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            {rules.filter(r => r.enabled && r.id !== editingRuleId).map((rule, index) => (
                                <div key={rule.id} className="flex items-center gap-2">
                                    <Badge variant="outline" className="w-8 h-6 text-xs">{index + 1}</Badge>
                                    <span>{rule.name}: {generatePreview(rule)}</span>
                                </div>
                            ))}
                            <div className="flex items-center gap-2 pt-1 border-t">
                                <Bot className="h-4 w-4" />
                                <span><strong>Default:</strong> All other times route to {agentName}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Existing Rules */}
                {rules.length > 0 && (
                    <div className="space-y-4">
                        <Separator />
                        <h3 className="text-sm font-medium">Active Rules</h3>
                        <div className="space-y-3">
                            {rules.filter(rule => rule.id !== editingRuleId).map((rule, index) => {
                                const overlaps = checkForOverlaps(rule, rule.id)
                                return (
                                    <Card key={rule.id} className={`${!rule.enabled ? 'opacity-60' : ''} ${overlaps.length > 0 ? 'border-destructive' : ''}`}>
                                        <CardContent className="pt-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <Badge variant={rule.enabled ? "default" : "secondary"} className="mt-1">
                                                        Priority {rule.priority}
                                                    </Badge>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="font-medium">{rule.name}</h4>
                                                            {overlaps.length > 0 && (
                                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {generatePreview(rule)}
                                                        </p>
                                                        {overlaps.length > 0 && (
                                                            <Alert className="mt-2">
                                                                <AlertTriangle className="h-4 w-4" />
                                                                <AlertDescription className="text-xs">
                                                                    Overlaps with: {overlaps.map(r => r.name).join(', ')}
                                                                </AlertDescription>
                                                            </Alert>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={rule.enabled}
                                                        onCheckedChange={() => toggleRule(rule.id)}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => editRule(rule)}
                                                        className="text-muted-foreground hover:text-foreground"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => deleteRule(rule.id)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Add New Rule */}
                <Separator />
                
                {!isAddingRule ? (
                    <Button onClick={() => setIsAddingRule(true)} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Rule
                    </Button>
                ) : (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                {editingRuleId ? 'Edit Routing Rule' : 'Create New Routing Rule'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Rule Name */}
                            <div className="space-y-2">
                                <Label htmlFor="rule-name">Rule Name</Label>
                                <Input
                                    id="rule-name"
                                    placeholder="e.g., Business Hours"
                                    value={newRule.name || ''}
                                    onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </div>

                            {/* Time Range */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Time Range
                                </Label>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="time"
                                            value={newRule.timeRange?.start || '09:00'}
                                            onChange={(e) => setNewRule(prev => ({
                                                ...prev,
                                                timeRange: { ...prev.timeRange!, start: e.target.value }
                                            }))}
                                            className="w-32"
                                        />
                                        <span className="text-muted-foreground">to</span>
                                        <Input
                                            type="time"
                                            value={newRule.timeRange?.end || '17:00'}
                                            onChange={(e) => setNewRule(prev => ({
                                                ...prev,
                                                timeRange: { ...prev.timeRange!, end: e.target.value }
                                            }))}
                                            className="w-32"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Days */}
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Days
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map((day) => (
                                        <Button
                                            key={day.key}
                                            variant={newRule.days?.includes(day.key) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                const currentDays = newRule.days || []
                                                const newDays = currentDays.includes(day.key)
                                                    ? currentDays.filter(d => d !== day.key)
                                                    : [...currentDays, day.key]
                                                setNewRule(prev => ({ ...prev, days: newDays }))
                                            }}
                                        >
                                            {day.label}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            {/* Route To */}
                            <div className="space-y-2">
                                <Label htmlFor="route-to" className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    Route to Phone Number
                                </Label>
                                <Input
                                    id="route-to"
                                    placeholder="+1 (555) 123-4567"
                                    value={newRule.routeTo || ''}
                                    onChange={(e) => setNewRule(prev => ({ ...prev, routeTo: e.target.value }))}
                                />
                            </div>

                            {/* Preview */}
                            {newRule.name && newRule.timeRange && newRule.days && newRule.days.length > 0 && newRule.routeTo && (
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium">Preview</p>
                                            <p className="text-sm text-muted-foreground">
                                                {generatePreview(newRule as ClientRoutingRule)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button onClick={addRule} className="flex-1">
                                    {editingRuleId ? (
                                        <>
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            Update Rule
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Rule
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={cancelEdit}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </CardContent>
        </Card>
    )
}
