'use client'

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { VapiTool } from "@/app/api/agents/tools/ToolTypes"

export type ViewMode = 'list' | 'create' | 'edit'
export type ToolType = 'transferCall' | 'apiRequest' | 'sms' | 'externalApp'

interface UseToolsNavigationProps {
    tools: VapiTool[]
}

export function useToolsNavigation({ tools }: UseToolsNavigationProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const pathname = usePathname()
    
    const [selectedTool, setSelectedTool] = useState<VapiTool | null>(null)
    const [viewMode, setViewMode] = useState<ViewMode>('list')
    const [selectedToolType, setSelectedToolType] = useState<ToolType>('transferCall')

    const updateURL = useCallback((params: Record<string, string | null>, shouldPush = false) => {
        const current = new URLSearchParams(searchParams.toString())
        
        Object.entries(params).forEach(([key, value]) => {
            if (value === null) {
                current.delete(key)
            } else {
                current.set(key, value)
            }
        })

        const search = current.toString()
        const query = search ? `?${search}` : ''
        const fullPath = `${pathname}${query}`
        
        // Use replace by default for faster updates, push only when explicitly needed
        if (shouldPush) {
            router.push(fullPath, { scroll: false })
        } else {
            router.replace(fullPath, { scroll: false })
        }
    }, [searchParams, pathname, router])

    // Initialize and sync state from URL parameters
    useEffect(() => {
        const toolId = searchParams.get('tool')
        const view = searchParams.get('view') as ViewMode
        const toolType = searchParams.get('type') as ToolType

        // Only update if the URL state doesn't match current state
        if (toolId && view === 'edit') {
            const tool = tools.find(t => t.id === toolId)
            if (tool && selectedTool?.id !== tool.id) {
                setSelectedTool(tool)
                setViewMode('edit')
            } else if (!tool && viewMode !== 'list') {
                // Tool not found, go back to list
                setViewMode('list')
                setSelectedTool(null)
            }
        } else if (view === 'create' && viewMode !== 'create') {
            setViewMode('create')
            setSelectedTool(null)
            if (toolType && ['transferCall', 'apiRequest', 'sms', 'externalApp'].includes(toolType)) {
                setSelectedToolType(toolType)
            }
        } else if (!view && viewMode !== 'list') {
            // No view specified or invalid, show list
            setViewMode('list')
            setSelectedTool(null)
        }
    }, [searchParams, tools]) // Reduced dependency array

    const navigateToCreate = useCallback((toolType?: ToolType) => {
        const type = toolType || selectedToolType
        // Update state immediately for responsive UI
        setViewMode('create')
        setSelectedTool(null)
        setSelectedToolType(type)
        // Update URL asynchronously
        requestAnimationFrame(() => updateURL({ view: 'create', type, tool: null }, true))
    }, [selectedToolType, updateURL])

    const navigateToEdit = useCallback((tool: VapiTool) => {
        // Update state immediately for responsive UI
        setSelectedTool(tool)
        setViewMode('edit')
        // Update URL asynchronously
        requestAnimationFrame(() => updateURL({ view: 'edit', tool: tool.id, type: null }, true))
    }, [updateURL])

    const navigateToList = useCallback(() => {
        // Update state immediately for responsive UI
        setViewMode('list')
        setSelectedTool(null)
        // Update URL asynchronously
        requestAnimationFrame(() => updateURL({ view: null, tool: null, type: null }))
    }, [updateURL])

    const updateToolType = useCallback((toolType: ToolType) => {
        setSelectedToolType(toolType)
        if (viewMode === 'create') {
            requestAnimationFrame(() => updateURL({ type: toolType }))
        }
    }, [viewMode, updateURL])

    const navigateToEditAfterCreate = useCallback((tool: VapiTool) => {
        // Update state immediately for responsive UI
        setSelectedTool(tool)
        setViewMode('edit')
        // Update URL asynchronously
        requestAnimationFrame(() => updateURL({ view: 'edit', tool: tool.id, type: null }, true))
    }, [updateURL])

    return useMemo(() => ({
        selectedTool,
        viewMode,
        selectedToolType,
        navigateToCreate,
        navigateToEdit,
        navigateToList,
        updateToolType,
        navigateToEditAfterCreate
    }), [
        selectedTool,
        viewMode,
        selectedToolType,
        navigateToCreate,
        navigateToEdit,
        navigateToList,
        updateToolType,
        navigateToEditAfterCreate
    ])
}
