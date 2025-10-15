'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Search, Loader2, Plus, HelpCircle, Info, Check } from "lucide-react"
import { searchApps, getAppAccounts, getAppActions, getExistingConnections, configureComponentProps } from "@/app/s/[orgId]/api/connect/token/pipedream-actions"
import { ConnectAccountButton } from "@/components/workflows/connect/ConnectAccountButton"
import { toast } from "sonner"
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { FieldConfiguration, type PropConfig } from "./FieldConfiguration"
import { formatToolDataForVapi } from "@/app/api/agents/tools/toolDataFormatter"

interface ExternalAppToolCreateProps {
  clientId: string
  onAppSelected?: (app: PipedreamApp) => void
  agentId: string
  onAccountSelected?: (accountId: string) => void
  onActionSelected?: (action: PipedreamAction) => void
  onToolCreated?: (tool: any) => void
  // Edit mode props
  editMode?: boolean
  initialTool?: {
    dbId: string
    name: string
    label?: string
    description?: string
    functionSchema: any
    staticConfig?: any
    propsConfig?: Record<string, PropConfig>
    app?: string
    appName?: string
    appImgSrc?: string
    accountId?: string
    actionKey?: string
    actionName?: string
  }
  onToolUpdated?: (tool: any) => void
}

interface PipedreamApp {
  name: string
  nameSlug: string
  imgSrc?: string
  description?: string
  featuredWeight?: number
}

interface PipedreamAccount {
  id: string
  name?: string
  app_name_slug: string
  healthy: boolean
  created_at: string
}

interface PipedreamAction {
  key: string
  name: string
  description?: string
  configurableProps?: ConfigurableProp[]
}

interface ConfigurableProp {
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

export function ExternalAppToolCreate({ 
  clientId, 
  onAppSelected,
  agentId,
  onAccountSelected,
  onActionSelected,
  onToolCreated,
  editMode = false,
  initialTool,
  onToolUpdated
}: ExternalAppToolCreateProps) {
  // Existing connections state
  const [existingConnections, setExistingConnections] = useState<any[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(true)

  // App search state
  const [searchQuery, setSearchQuery] = useState("")
  const [apps, setApps] = useState<PipedreamApp[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [selectedApp, setSelectedApp] = useState<PipedreamApp | null>(null)

  // Account selection state
  const [accounts, setAccounts] = useState<PipedreamAccount[]>([])
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)
  const [selectedAccountId, setSelectedAccountId] = useState<string>("")

  // Action selection state
  const [actions, setActions] = useState<PipedreamAction[]>([])
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  const [actionSearchQuery, setActionSearchQuery] = useState("")
  const [selectedAction, setSelectedAction] = useState<PipedreamAction | null>(null)

  // Props configuration state
  const [propsConfig, setPropsConfig] = useState<Record<string, PropConfig>>({})
  const [remoteOptionsData, setRemoteOptionsData] = useState<Record<string, Array<{ label: string; value: string }>>>({})
  const [loadingRemoteOptionsFor, setLoadingRemoteOptionsFor] = useState<string | null>(null)
  const [remoteSearchQueries, setRemoteSearchQueries] = useState<Record<string, string>>({})
  
  // Tool metadata
  const [toolLabel, setToolLabel] = useState(initialTool?.label || "")
  const [toolDescription, setToolDescription] = useState(initialTool?.description || "")
  const [isAsync, setIsAsync] = useState(
    editMode && initialTool?.propsConfig 
      ? (initialTool.propsConfig as any)._isAsync || false 
      : false
  )
  const [isCreating, setIsCreating] = useState(false)

  // Search for apps
  const handleAppSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a search term")
      return
    }

    setIsSearching(true)
    setHasSearched(true)
    
    try {
      const result = await searchApps(searchQuery, clientId)
      
      if (result.success) {
        const sortedApps = (result.apps as PipedreamApp[]).sort((a, b) => {
          const weightA = a.featuredWeight ?? 0
          const weightB = b.featuredWeight ?? 0
          return weightB - weightA
        })
        setApps(sortedApps)
      } else {
        toast.error(result.error || "Failed to search apps")
        setApps([])
      }
    } catch (error) {
      toast.error("An error occurred while searching")
      setApps([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAppSearch()
    }
  }

  // Initialize edit mode data
  useEffect(() => {
    if (editMode && initialTool) {
      // Set up the app, account, and action from initial tool
      if (initialTool.app) {
        const app: PipedreamApp = {
          name: initialTool.appName || initialTool.app,
          nameSlug: initialTool.app,
          imgSrc: initialTool.appImgSrc,
        }
        setSelectedApp(app)
        
        // Load accounts and actions for the app
        loadAccountsForApp(app)
        loadActionsForApp(app)
        
        // Set the selected account
        if (initialTool.accountId) {
          setSelectedAccountId(initialTool.accountId)
        }
        
        // Set the selected action and props config
        if (initialTool.actionKey) {
          // We'll need to wait for actions to load, then set the action
          // This will be handled in a separate useEffect
        }
      }
    }
  }, [editMode, initialTool])

  // Load existing connections on mount (only in create mode)
  useEffect(() => {
    if (!editMode) {
      const loadConnections = async () => {
        setIsLoadingConnections(true)
        try {
          const result = await getExistingConnections(clientId)
          if (result.success) {
            setExistingConnections(result.accounts || [])
          }
        } catch (error) {
          console.error('Error loading connections:', error)
        } finally {
          setIsLoadingConnections(false)
        }
      }
      
      loadConnections()
    } else {
      setIsLoadingConnections(false)
    }
  }, [clientId, editMode])

  const handleAppSelect = (app: PipedreamApp) => {
    setSelectedApp(app)
    onAppSelected?.(app)
    // Reset downstream selections
    setSelectedAccountId("")
    setSelectedAction(null)
    setAccounts([])
    setActions([])
    // Load accounts and actions simultaneously
    loadAccountsForApp(app)
    loadActionsForApp(app)
  }

  const handleSelectFromExistingConnection = (account: any) => {
    if (!account.app?.nameSlug) return
    
    // Create an app object from the Pipedream account
    const app: PipedreamApp = {
      name: account.app.name || account.app.nameSlug,
      nameSlug: account.app.nameSlug,
      imgSrc: account.app.imgSrc,
    }
    setSelectedApp(app)
    onAppSelected?.(app)
    // Load accounts and actions simultaneously
    loadAccountsForApp(app)
    loadActionsForApp(app)
  }

  const loadAccountsForApp = async (app: PipedreamApp) => {
    setIsLoadingAccounts(true)
    try {
      const result = await getAppAccounts(app.nameSlug, clientId)
      
      if (result.success) {
        setAccounts(result.accounts as PipedreamAccount[])
        
        // Auto-select if only one account
        if (result.accounts.length === 1) {
          const accountId = result.accounts[0].id
          setSelectedAccountId(accountId)
          onAccountSelected?.(accountId)
        }
      } else {
        toast.error(result.error || "Failed to load accounts")
        setAccounts([])
      }
    } catch (error) {
      toast.error("An error occurred while loading accounts")
      setAccounts([])
    } finally {
      setIsLoadingAccounts(false)
    }
  }

  const handleAccountCreated = (account: any) => {
    // Reload accounts after creating a new one
    if (selectedApp) {
      loadAccountsForApp(selectedApp)
    }
    setSelectedAccountId(account.id)
    onAccountSelected?.(account.id)
    
    // Update the app field in propsConfig with the new account ID
    if (selectedAction) {
      const appField = selectedAction.configurableProps?.find(p => p.type === 'app')
      if (appField) {
        setPropsConfig(prev => ({
          ...prev,
          [appField.name]: {
            mode: 'fixed',
            value: account.id
          }
        }))
      }
    }
    // Actions are already loaded when the app was selected, no need to reload
  }

  const handleAccountChange = (accountId: string) => {
    if (accountId === "connect_new") {
      // Don't set it as the selected account, keep the dropdown closed
      // The ConnectAccountButton will handle the authentication
      return
    }
    setSelectedAccountId(accountId)
    onAccountSelected?.(accountId)
    setSelectedAction(null)
    
    // Update the app field in propsConfig with the new account ID
    if (selectedAction) {
      const appField = selectedAction.configurableProps?.find(p => p.type === 'app')
      if (appField) {
        setPropsConfig(prev => ({
          ...prev,
          [appField.name]: {
            mode: 'fixed',
            value: accountId
          }
        }))
      }
    }
    // Actions are already loaded for the app, no need to reload
  }

  const loadActionsForApp = async (app: PipedreamApp) => {
    setIsLoadingActions(true)
    try {
      const result = await getAppActions(app.nameSlug, undefined, clientId)
      
      if (result.success) {
        // Sort actions alphabetically by name
        const sortedActions = (result.actions as PipedreamAction[]).sort((a, b) => 
          a.name.localeCompare(b.name)
        )
        setActions(sortedActions)
      } else {
        toast.error(result.error || "Failed to load actions")
        setActions([])
      }
    } catch (error) {
      toast.error("An error occurred while loading actions")
      setActions([])
    } finally {
      setIsLoadingActions(false)
    }
  }

  const handleActionChange = (actionKey: string) => {
    const action = actions.find(a => a.key === actionKey)
    if (!action) return

    setSelectedAction(action)
    onActionSelected?.(action)

    // Check if we're in edit mode and have initial props config
    if (editMode && initialTool?.propsConfig) {
      // Filter out metadata fields (like _isAsync) from propsConfig
      const { _isAsync, ...fieldConfigs } = initialTool.propsConfig as any
      setPropsConfig(fieldConfigs)
      setRemoteOptionsData({})
      setLoadingRemoteOptionsFor(null)
      setRemoteSearchQueries({})
      return
    }

    // Initialize props config (create mode)
    const initialConfig: Record<string, PropConfig> = {}
    
    // ALWAYS add the app field configuration first (if it exists)
    const appField = action.configurableProps?.find(p => p.type === 'app')
    if (appField) {
      initialConfig[appField.name] = {
        mode: 'fixed',
        value: selectedAccountId // Will be set with the account ID
      }
    }
    
    const allVisibleProps = action.configurableProps?.filter(
      prop => !prop.hidden && !prop.disabled && prop.type !== 'app'
    ) || []

    // Find first required field with remoteOptions
    const firstRequiredRemoteIndex = allVisibleProps.findIndex(
      prop => !prop.optional && prop.remoteOptions
    )

    allVisibleProps.forEach((prop, index) => {
      if (!prop.hidden && !prop.disabled && prop.type !== 'app') {
        // Required fields are always initialized as 'fixed'
        if (!prop.optional) {
          initialConfig[prop.name] = {
            mode: 'fixed',
            value: prop.default
          }
        } else {
          // Optional fields before the first required+remote field are initialized as 'fixed' (shown by default)
          // Other optional fields are 'empty' (not shown)
          if (firstRequiredRemoteIndex >= 0 && index < firstRequiredRemoteIndex) {
            initialConfig[prop.name] = {
              mode: 'fixed',
              value: prop.default
            }
          } else {
            initialConfig[prop.name] = {
              mode: 'empty',
              value: prop.default
            }
          }
        }
      }
    })
    
    setPropsConfig(initialConfig)
    setRemoteOptionsData({})
    setLoadingRemoteOptionsFor(null)
    setRemoteSearchQueries({})
  }

  // Effect to set the selected action when actions are loaded in edit mode
  useEffect(() => {
    if (editMode && initialTool?.actionKey && actions.length > 0 && !selectedAction) {
      handleActionChange(initialTool.actionKey)
    }
  }, [editMode, initialTool, actions, selectedAction])

  // Effect to load remote options for fields that should be shown
  useEffect(() => {
    if (!selectedAction || loadingRemoteOptionsFor) return

    const allVisibleProps = selectedAction.configurableProps?.filter(
      prop => !prop.hidden && !prop.disabled && prop.type !== 'app'
    ) || []

    // Determine which fields should be shown based on configured values
    const fieldsToShow = getFieldsToShow(allVisibleProps)

    // Find the first field with remoteOptions that hasn't been loaded yet
    const fieldNeedingOptions = fieldsToShow.find(
      prop => prop.remoteOptions && !remoteOptionsData[prop.name]
    )

    if (fieldNeedingOptions) {
      loadRemoteOptionsForField(fieldNeedingOptions.name)
    }
  }, [selectedAction, propsConfig, remoteOptionsData, loadingRemoteOptionsFor])

  // Helper function to determine which fields should be shown
  const getFieldsToShow = (allVisibleProps: ConfigurableProp[]) => {
    // Separate fields by type
    const requiredWithRemote: ConfigurableProp[] = []
    const requiredWithoutRemote: ConfigurableProp[] = []
    const requiredWithRemoteIndices: number[] = []
    
    allVisibleProps.forEach((prop, index) => {
      if (!prop.optional) {
        if (prop.remoteOptions) {
          requiredWithRemote.push(prop)
          requiredWithRemoteIndices.push(index)
        } else {
          requiredWithoutRemote.push(prop)
        }
      }
    })

    // Check how many required fields with remoteOptions have been configured
    let lastConfiguredRemoteIndex = -1
    for (let i = 0; i < requiredWithRemote.length; i++) {
      const prop = requiredWithRemote[i]
      const config = propsConfig[prop.name]
      if (config?.mode === 'fixed' && config.value !== undefined && config.value !== '') {
        lastConfiguredRemoteIndex = i
      } else {
        // Stop at the first unconfigured required field with remoteOptions
        break
      }
    }

    // Determine cutoff index based on required fields with remoteOptions
    let cutoffIndex = -1
    const allRemoteRequiredConfigured = lastConfiguredRemoteIndex === requiredWithRemote.length - 1
    
    if (requiredWithRemote.length > 0 && !allRemoteRequiredConfigured) {
      // Show everything up to and including the next required field with remoteOptions
      const nextRemoteIndex = lastConfiguredRemoteIndex + 1
      if (nextRemoteIndex < requiredWithRemoteIndices.length) {
        cutoffIndex = requiredWithRemoteIndices[nextRemoteIndex]
      }
    }
    // If all remote required fields are configured (or there are none), cutoffIndex stays -1 (show all)

    const fieldsToShow: ConfigurableProp[] = []
    
    // If we have a cutoff, only show required fields and optional fields before the cutoff
    if (cutoffIndex >= 0) {
      for (let i = 0; i <= cutoffIndex; i++) {
        const prop = allVisibleProps[i]
        if (!prop.optional) {
          // Always include required fields up to cutoff
          fieldsToShow.push(prop)
        } else {
          // Optional fields before cutoff are shown by default (can be removed)
          fieldsToShow.push(prop)
        }
      }
    } else if (allRemoteRequiredConfigured || requiredWithRemote.length === 0) {
      // If all remote required fields are configured (or there are none), show all required fields
      allVisibleProps.forEach(prop => {
        if (!prop.optional) {
          fieldsToShow.push(prop)
        }
      })
      
      // Also include optional fields that appear before any required field with remoteOptions
      // that have been initialized (to maintain consistency with initial display)
      const firstRequiredRemoteIndex = allVisibleProps.findIndex(p => !p.optional && p.remoteOptions)
      if (firstRequiredRemoteIndex >= 0) {
        for (let i = 0; i < firstRequiredRemoteIndex; i++) {
          const prop = allVisibleProps[i]
          if (prop.optional && propsConfig[prop.name] && propsConfig[prop.name].mode !== 'empty') {
            if (!fieldsToShow.find(f => f.name === prop.name)) {
              fieldsToShow.push(prop)
            }
          }
        }
      }
    }
    
    // Always include all required fields WITHOUT remoteOptions (if not already added)
    requiredWithoutRemote.forEach(field => {
      if (!fieldsToShow.find(f => f.name === field.name)) {
        fieldsToShow.push(field)
      }
    })
    
    // Include any optional fields that are explicitly being shown (added by user)
    const explicitlyShownOptional = allVisibleProps.filter(prop => 
      prop.optional && 
      propsConfig[prop.name] && 
      propsConfig[prop.name].mode !== 'empty'
    )

    explicitlyShownOptional.forEach(field => {
      if (!fieldsToShow.find(f => f.name === field.name)) {
        fieldsToShow.push(field)
      }
    })

    // Sort to maintain original order
    return fieldsToShow.sort((a, b) => {
      const indexA = allVisibleProps.findIndex(p => p.name === a.name)
      const indexB = allVisibleProps.findIndex(p => p.name === b.name)
      return indexA - indexB
    })
  }

  const loadRemoteOptionsForField = async (propName: string, query?: string) => {
    if (!selectedAction?.key || !selectedAccountId) return

    setLoadingRemoteOptionsFor(propName)
    try {
      // Build configured props - include ALL previously configured fields
      const configuredProps: Record<string, any> = {}
      
      // First, add the app field with the account ID
      const appField = selectedAction.configurableProps?.find(p => p.type === 'app')
      if (appField) {
        configuredProps[appField.name] = {
          authProvisionId: selectedAccountId
        }
      }

      // Add ALL configured props (except the current one being loaded)
      Object.entries(propsConfig).forEach(([key, config]) => {
        if (key !== propName && config?.mode === 'fixed' && config.value !== undefined && config.value !== '') {
          // Check if this prop is an app field - if so, format with authProvisionId
          const prop = selectedAction.configurableProps?.find(p => p.name === key)
          if (prop && prop.type === 'app') {
            configuredProps[key] = {
              authProvisionId: config.value
            }
          } else {
            configuredProps[key] = config.value
          }
        }
      })

      // Get the search query for this field
      const searchQuery = query !== undefined ? query : remoteSearchQueries[propName] || ''

      console.log('Loading remote options for field:', propName, 'with configured props:', configuredProps, 'and query:', searchQuery)

      const result = await configureComponentProps(
        clientId,
        selectedAction.key,
        propName,
        configuredProps,
        searchQuery
      )

      if (result.success) {
        console.log('Remote options loaded:', result)
        
        // Extract options - handle both string arrays and label/value objects
        let options: Array<{ label: string; value: string }> = []
        
        // Check for string_options (snake_case) or stringOptions (camelCase)
        const stringOptionsArray = (result as any).string_options || result.stringOptions
        
        // Prefer stringOptions if available, then fall back to options
        if (stringOptionsArray && Array.isArray(stringOptionsArray) && stringOptionsArray.length > 0) {
          // Convert string array to label/value format (handles both string_options and stringOptions)
          options = stringOptionsArray.map((str: string) => ({
            label: str,
            value: str
          }))
        } else if (result.options && Array.isArray(result.options) && result.options.length > 0) {
          options = result.options.map((opt: any) => {
            // If it's already an object with label and value
            if (opt && typeof opt === 'object' && 'label' in opt && 'value' in opt) {
              return { label: String(opt.label), value: String(opt.value) }
            }
            // If it's a string or simple value, use it for both label and value
            const stringValue = String(opt)
            return { label: stringValue, value: stringValue }
          })
        }
        
        setRemoteOptionsData(prev => ({
          ...prev,
          [propName]: options
        }))

        // If there's only one option, automatically set it as the value
        if (options.length === 1) {
          setPropsConfig(prev => ({
            ...prev,
            [propName]: {
              ...prev[propName],
              mode: 'fixed',
              value: options[0].value
            }
          }))
        }
      } else {
        toast.error(result.error || 'Failed to load options')
      }
    } catch (error) {
      console.error('Error loading remote options:', error)
      toast.error('Failed to load options')
    } finally {
      setLoadingRemoteOptionsFor(null)
    }
  }

  const updatePropConfig = (propName: string, config: Partial<PropConfig>) => {
    const newConfig = {
      ...propsConfig[propName],
      ...config
    }
    
    setPropsConfig(prev => ({
      ...prev,
      [propName]: newConfig
    }))
    
    // The useEffect will automatically handle loading next field's remote options
  }

  const validateAndSubmit = async () => {
    // Validate tool label and description
    if (!toolLabel.trim()) {
      toast.error("Please enter a tool name")
      return
    }

    if (!toolDescription.trim()) {
      toast.error("Please enter a tool description")
      return
    }

    // Validate that all required fields are filled
    const allVisibleProps = selectedAction?.configurableProps?.filter(
      prop => !prop.hidden && !prop.disabled && prop.type !== 'app'
    ) || []

    const requiredFields = allVisibleProps.filter(p => !p.optional)
    const missingFields: string[] = []

    for (const field of requiredFields) {
      const config = propsConfig[field.name]
      const isArrayType = field.type === 'string[]' || field.type === 'integer[]'
      
      // Field is invalid if:
      // - Config doesn't exist
      // - Mode is 'empty'
      // - Mode is 'fixed' but no value (for non-arrays) or no array items (for arrays)
      // - Mode is 'ai' is always valid
      if (!config || config.mode === 'empty') {
        missingFields.push(field.label || field.name)
      } else if (config.mode === 'fixed') {
        // For array types, check if arrayItems has at least one item with a value
        if (isArrayType) {
          const hasValidItems = config.arrayItems && 
                                config.arrayItems.length > 0 && 
                                config.arrayItems.some(item => item.value && item.value !== '')
          if (!hasValidItems) {
            missingFields.push(field.label || field.name)
          }
        } else {
          // For non-array types, check the value
          if (!config.value || config.value === '') {
            missingFields.push(field.label || field.name)
          }
        }
      }
      // AI mode is valid even without aiDescription
    }

    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    setIsCreating(true)
    try {
      // Build pipedream metadata
      const pipedreamMetadata = {
        app: selectedApp?.nameSlug,
        appName: selectedApp?.name,
        appImgSrc: selectedApp?.imgSrc,
        accountId: selectedAccountId,
        actionKey: selectedAction?.key,
        actionName: selectedAction?.name
      }

      // Use the shared formatter to build function schema and static config
      const toolData = formatToolDataForVapi({
        toolName: toolLabel, // Use label for function schema temporarily
        toolDescription,
        propsConfig,
        allVisibleProps,
        isAsync,
        pipedreamMetadata
      })

      const { functionSchema, staticConfig } = toolData

      if (editMode && initialTool?.dbId) {
        // Update existing tool
        const { updateExternalAppTool } = await import('@/app/api/agents/tools/createExternalAppTool')
        const result = await updateExternalAppTool(
          initialTool.dbId,
          {
            label: toolLabel,
            description: toolDescription,
            functionSchema,
            staticConfig,
            propsConfig,
            isAsync
          },
          agentId,
          clientId
        )

        if (result.success) {
          toast.success('Tool updated successfully!')
          onToolUpdated?.(result.data)
        } else {
          toast.error('Failed to update tool')
        }
      } else {
        // Create new tool - add label to toolData
        const toolDataWithLabel = {
          ...toolData,
          label: toolLabel
        }
        const { createExternalAppTool } = await import('@/app/api/agents/tools/createExternalAppTool')
        const result = await createExternalAppTool(toolDataWithLabel, agentId, clientId)

        if (result.success) {
          toast.success('Tool created successfully!')
          onToolCreated?.(result.data)
        } else {
          toast.error('Failed to create tool')
        }
      }
    } catch (error) {
      console.error('Error creating tool:', error)
      toast.error('An error occurred while creating the tool')
    } finally {
      setIsCreating(false)
    }
  }

  // Filtered actions for the select dropdown
  const filteredActions = actions.filter(action => {
    if (!actionSearchQuery.trim()) return true
    const query = actionSearchQuery.toLowerCase()
    return (
      action.name.toLowerCase().includes(query) ||
      action.description?.toLowerCase().includes(query)
    )
  })

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* App Search - Only show when no app is selected and not in edit mode */}
        {!selectedApp && !editMode && (
          <div className="space-y-4">
            {/* Existing Connections */}
            {isLoadingConnections ? (
              <div className="space-y-3">
                <Label className="text-sm">Connected Apps</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Card key={i} className="p-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                        <div className="h-5 w-16 bg-muted rounded animate-pulse" />
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : existingConnections.length > 0 ? (
              <div className="space-y-3">
                <Label className="text-sm">Connected Apps</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {/* Group connections by app nameSlug to avoid duplicates */}
                  {Array.from(new Map(existingConnections
                    .filter(conn => conn.app?.nameSlug)
                    .map(conn => [conn.app.nameSlug, conn])
                  ).values()).map((account) => {
                    const appName = account.app.name || 'Unknown App'
                    const appSlug = account.app.nameSlug
                    const imgSrc = account.app.imgSrc
                    
                    return (
                      <Card
                        key={appSlug}
                        className="p-4 hover:bg-accent cursor-pointer transition-colors"
                        onClick={() => handleSelectFromExistingConnection(account)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {imgSrc ? (
                            <img 
                              src={imgSrc} 
                              alt={appName} 
                              className="w-12 h-12 object-contain rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-lg font-medium">
                              {appName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="text-sm font-medium text-center line-clamp-2">
                            {appName}
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Connected
                          </Badge>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <Label>Search for More Apps</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search apps (e.g., Google, Slack, GitHub)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="pl-9"
                    disabled={isSearching}
                  />
                </div>
                <Button 
                  onClick={handleAppSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Apps Grid */}
            {!isSearching && apps.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {apps.map((app) => (
                  <Card
                    key={app.nameSlug}
                    className="p-4 hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => handleAppSelect(app)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {app.imgSrc ? (
                        <img 
                          src={app.imgSrc} 
                          alt={app.name}
                          className="w-12 h-12 rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-lg font-medium">
                          {app.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="text-sm font-medium text-center line-clamp-2">
                        {app.name}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Empty States */}
            {!isSearching && hasSearched && apps.length === 0 && (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No apps found matching &quot;{searchQuery}&quot;. Try a different search term.
              </div>
            )}
          </div>
        )}

        {/* Compact App, Account, and Action Selection */}
        {selectedApp && (
          <Card className="p-4">
            <div className="space-y-4">
              {/* App Row */}
              <div className="flex items-center justify-between pb-3 border-b">
                <div className="flex items-center gap-3">
                  {selectedApp.imgSrc && (
                    <img 
                      src={selectedApp.imgSrc} 
                      alt={selectedApp.name}
                      className="w-8 h-8 rounded"
                    />
                  )}
                  <div>
                    <div className="text-sm font-medium">{selectedApp.name}</div>
                    <div className="text-xs text-muted-foreground">Connected</div>
                  </div>
                </div>
                {!editMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedApp(null)
                      setSelectedAccountId("")
                      setSelectedAction(null)
                      setAccounts([])
                      setActions([])
                    }}
                    className="h-8"
                  >
                    Change App
                  </Button>
                )}
              </div>

              {/* Account and Action Selection */}
              <div className="flex items-end justify-between gap-4">
                {/* Account Selection */}
                <div className="space-y-2 min-w-[300px]">
                  <Label className="text-sm">Account</Label>
                  {isLoadingAccounts ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : accounts.length > 0 ? (
                    <div className="flex gap-2">
                      <Select
                        value={selectedAccountId}
                        onValueChange={handleAccountChange}
                        disabled={editMode}
                      >
                        <SelectTrigger className="h-9 w-[240px]">
                          <SelectValue placeholder="Choose account" className="truncate" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              <div className="flex items-center gap-2 max-w-[300px]">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${account.healthy ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="truncate">
                                  {account.name || `${selectedApp.name} Account`}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!editMode && (
                        <ConnectAccountButton
                          app={selectedApp.nameSlug}
                          clientId={clientId}
                          onSuccess={handleAccountCreated}
                          className="h-9 px-3"
                        >
                          <Plus className="h-4 w-4" />
                        </ConnectAccountButton>
                      )}
                    </div>
                  ) : (
                    <ConnectAccountButton
                      app={selectedApp.nameSlug}
                      clientId={clientId}
                      onSuccess={handleAccountCreated}
                      className="h-9 w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Account
                    </ConnectAccountButton>
                  )}
                </div>

                {/* Action Selection */}
                {selectedAccountId && selectedAccountId !== "connect_new" && (
                  <div className="space-y-2 min-w-[300px]">
                    <Label className="text-sm">Action</Label>
                    {isLoadingActions ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : actions.length > 0 ? (
                      <Select
                        value={selectedAction?.key || ""}
                        onValueChange={handleActionChange}
                        disabled={editMode}
                      >
                        <SelectTrigger className="h-9 w-[300px]">
                          <SelectValue placeholder={`Choose action (${actions.length} available)`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px] overflow-hidden">
                          {/* Search input - fixed at top */}
                          <div className="bg-popover border-b px-2 py-2 sticky top-0 z-50">
                            <div className="relative">
                              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                              <Input
                                placeholder="Search actions..."
                                value={actionSearchQuery}
                                onChange={(e) => setActionSearchQuery(e.target.value)}
                                className="pl-8 h-8 border-input"
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                              />
                            </div>
                          </div>
                          
                          {/* Actions list - scrollable */}
                          <div className="overflow-y-auto max-h-[340px] p-1">
                            {filteredActions.length > 0 ? (
                              filteredActions.map((action) => (
                                <div key={action.key} className="flex items-center">
                                  <SelectItem value={action.key} className="flex-1">
                                    {action.name}
                                  </SelectItem>
                                  {action.description && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={(e) => e.stopPropagation()}
                                          className="px-2 text-muted-foreground hover:text-foreground"
                                        >
                                          <HelpCircle className="h-4 w-4" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="left" className="max-w-xs">
                                        <p className="text-sm">{action.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="px-2 py-6 text-center text-xs text-muted-foreground">
                                No actions found matching &quot;{actionSearchQuery}&quot;
                              </div>
                            )}
                          </div>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-center py-4 text-xs text-muted-foreground">
                        No actions available
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Tool Name and Description */}
              {selectedAction && (
                <div className="pt-4 border-t space-y-4">
                  <div>
                    <Label className="text-base">Tool Information</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      Give your tool a name and description for the AI agent
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="toolLabel" className="text-sm">Tool Name *</Label>
                      <Input
                        id="toolLabel"
                        placeholder="e.g., Create Google Sheet Row"
                        value={toolLabel}
                        onChange={(e) => setToolLabel(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="toolDescription" className="text-sm">Tool Description *</Label>
                      <Input
                        id="toolDescription"
                        placeholder="Describe when and how the agent should use this tool..."
                        value={toolDescription}
                        onChange={(e) => setToolDescription(e.target.value)}
                        className="mt-1.5"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Explain to the agent when and how to use this tool
                      </p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="isAsync" className="text-sm font-medium">
                          Don't Wait for Response
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          The agent will continue the conversation immediately without waiting for this tool to finish
                        </p>
                      </div>
                      <Switch
                        id="isAsync"
                        checked={isAsync}
                        onCheckedChange={setIsAsync}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Display configurable fields when action is selected */}
              {selectedAction && selectedAction.configurableProps && selectedAction.configurableProps.length > 0 && (() => {
                // Get all visible props (not hidden, disabled, or app type)
                const allVisibleProps = selectedAction.configurableProps.filter(
                  prop => !prop.hidden && !prop.disabled && prop.type !== 'app'
                )

                // Determine which fields to show based on configuration state
                const fieldsToShow = getFieldsToShow(allVisibleProps)
                
                // Get optional fields that aren't currently shown
                const shownFieldNames = new Set(fieldsToShow.map(f => f.name))
                const hiddenOptionalFields = allVisibleProps.filter(
                  prop => prop.optional && !shownFieldNames.has(prop.name)
                )

                // Check if there are more required fields to unlock
                const requiredFields = allVisibleProps.filter(p => !p.optional)
                const hasMoreRequiredFields = fieldsToShow.length < allVisibleProps.length - hiddenOptionalFields.length

                return (
                  <div className="pt-4 border-t space-y-4">
                    <div>
                      <Label className="text-base">Configure Fields</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Configure the fields for this action. Required fields will unlock as you progress.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {fieldsToShow.map((prop) => (
                        <FieldConfiguration
                          key={prop.name}
                          prop={prop}
                          config={propsConfig[prop.name] || { mode: prop.optional ? 'empty' : 'fixed' }}
                          onConfigChange={(config) => updatePropConfig(prop.name, config)}
                          onRemove={prop.optional ? () => {
                            setPropsConfig(prev => {
                              const newConfig = { ...prev }
                              delete newConfig[prop.name]
                              return newConfig
                            })
                          } : undefined}
                          remoteOptions={remoteOptionsData[prop.name]}
                          isLoadingRemoteOptions={loadingRemoteOptionsFor === prop.name}
                          onRemoteSearch={prop.remoteOptions ? (query: string) => {
                            setRemoteSearchQueries(prev => ({
                              ...prev,
                              [prop.name]: query
                            }))
                            // Reload options with the new query
                            loadRemoteOptionsForField(prop.name, query)
                          } : undefined}
                        />
                      ))}
                    </div>

                    {/* Add optional field selector */}
                    {hiddenOptionalFields.length > 0 && (
                      <div className="pt-2">
                        <Select
                          value=""
                          onValueChange={(propName) => {
                            const prop = hiddenOptionalFields.find(p => p.name === propName)
                            if (prop) {
                              setPropsConfig(prev => ({
                                ...prev,
                                [propName]: { mode: 'fixed', value: prop.default }
                              }))
                            }
                          }}
                        >
                          <SelectTrigger>
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <SelectValue placeholder="Add optional field..." />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {hiddenOptionalFields.map((prop) => (
                              <SelectItem key={prop.name} value={prop.name}>
                                <div className="flex items-center gap-2">
                                  <span>{prop.label || prop.name}</span>
                                  {prop.description && (
                                    <span className="text-xs text-muted-foreground">- {prop.description}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {hasMoreRequiredFields && (
                      <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                        <Info className="h-4 w-4 inline mr-2" />
                        Configure the required fields above to unlock more.
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Create Tool Button */}
              {selectedAction && (
                <div className="pt-4 border-t flex justify-end">
                  <Button
                    onClick={validateAndSubmit}
                    disabled={isCreating}
                    size="lg"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Creating Tool...
                      </>
                    ) : editMode ? (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Update Tool
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Create Tool
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </TooltipProvider>
  )
}
