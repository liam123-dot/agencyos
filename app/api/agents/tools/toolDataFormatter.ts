/**
 * Shared utility for formatting external app tool data for Vapi
 */

export interface PropConfig {
  mode: 'fixed' | 'ai' | 'empty'
  value?: any
  aiDescription?: string
  arrayItems?: Array<{ value: string; isAi?: boolean }>
  aiCanAddMore?: boolean
  aiAddMorePrompt?: string
  forceRequired?: boolean
}

export interface ConfigurableProp {
  name: string
  type: string
  label?: string
  description?: string
  optional?: boolean
  hidden?: boolean
  disabled?: boolean
  remoteOptions?: boolean
  default?: any
}

interface FormatToolDataParams {
  toolName: string
  toolDescription: string
  propsConfig: Record<string, PropConfig>
  allVisibleProps: ConfigurableProp[]
  isAsync?: boolean
  pipedreamMetadata: {
    app?: string
    appName?: string
    appImgSrc?: string
    accountId?: string
    actionKey?: string
    actionName?: string
  }
}

interface FormattedToolData {
  functionSchema: {
    name: string
    description: string
    parameters: {
      type: 'object'
      properties: Record<string, any>
      required: string[]
    }
  }
  staticConfig: Record<string, any>
  propsConfig: Record<string, PropConfig>
  isAsync?: boolean
  pipedreamMetadata: {
    app?: string
    appName?: string
    appImgSrc?: string
    accountId?: string
    actionKey?: string
    actionName?: string
  }
}

/**
 * Helper function to map Pipedream types to JSON Schema types
 */
function mapTypeToJsonSchema(pipedreamType: string): any {
  switch (pipedreamType) {
    case 'string':
      return { type: 'string' }
    case 'integer':
    case 'number':
      return { type: 'number' }
    case 'boolean':
      return { type: 'boolean' }
    case 'string[]':
      return { type: 'array', items: { type: 'string' } }
    case 'integer[]':
      return { type: 'array', items: { type: 'number' } }
    case 'object':
      return { type: 'object' }
    default:
      return { type: 'string' }
  }
}

/**
 * Formats tool data from our internal storage format to Vapi's expected format
 */
export function formatToolDataForVapi(params: FormatToolDataParams): FormattedToolData {
  const { toolName, toolDescription, propsConfig, allVisibleProps, isAsync = false, pipedreamMetadata } = params

  const functionSchemaProperties: Record<string, any> = {}
  const functionSchemaRequired: string[] = []
  const staticConfig: Record<string, any> = {}

  Object.entries(propsConfig).forEach(([propName, config]) => {
    const prop = allVisibleProps.find(p => p.name === propName)
    
    // Skip if prop not found in allVisibleProps
    // Note: App fields (type='app') are stored in propsConfig but NOT in allVisibleProps
    // They are filtered out because they're not user-configurable fields
    if (!prop) return

    const isArrayType = prop.type === 'string[]' || prop.type === 'integer[]'
    const isRequired = !prop.optional

    // Skip empty fields
    if (config.mode === 'empty') return

    if (config.mode === 'ai') {
      // AI mode: always goes to function schema
      const schemaType = mapTypeToJsonSchema(prop.type)
      functionSchemaProperties[propName] = {
        ...schemaType,
        description: config.aiDescription || prop.description || prop.label || propName
      }

      // Add to required if field is required OR if forceRequired is enabled
      if (isRequired || config.forceRequired) {
        functionSchemaRequired.push(propName)
      }
    } else if (config.mode === 'fixed') {
      // Fixed mode: check aiCanAddMore
      if (config.aiCanAddMore) {
        console.log(`🔧 Processing field "${propName}" in fixed mode with aiCanAddMore enabled`)
        console.log(`   - forceRequired: ${config.forceRequired || false}`)
        console.log(`   - isRequired: ${isRequired}`)
        
        // Goes to function schema with base values
        const schemaType = mapTypeToJsonSchema(prop.type)
        let description = config.aiAddMorePrompt || prop.description || prop.label || propName

        // Add base values info to description if they exist
        if (isArrayType && config.arrayItems && config.arrayItems.length > 0) {
          const baseValues = config.arrayItems
            .filter(item => item.value && item.value !== '' && !item.isAi)
            .map(item => item.value)
          if (baseValues.length > 0) {
            description = `${description}. Base values: [${baseValues.join(', ')}]`
          }
        } else if (config.value !== undefined && config.value !== '') {
          description = `${description}. Base value: ${config.value}`
        }

        functionSchemaProperties[propName] = {
          ...schemaType,
          description
        }

        // Add to required if forceRequired is enabled
        // (regardless of whether there are base values or if field is naturally required)
        if (config.forceRequired) {
          console.log(`📌 Field "${propName}" marked as REQUIRED due to forceRequired flag`)
          functionSchemaRequired.push(propName)
        } else if (isRequired) {
          // Only add to required if field is naturally required AND has no base values
          if (isArrayType) {
            const hasBaseValues = config.arrayItems && config.arrayItems.length > 0 && 
                                 config.arrayItems.some(item => item.value && item.value !== '')
            if (!hasBaseValues) {
              functionSchemaRequired.push(propName)
            }
          } else {
            if (!config.value || config.value === '') {
              functionSchemaRequired.push(propName)
            }
          }
        }
      } else {
        // Goes to static config (not shown to AI)
        if (isArrayType && config.arrayItems && config.arrayItems.length > 0) {
          const arrayValues = config.arrayItems
            .filter(item => item.value && item.value !== '')
            .map(item => item.value)
          if (arrayValues.length > 0) {
            staticConfig[propName] = arrayValues
          }
        } else if (config.value !== undefined && config.value !== '') {
          staticConfig[propName] = config.value
        }
      }
    }
  })

  // Build the function schema in JSON Schema format
  const functionSchema = {
    name: toolName.replace(/\s+/g, '_').toLowerCase(),
    description: toolDescription,
    parameters: {
      type: 'object' as const,
      properties: functionSchemaProperties,
      required: functionSchemaRequired
    }
  }

  console.log(`\n✅ Final required fields array: [${functionSchemaRequired.join(', ')}]\n`)

  return {
    functionSchema,
    staticConfig,
    propsConfig,
    isAsync,
    pipedreamMetadata
  }
}

/**
 * Builds the Vapi tool configuration object for CREATING a new tool
 */
export function buildVapiToolConfigForCreate(
  toolName: string,
  functionSchema: FormattedToolData['functionSchema'],
  toolUrl: string,
  isAsync: boolean = false
) {
  const vapiToolName = `custom_tool_${functionSchema.name.replace(/[^a-zA-Z0-9_]/g, '_')}`

  return {
    vapiToolName,
    config: {
      type: 'function' as const,
      async: isAsync,
      function: {
        name: vapiToolName,
        description: functionSchema.description,
        parameters: functionSchema.parameters
      },
      server: {
        url: toolUrl,
        timeoutSeconds: 30
      }
    }
  }
}

/**
 * Builds the Vapi tool configuration object for UPDATING an existing tool
 * Note: Update format does NOT include the 'type' field
 */
export function buildVapiToolConfigForUpdate(
  toolName: string,
  functionSchema: FormattedToolData['functionSchema'],
  toolUrl: string,
  isAsync: boolean = false
) {
  const vapiToolName = `custom_tool_${functionSchema.name.replace(/[^a-zA-Z0-9_]/g, '_')}`

  return {
    vapiToolName,
    config: {
      async: isAsync,
      function: {
        name: vapiToolName,
        description: functionSchema.description,
        parameters: functionSchema.parameters
      },
      server: {
        url: toolUrl,
        timeoutSeconds: 30
      }
    }
  }
}
