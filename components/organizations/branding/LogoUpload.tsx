"use client"

import { uploadLogo, removeLogo } from "@/app/api/organizations/branding"
import { Button } from "@/components/ui/button"
import { useState, useRef } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, Trash2, Image as ImageIcon } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

interface LogoUploadProps {
  organizationName: string
  currentLogoUrl?: string | null
}

export default function LogoUpload({ organizationName, currentLogoUrl }: LogoUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    
    const formData = new FormData()
    formData.append('logo', file)

    try {
      const result = await uploadLogo(formData)
      
      if (result.success && result.logoUrl) {
        setLogoUrl(result.logoUrl)
        toast.success("Logo uploaded successfully!")
      } else {
        toast.error(result.error || "Failed to upload logo")
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("Failed to upload logo")
    }
    
    setIsUploading(false)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveLogo = async () => {
    setIsRemoving(true)
    
    try {
      const result = await removeLogo()
      
      if (result.success) {
        setLogoUrl(null)
        toast.success("Logo removed successfully!")
      } else {
        toast.error(result.error || "Failed to remove logo")
      }
    } catch (error) {
      console.error('Remove error:', error)
      toast.error("Failed to remove logo")
    }
    
    setIsRemoving(false)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Organization Logo
        </CardTitle>
        <CardDescription>
          Upload a logo for {organizationName}. This will be displayed across your organization's interface.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {logoUrl ? (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50">
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <Image
                    src={logoUrl}
                    alt={`${organizationName} logo`}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
                <p className="text-sm text-gray-600">Current logo</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={triggerFileInput} 
                disabled={isUploading}
                variant="outline"
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Replace Logo
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleRemoveLogo} 
                disabled={isRemoving}
                variant="destructive"
              >
                {isRemoving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div 
              className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
              onClick={triggerFileInput}
            >
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">Upload a logo</p>
                <p className="text-sm text-gray-600 mb-4">
                  Drag and drop or click to select an image file
                </p>
                <Button disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Select File
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <Alert>
              <AlertDescription>
                Supported formats: PNG, JPG, GIF, SVG. Maximum file size: 5MB.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  )
}
