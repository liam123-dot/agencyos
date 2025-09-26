// Database type for agent_routing_rules table
export interface RoutingRule {
    id: string
    agent_id: string
    client_id: string | null
    organization_id: string
    name: string
    enabled: boolean
    start_time: string // TIME format (HH:MM:SS)
    end_time: string   // TIME format (HH:MM:SS)
    days: string[]     // Array of day abbreviations: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    route_to: string   // Phone number to route to
    created_at: string
    updated_at: string
}

// DTO for creating/updating routing rules
export interface RoutingRuleDTO {
    agent_id: string
    client_id?: string | null
    organization_id: string
    name: string
    enabled: boolean
    start_time: string // HH:MM format
    end_time: string   // HH:MM format
    days: string[]
    route_to: string
}

// Client-side type with simplified time format
export interface ClientRoutingRule {
    id: string
    name: string
    enabled: boolean
    priority: number
    timeRange: {
        start: string // HH:MM format
        end: string   // HH:MM format
    }
    days: string[]
    routeTo: string
}

// Response types
export interface RoutingRulesResponse {
    success: boolean
    data?: RoutingRule[]
    error?: string
}

export interface RoutingRuleResponse {
    success: boolean
    data?: RoutingRule
    error?: string
}
