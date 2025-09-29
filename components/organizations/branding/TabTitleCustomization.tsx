"use client"

import { updateTabTitle } from "@/app/api/organizations/branding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Type, Save } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"

interface TabTitleCustomizationProps {
  organizationName: string
  currentTabTitle?: string | null
}

export default function TabTitleCustomization({ organizationName, currentTabTitle }: TabTitleCustomizationProps) {
  const [tabTitle, setTabTitle] = useState(currentTabTitle || '')
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleInputChange = (value: string) => {
    setTabTitle(value)
    setHasChanges(value !== (currentTabTitle || ''))
  }

  const handleUpdateTabTitle = async () => {
    if (!tabTitle.trim()) {
      toast.error("Please enter a tab title")
      return
    }

    setIsUpdating(true)
    
    try {
      const result = await updateTabTitle(tabTitle.trim())
      
      if (result.success) {
        toast.success("Tab title updated successfully!")
        setHasChanges(false)
      } else {
        toast.error(result.error || "Failed to update tab title")
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error("Failed to update tab title")
    }
    
    setIsUpdating(false)
  }

  const handleReset = () => {
    setTabTitle(currentTabTitle || '')
    setHasChanges(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5" />
          Tab Title Customization
        </CardTitle>
        <CardDescription>
          Customize the browser tab title for {organizationName}. This will appear in browser tabs and bookmarks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tab-title">Tab Title</Label>
          <Input
            id="tab-title"
            type="text"
            placeholder={`${organizationName} - Enter custom tab title`}
            value={tabTitle}
            onChange={(e) => handleInputChange(e.target.value)}
            maxLength={60}
            disabled={isUpdating}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>This will appear in browser tabs</span>
            <span>{tabTitle.length}/60</span>
          </div>
        </div>

        {tabTitle && (
          <Alert>
            <AlertDescription>
              <strong>Preview:</strong> Browser tab will show "{tabTitle}"
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleUpdateTabTitle} 
            disabled={isUpdating || !hasChanges || !tabTitle.trim()}
            className="flex-1"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Tab Title
              </>
            )}
          </Button>
          
          {hasChanges && (
            <Button 
              onClick={handleReset} 
              disabled={isUpdating}
              variant="outline"
            >
              Reset
            </Button>
          )}
        </div>

        {!tabTitle && currentTabTitle && (
          <Alert>
            <AlertDescription>
              Currently using default title. Enter a custom title above to override it.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
