'use client'

import { ApiRequestTool, UpdateVapiToolDto } from "@/app/api/agents/tools/ToolTypes"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { Loader2, Plus, X, Edit } from "lucide-react"
import { toast } from "sonner"

interface HeaderEntry {
    key: string
    value: string
}

interface BodyProperty {
    key: string
    description: string
    type: string
    defaultValue: string
    enumValues: string[]
    required: boolean
}

export function VapiApiRequestTool({ tool, onSave }: { tool: ApiRequestTool, onSave: (toolData: UpdateVapiToolDto) => void }) {
    const [name, setName] = useState(tool.function.name)
    const [description, setDescription] = useState(tool.function.description)
    const [toolName, setToolName] = useState(tool.name)
    const [url, setUrl] = useState(tool.url)
    const [method, setMethod] = useState(tool.method)
    
    // Convert headers to array format for editing
    const [headers, setHeaders] = useState<HeaderEntry[]>(() => {
        if (!tool.headers?.properties) return []
        return Object.entries(tool.headers.properties).map(([key, value]) => ({
            key,
            value: value.value
        }))
    })
    
    // Convert body properties to array format for editing
    const [bodyProperties, setBodyProperties] = useState<BodyProperty[]>(() => {
        if (!tool.body?.properties) return []
        const requiredFields = tool.body.required || []
        return Object.entries(tool.body.properties).map(([key, value]) => ({
            key,
            description: value.description || "",
            type: value.type,
            defaultValue: value.default || "",
            enumValues: value.enum || [],
            required: requiredFields.includes(key)
        }))
    })
    
    const [editingProperty, setEditingProperty] = useState<BodyProperty | null>(null)
    const [isPropertyDialogOpen, setIsPropertyDialogOpen] = useState(false)
    
    const [saving, setSaving] = useState(false)

    const addHeader = () => {
        setHeaders([...headers, { key: "", value: "" }])
    }

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index))
    }

    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers]
        newHeaders[index][field] = value
        setHeaders(newHeaders)
    }

    const addBodyProperty = () => {
        const newProperty = { key: "", description: "", type: "string", defaultValue: "", enumValues: [], required: false }
        setEditingProperty(newProperty)
        setIsPropertyDialogOpen(true)
    }

    const editBodyProperty = (property: BodyProperty) => {
        setEditingProperty({ ...property })
        setIsPropertyDialogOpen(true)
    }

    const removeBodyProperty = (index: number) => {
        setBodyProperties(bodyProperties.filter((_, i) => i !== index))
    }

    const savePropertyChanges = () => {
        if (!editingProperty) return
        
        if (!editingProperty.key.trim()) {
            toast.error("Property name is required")
            return
        }

        const existingIndex = bodyProperties.findIndex(p => p.key === editingProperty.key)
        
        if (existingIndex >= 0) {
            // Update existing property
            const newProperties = [...bodyProperties]
            newProperties[existingIndex] = editingProperty
            setBodyProperties(newProperties)
        } else {
            // Add new property
            setBodyProperties([...bodyProperties, editingProperty])
        }
        
        setIsPropertyDialogOpen(false)
        setEditingProperty(null)
    }

    const addEnumValue = () => {
        if (!editingProperty) return
        setEditingProperty({
            ...editingProperty,
            enumValues: [...editingProperty.enumValues, ""]
        })
    }

    const updateEnumValue = (index: number, value: string) => {
        if (!editingProperty) return
        const newEnumValues = [...editingProperty.enumValues]
        newEnumValues[index] = value
        setEditingProperty({
            ...editingProperty,
            enumValues: newEnumValues
        })
    }

    const removeEnumValue = (index: number) => {
        if (!editingProperty) return
        setEditingProperty({
            ...editingProperty,
            enumValues: editingProperty.enumValues.filter((_, i) => i !== index)
        })
    }

    const validateHeaders = () => {
        return headers.every(header => {
            if (!header.key.trim() && !header.value.trim()) return true // Empty entries are ok
            return header.key.trim() && header.value.trim() // Both must be filled if one is filled
        })
    }

    const validateBodyProperties = () => {
        return bodyProperties.every(prop => prop.key.trim()) // All properties must have a key
    }

    const handleSave = async () => {
        // Validate before saving
        if (!validateHeaders()) {
            toast.error("Invalid headers", {
                description: "Please fill in both header name and value, or remove empty entries."
            })
            return
        }

        if (!validateBodyProperties()) {
            toast.error("Invalid body properties", {
                description: "Please provide a property name for all body properties, or remove empty entries."
            })
            return
        }

        try {
            setSaving(true)
            
            // Convert headers array back to object format
            const headersObject = headers.length > 0 ? {
                type: "object" as const,
                properties: headers.reduce((acc, header) => {
                    if (header.key.trim() && header.value.trim()) {
                        acc[header.key] = {
                            type: "string",
                            value: header.value
                        }
                    }
                    return acc
                }, {} as Record<string, { type: string; value: string }>)
            } : undefined

            // Convert body properties array back to object format
            const bodyObject = bodyProperties.length > 0 ? {
                type: "object" as const,
                required: bodyProperties.filter(prop => prop.required && prop.key.trim()).map(prop => prop.key),
                properties: bodyProperties.reduce((acc, prop) => {
                    if (prop.key.trim()) {
                        const propertyDef: any = {
                            description: prop.description || `${prop.key} parameter`,
                            type: prop.type,
                            default: prop.defaultValue
                        }
                        
                        if (prop.enumValues.length > 0) {
                            propertyDef.enum = prop.enumValues.filter(val => val.trim())
                        }
                        
                        acc[prop.key] = propertyDef
                    }
                    return acc
                }, {} as Record<string, any>)
            } : undefined
            
            const updatedTool = {
                function: {
                    name,
                    description
                },
                name: toolName,
                url,
                method,
                headers: headersObject,
                body: bodyObject,
                variableExtractionPlan: {
                    schema: {
                        type: "object" as const,
                        required: [],
                        properties: {}
                    },
                    aliases: []
                }
            }
            
            await onSave(updatedTool)
            
            toast.success("API request tool configuration saved successfully!", {
                description: "Your changes have been applied to the agent."
            })
            
        } catch (error) {
            console.error('Error saving tool:', error)
            toast.error("Failed to save configuration", {
                description: "Please try again or contact support if the issue persists."
            })
        } finally {
            setSaving(false)
        }
    }

    const isFormValid = name.trim() && description.trim() && toolName.trim() && url.trim() && validateHeaders() && validateBodyProperties()
    const isFormDisabled = saving

    const getHeaderError = (header: HeaderEntry) => {
        const hasKey = header.key.trim()
        const hasValue = header.value.trim()
        if ((hasKey && !hasValue) || (!hasKey && hasValue)) {
            return "Both name and value are required"
        }
        return null
    }

    const PropertyEditDialog = () => {
        if (!editingProperty) return null

        return (
            <Dialog open={isPropertyDialogOpen} onOpenChange={setIsPropertyDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {bodyProperties.some(p => p.key === editingProperty.key) ? 'Edit Property' : 'Add Property'}
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                        {/* Property Name */}
                        <div className="space-y-2">
                            <Label htmlFor="property-name">Name</Label>
                            <Textarea
                                id="property-name"
                                placeholder="Property key"
                                value={editingProperty.key}
                                onChange={(e) => setEditingProperty({...editingProperty, key: e.target.value})}
                                rows={1}
                                className="resize-none"
                            />
                        </div>

                        {/* Property Type */}
                        <div className="space-y-2">
                            <Label htmlFor="property-type">Type</Label>
                            <Select 
                                value={editingProperty.type} 
                                onValueChange={(value) => setEditingProperty({...editingProperty, type: value})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="string">string</SelectItem>
                                    <SelectItem value="number">number</SelectItem>
                                    <SelectItem value="boolean">boolean</SelectItem>
                                    <SelectItem value="object">object</SelectItem>
                                    <SelectItem value="array">array</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Default Value */}
                        <div className="space-y-2">
                            <Label htmlFor="default-value">Default Value</Label>
                            <Textarea
                                id="default-value"
                                placeholder="Default or fixed value for this property"
                                value={editingProperty.defaultValue}
                                onChange={(e) => setEditingProperty({...editingProperty, defaultValue: e.target.value})}
                                rows={2}
                            />
                            <p className="text-xs text-muted-foreground">Default or fixed value for this property</p>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="property-description">Description</Label>
                            <Textarea
                                id="property-description"
                                placeholder="Property description (optional)"
                                value={editingProperty.description}
                                onChange={(e) => setEditingProperty({...editingProperty, description: e.target.value})}
                                rows={3}
                            />
                        </div>

                        {/* Enum Values */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Enum Values</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={addEnumValue}
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Value
                                </Button>
                            </div>
                            
                            {editingProperty.enumValues.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">No enum values defined</p>
                            ) : (
                                <div className="space-y-2">
                                    {editingProperty.enumValues.map((enumValue, index) => (
                                        <div key={index} className="flex gap-2">
                                            <Input
                                                placeholder="Enum value"
                                                value={enumValue}
                                                onChange={(e) => updateEnumValue(index, e.target.value)}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => removeEnumValue(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Required Checkbox */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="required"
                                checked={editingProperty.required}
                                onCheckedChange={(checked) => setEditingProperty({...editingProperty, required: !!checked})}
                            />
                            <Label htmlFor="required">Required</Label>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsPropertyDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={savePropertyChanges}
                                className="bg-teal-600 hover:bg-teal-700"
                            >
                                Apply
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>API Request Tool Configuration</CardTitle>
                <CardDescription>
                    Configure your API request tool to make HTTP calls during conversations
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="function-name">Function Name</Label>
                        <Input
                            id="function-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter function name"
                            disabled={isFormDisabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tool-name">Tool Name</Label>
                        <Input
                            id="tool-name"
                            value={toolName}
                            onChange={(e) => setToolName(e.target.value)}
                            placeholder="Enter tool name (e.g., getUserData)"
                            disabled={isFormDisabled}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="function-description">Function Description</Label>
                    <Textarea
                        id="function-description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe when this API should be called"
                        disabled={isFormDisabled}
                        rows={2}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label htmlFor="api-url">API URL</Label>
                        <Input
                            id="api-url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://api.example.com/endpoint"
                            disabled={isFormDisabled}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="http-method">HTTP Method</Label>
                        <Select value={method} onValueChange={(value) => setMethod(value as typeof method)} disabled={isFormDisabled}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="GET">GET</SelectItem>
                                <SelectItem value="POST">POST</SelectItem>
                                <SelectItem value="PUT">PUT</SelectItem>
                                <SelectItem value="PATCH">PATCH</SelectItem>
                                <SelectItem value="DELETE">DELETE</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Headers Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Headers</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addHeader}
                            disabled={isFormDisabled}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Header
                        </Button>
                    </div>
                    
                    {headers.map((header, index) => {
                        const error = getHeaderError(header)
                        return (
                            <div key={index} className="space-y-1">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Header name (e.g., Authorization)"
                                        value={header.key}
                                        onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                        disabled={isFormDisabled}
                                        className={error ? "border-red-500" : ""}
                                    />
                                    <Input
                                        placeholder="Header value (e.g., Bearer token123)"
                                        value={header.value}
                                        onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                        disabled={isFormDisabled}
                                        className={error ? "border-red-500" : ""}
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeHeader(index)}
                                        disabled={isFormDisabled}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {error && (
                                    <p className="text-sm text-red-600">{error}</p>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Body Properties Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Request Body Properties</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addBodyProperty}
                            disabled={isFormDisabled}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Property
                        </Button>
                    </div>
                    
                    {bodyProperties.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No properties defined</p>
                    ) : (
                        <div className="space-y-2">
                            {bodyProperties.map((property, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{property.key}</span>
                                            <span className="text-xs bg-muted px-2 py-1 rounded">{property.type}</span>
                                            {property.required && (
                                                <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">Required</span>
                                            )}
                                            {property.enumValues.length > 0 && (
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    Enum ({property.enumValues.length})
                                                </span>
                                            )}
                                        </div>
                                        {property.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{property.description}</p>
                                        )}
                                        {property.defaultValue && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Default: <code className="bg-muted px-1 rounded">{property.defaultValue}</code>
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => editBodyProperty(property)}
                                            disabled={isFormDisabled}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeBodyProperty(index)}
                                            disabled={isFormDisabled}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Button 
                    onClick={handleSave} 
                    disabled={!isFormValid || isFormDisabled}
                    className="w-full"
                >
                    {saving ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving Configuration...
                        </>
                    ) : (
                        'Save API Request Configuration'
                    )}
                </Button>
            </CardContent>
            
            <PropertyEditDialog />
        </Card>
    )
}
