'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, X, HelpCircle, Search, Loader2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Switch } from "@/components/ui/switch"

export interface ConfigurableProp {
  name: string
  type: string
  app?: string
  label?: string
  description?: string
  optional?: boolean
  disabled?: boolean
  hidden?: boolean
  default?: string
  options?: string[]
  remoteOptions?: boolean
  useQuery?: boolean
  reloadProps?: boolean
  withLabel?: boolean
}

export interface PropConfig {
  mode: 'ai' | 'fixed' | 'empty'
  value?: string | boolean
  aiDescription?: string
  arrayItems?: Array<{ value: string; isAi: boolean; aiPrompt?: string }>
  aiCanAddMore?: boolean
  aiAddMorePrompt?: string
  forceRequired?: boolean
}

interface FieldConfigurationProps {
  prop: ConfigurableProp
  config: PropConfig
  onConfigChange: (config: Partial<PropConfig>) => void
  onRemove?: () => void
  remoteOptions?: Array<{ label: string; value: string }> | null
  isLoadingRemoteOptions?: boolean
  onRemoteSearch?: (query: string) => void
}

export function FieldConfiguration({ 
  prop, 
  config, 
  onConfigChange,
  onRemove,
  remoteOptions,
  isLoadingRemoteOptions,
  onRemoteSearch
}: FieldConfigurationProps) {
  const isRequired = !prop.optional
  const isArrayType = prop.type === 'string[]' || prop.type === 'integer[]'

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Label className="font-medium">{prop.label || prop.name}</Label>
            {isRequired && <span className="text-red-500 text-sm">*</span>}
            {prop.description && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{prop.description}</p>
                </TooltipContent>
              </Tooltip>
            )}
            {!isRequired && onRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="h-6 text-xs text-muted-foreground"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
        </div>
        
        {/* Mode selector - not shown for array types */}
        {!isArrayType && (
          <Select
            value={config.mode}
            onValueChange={(value: 'ai' | 'fixed') => 
              onConfigChange({ 
                mode: value, 
                value: value === 'fixed' ? config.value || '' : undefined,
                aiDescription: value === 'ai' ? config.aiDescription : undefined
              })
            }
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">AI Generated</SelectItem>
              <SelectItem value="fixed">Fixed Value</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Array types - special handling */}
      {isArrayType ? (
        <ArrayFieldInput 
          prop={prop}
          config={config}
          onConfigChange={onConfigChange}
        />
      ) : config.mode === 'ai' ? (
        <AIFieldInput 
          prop={prop}
          config={config}
          onConfigChange={onConfigChange}
        />
      ) : config.mode === 'fixed' ? (
        <FixedFieldInput 
          prop={prop}
          config={config}
          onConfigChange={onConfigChange}
          remoteOptions={remoteOptions}
          isLoadingRemoteOptions={isLoadingRemoteOptions}
          onRemoteSearch={onRemoteSearch}
        />
      ) : null}
    </div>
  )
}

// AI-generated field input
function AIFieldInput({ 
  prop,
  config, 
  onConfigChange 
}: { 
  prop: ConfigurableProp
  config: PropConfig
  onConfigChange: (config: Partial<PropConfig>) => void 
}) {
  const isOptional = prop.optional
  
  return (
    <div className="space-y-2">
      <Input
        placeholder="e.g., Extract recipient email from the conversation"
        value={config.aiDescription || ''}
        onChange={(e) => onConfigChange({ aiDescription: e.target.value })}
        className="text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Describe how the AI should determine this value
      </p>
      
      {/* Show force required checkbox only for optional fields in AI mode */}
      {isOptional && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded">
          <Switch
            id={`force-required-${prop.name}`}
            checked={config.forceRequired || false}
            onCheckedChange={(checked) => onConfigChange({ forceRequired: checked })}
          />
          <Label htmlFor={`force-required-${prop.name}`} className="text-xs cursor-pointer">
            Force as required field for AI
          </Label>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <HelpCircle className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                When enabled, the AI must provide a value for this field.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

// Fixed value field input
function FixedFieldInput({ 
  prop, 
  config, 
  onConfigChange,
  remoteOptions,
  isLoadingRemoteOptions,
  onRemoteSearch
}: { 
  prop: ConfigurableProp
  config: PropConfig
  onConfigChange: (config: Partial<PropConfig>) => void
  remoteOptions?: Array<{ label: string; value: string }> | null
  isLoadingRemoteOptions?: boolean
  onRemoteSearch?: (query: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState("")

  // Remote options dropdown with search (takes precedence over predefined options)
  if (prop.remoteOptions) {
    // Filter options locally if we have them
    const filteredOptions: Array<{ label: string; value: string }> = remoteOptions?.filter(option => 
      option.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.value.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    return (
      <div className="space-y-2">
        <Select
          value={String(config.value || '')}
          onValueChange={(value) => onConfigChange({ mode: 'fixed', value, aiDescription: undefined })}
          disabled={isLoadingRemoteOptions}
        >
          <SelectTrigger className={isLoadingRemoteOptions ? 'cursor-wait' : ''}>
            {isLoadingRemoteOptions ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading options...</span>
              </div>
            ) : (
              <SelectValue placeholder={`Select ${prop.label || prop.name}...`} />
            )}
          </SelectTrigger>
          <SelectContent className="max-h-[400px] overflow-hidden">
            {/* Search input - fixed at top */}
            <div className="bg-popover border-b px-2 py-2 sticky top-0 z-50">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => {
                    const query = e.target.value
                    setSearchQuery(query)
                    // Trigger remote search when query changes
                    if (onRemoteSearch) {
                      onRemoteSearch(query)
                    }
                  }}
                  className="pl-8 h-8 border-input"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            
            {/* Options list - scrollable */}
            <div className="overflow-y-auto max-h-[340px] p-1">
              {isLoadingRemoteOptions ? (
                <div className="px-2 py-8 text-center">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Loading options...</span>
                  </div>
                </div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                  {searchQuery ? `No options found matching "${searchQuery}"` : 'No options available'}
                </div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
    )
  }

  // Dropdown with predefined options
  if (prop.options && prop.options.length > 0) {
    return (
      <Select
        value={String(config.value || prop.default || '')}
        onValueChange={(value) => onConfigChange({ mode: 'fixed', value, aiDescription: undefined })}
      >
        <SelectTrigger>
          <SelectValue placeholder={`Select ${prop.label || prop.name}...`} />
        </SelectTrigger>
        <SelectContent>
          {prop.options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }
  
  // Boolean switch
  if (prop.type === 'boolean') {
    return (
      <div className="flex items-center gap-2 p-3 border rounded-md">
        <Switch
          checked={config.value === true}
          onCheckedChange={(checked) => onConfigChange({ mode: 'fixed', value: checked, aiDescription: undefined })}
        />
        <span className="text-sm">{config.value ? 'Enabled' : 'Disabled'}</span>
      </div>
    )
  }
  
  // Number input
  if (prop.type === 'integer') {
    return (
      <Input
        type="number"
        placeholder="Enter number..."
        value={String(config.value || '')}
        onChange={(e) => onConfigChange({ mode: 'fixed', value: e.target.value, aiDescription: undefined })}
      />
    )
  }
  
  // Default text input
  return (
    <Input
      placeholder="Enter text or insert data..."
      value={String(config.value || '')}
      onChange={(e) => onConfigChange({ mode: 'fixed', value: e.target.value, aiDescription: undefined })}
    />
  )
}

// Array field input
function ArrayFieldInput({ 
  prop,
  config, 
  onConfigChange 
}: { 
  prop: ConfigurableProp
  config: PropConfig
  onConfigChange: (config: Partial<PropConfig>) => void 
}) {
  const arrayItems = config.arrayItems || []

  const updateArrayItem = (index: number, updates: Partial<typeof arrayItems[0]>) => {
    const newItems = [...arrayItems]
    newItems[index] = { ...newItems[index], ...updates }
    onConfigChange({ arrayItems: newItems })
  }

  const removeArrayItem = (index: number) => {
    const newItems = arrayItems.filter((_, i) => i !== index)
    onConfigChange({ arrayItems: newItems })
  }

  const addArrayItem = () => {
    const newItems = [...arrayItems, { value: '', isAi: false }]
    onConfigChange({ arrayItems: newItems })
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Fixed/AI items */}
      {arrayItems.map((item, index) => (
        <div key={index} className="flex gap-2">
          <Select
            value={item.isAi ? 'ai' : 'fixed'}
            onValueChange={(mode) => {
              updateArrayItem(index, {
                isAi: mode === 'ai',
                value: mode === 'ai' ? '' : item.value,
                aiPrompt: mode === 'ai' ? item.aiPrompt || '' : undefined
              })
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="fixed">Fixed</SelectItem>
            </SelectContent>
          </Select>
          
          {item.isAi ? (
            <Input
              placeholder="AI prompt (e.g., Extract email from conversation)"
              value={item.aiPrompt || ''}
              onChange={(e) => updateArrayItem(index, { aiPrompt: e.target.value })}
              className="flex-1"
            />
          ) : (
            <Input
              placeholder={prop.type === 'integer[]' ? 'Enter number...' : 'Enter value...'}
              value={item.value}
              type={prop.type === 'integer[]' ? 'number' : 'text'}
              onChange={(e) => updateArrayItem(index, { value: e.target.value })}
              className="flex-1"
            />
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeArrayItem(index)}
            className="h-10 w-10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      
      <Button
        variant="outline"
        size="sm"
        onClick={addArrayItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Item
      </Button>
      
      {/* AI can add more option */}
      <div className="pt-2 border-t space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={config.aiCanAddMore || false}
            onChange={(e) => onConfigChange({ 
              aiCanAddMore: e.target.checked, 
              aiAddMorePrompt: e.target.checked ? config.aiAddMorePrompt : undefined 
            })}
            className="rounded border-gray-300"
          />
          <Label className="text-sm font-normal">AI can add additional items</Label>
        </div>
        {config.aiCanAddMore && (
          <Input
            placeholder="e.g., Add any other relevant email addresses from the conversation"
            value={config.aiAddMorePrompt || ''}
            onChange={(e) => onConfigChange({ aiAddMorePrompt: e.target.value })}
            className="text-sm"
          />
        )}
      </div>
      
      {/* Force required checkbox - only shown when appropriate */}
      {(() => {
        const isRequired = !prop.optional
        const hasManualItems = arrayItems.some(item => !item.isAi && item.value && item.value !== '')
        
        // Show checkbox if:
        // 1. Field is optional and aiCanAddMore is enabled, OR
        // 2. Field is required, aiCanAddMore is enabled, and there's at least one manual item
        const shouldShowCheckbox = config.aiCanAddMore && (
          !isRequired || (isRequired && hasManualItems)
        )
        
        if (!shouldShowCheckbox) return null
        
        return (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded mt-2">
            <Switch
              id={`force-required-${prop.name}`}
              checked={config.forceRequired || false}
              onCheckedChange={(checked) => onConfigChange({ forceRequired: checked })}
            />
            <Label htmlFor={`force-required-${prop.name}`} className="text-xs cursor-pointer">
              Force AI to add items
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  When enabled, the AI must add at least one item to this list.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
        )
      })()}
    </div>
  )
}
