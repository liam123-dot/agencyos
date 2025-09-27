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
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

const PropertyCard = ({ property, isNew, onSave, onCancel, updateProperty }: {
    property: BodyProperty
    isNew: boolean
    onSave: () => void
    onCancel: () => void
    updateProperty: (prop: BodyProperty) => void
}) => {
    const addEnumValue = () => {
        updateProperty({
            ...property,
            enumValues: [...property.enumValues, ""]
        })
    }

    const updateEnumValue = (enumIndex: number, value: string) => {
        const newEnumValues = [...property.enumValues]
        newEnumValues[enumIndex] = value
        updateProperty({
            ...property,
            enumValues: newEnumValues
        })
    }

    const removeEnumValue = (enumIndex: number) => {
        updateProperty({
            ...property,
            enumValues: property.enumValues.filter((_, i) => i !== enumIndex)
        })
    }

    return (
        <Card className="border-2 border-teal-200 bg-teal-50/50">
            <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-medium">{isNew ? 'Add New Property' : 'Edit Property'}</h4>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Property Name */}
                    <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                            placeholder="Property key"
                            value={property.key}
                            onChange={(e) => updateProperty({...property, key: e.target.value})}
                        />
                    </div>

                    {/* Property Type */}
                    <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                            value={property.type}
                            onValueChange={(value) => updateProperty({...property, type: value})}
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
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                        placeholder="Property description (optional)"
                        value={property.description}
                        onChange={(e) => updateProperty({...property, description: e.target.value})}
                        rows={2}
                    />
                </div>

                {/* Default Value */}
                <div className="space-y-2">
                    <Label>Default Value</Label>
                    <Input
                        placeholder="Default or fixed value for this property"
                        value={property.defaultValue}
                        onChange={(e) => updateProperty({...property, defaultValue: e.target.value})}
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

                    {property.enumValues.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">No enum values defined</p>
                    ) : (
                        <div className="space-y-2">
                            {property.enumValues.map((enumValue, index) => (
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
                        checked={property.required}
                        onCheckedChange={(checked) => updateProperty({...property, required: !!checked})}
                    />
                    <Label>Required</Label>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isNew ? 'Add Property' : 'Save Changes'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

const PropertyPreview = ({ property, onEdit, onRemove, isFormDisabled }: {
    property: BodyProperty
    onEdit: () => void
    onRemove: () => void
    isFormDisabled: boolean
}) => {
    const getPreviewValue = () => {
        if (property.defaultValue) return property.defaultValue
        if (property.enumValues.length > 0) return property.enumValues[0]
        switch (property.type) {
            case "number": return "0"
            case "boolean": return "false"
            case "object": return "{}"
            case "array": return "[]"
            default: return "\"example\""
        }
    }

    return (
        <Card className="border hover:border-gray-300 transition-colors">
            <CardContent className="p-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{property.key}</span>
                            <Badge variant="secondary" className="text-xs">{property.type}</Badge>
                            {property.required && (
                                <Badge variant="destructive" className="text-xs">Required</Badge>
                            )}
                            {property.enumValues.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    Enum ({property.enumValues.length})
                                </Badge>
                            )}
                        </div>

                        {property.description && (
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{property.description}</p>
                        )}

                        <div className="text-xs text-muted-foreground">
                            <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                                "{property.key}": {getPreviewValue()}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onEdit}
                            disabled={isFormDisabled}
                        >
                            <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onRemove}
                            disabled={isFormDisabled}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
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
    
    const [editingPropertyIndex, setEditingPropertyIndex] = useState<number | null>(null)
    const [editingProperty, setEditingProperty] = useState<BodyProperty | null>(null)
    const [newProperty, setNewProperty] = useState<BodyProperty | null>(null)
    
    const [saving, setSaving] = useState(false)

    // Derived helpers & previews
    const headerCount = headers.filter(h => h.key.trim() && h.value.trim()).length
    const bodyPropCount = bodyProperties.filter(p => p.key.trim()).length

    const previewHeadersObject = headers.reduce((acc, h) => {
        if (h.key.trim() && h.value.trim()) acc[h.key] = h.value
        return acc
    }, {} as Record<string, string>)

    const previewBodyObject = bodyProperties.reduce((acc, p) => {
        if (!p.key.trim()) return acc
        let example: any = p.defaultValue
        if (!example || example === "") {
            if (p.enumValues.length > 0) {
                example = p.enumValues[0]
            } else {
                switch (p.type) {
                    case "number": example = 0; break
                    case "boolean": example = false; break
                    case "object": example = {}; break
                    case "array": example = []; break
                    default: example = "example"; break
                }
            }
        }
        acc[p.key] = example
        return acc
    }, {} as Record<string, any>)

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
        const newProp = { key: "", description: "", type: "string", defaultValue: "", enumValues: [], required: false }
        setNewProperty(newProp)
    }

    const editBodyProperty = (index: number) => {
        setEditingPropertyIndex(index)
        setEditingProperty({ ...bodyProperties[index] })
    }

    const cancelEdit = () => {
        setEditingPropertyIndex(null)
        setEditingProperty(null)
        setNewProperty(null)
    }

    const removeBodyProperty = (index: number) => {
        setBodyProperties(bodyProperties.filter((_, i) => i !== index))
    }

    const savePropertyChanges = (property: BodyProperty, isNew: boolean = false) => {
        if (!property.key.trim()) {
            toast.error("Property name is required")
            return
        }

        if (isNew) {
            // Add new property
            setBodyProperties([...bodyProperties, property])
            setNewProperty(null)
        } else if (editingPropertyIndex !== null) {
            // Update existing property
            const newProperties = [...bodyProperties]
            newProperties[editingPropertyIndex] = property
            setBodyProperties(newProperties)
            setEditingPropertyIndex(null)
            setEditingProperty(null)
        }
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

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>API Request Tool</CardTitle>
                <CardDescription>
                    Make HTTP calls during conversations
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <Alert>
                    <AlertDescription>
                        Give the function a clear name and describe when the agent should call it.
                    </AlertDescription>
                </Alert>

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
                        <p className="text-xs text-muted-foreground">Shown to the agent when selecting a tool.</p>
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
                        <p className="text-xs text-muted-foreground">A concise identifier used in logs and routing.</p>
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
                    <p className="text-xs text-muted-foreground">Explain the intent so the agent knows when to use it.</p>
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
                        <p className="text-xs text-muted-foreground">Use full URL including protocol. Supports environment-based URLs.</p>
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
                        <p className="text-xs text-muted-foreground">Choose the HTTP verb that matches your endpoint.</p>
                    </div>
                </div>

                <Separator />

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
                    <p className="text-xs text-muted-foreground">Add only the headers your API requires (e.g., Authorization).</p>
                    
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

                <Separator />

                {/* Body Properties Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label>Request Body Properties</Label>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addBodyProperty}
                            disabled={isFormDisabled || newProperty !== null}
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Property
                        </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Define the JSON fields your endpoint accepts. Mark required fields as needed.</p>
                    
                    <div className="space-y-3">
                        {/* New Property Card */}
                        {newProperty && (
                            <PropertyCard
                                property={newProperty}
                                isNew={true}
                                onSave={() => savePropertyChanges(newProperty, true)}
                                onCancel={cancelEdit}
                                updateProperty={setNewProperty}
                            />
                        )}

                        {/* Existing Properties */}
                        {bodyProperties.map((property, index) => (
                            <div key={index}>
                                {editingPropertyIndex === index && editingProperty ? (
                                    <PropertyCard
                                        property={editingProperty}
                                        isNew={false}
                                        onSave={() => savePropertyChanges(editingProperty, false)}
                                        onCancel={cancelEdit}
                                        updateProperty={setEditingProperty}
                                    />
                                ) : (
                                    <PropertyPreview
                                        property={property}
                                        onEdit={() => editBodyProperty(index)}
                                        onRemove={() => removeBodyProperty(index)}
                                        isFormDisabled={isFormDisabled}
                                    />
                                )}
                            </div>
                        ))}

                        {bodyProperties.length === 0 && !newProperty && (
                            <p className="text-sm text-muted-foreground italic">No properties defined</p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline" className="w-full md:w-auto">Preview request payload</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Request preview</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-2">
                                <div className="text-xs text-muted-foreground">This is an example of what will be sent.</div>
                                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
{JSON.stringify({ method, url, headers: previewHeadersObject, body: previewBodyObject }, null, 2)}
                                </pre>
                            </div>
                        </DialogContent>
                    </Dialog>
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
        </Card>
    )
}
