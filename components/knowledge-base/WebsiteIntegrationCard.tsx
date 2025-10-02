'use client'

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { AddLink } from "./AddLink"

interface WebsiteIntegrationCardProps {
    knowledgeBaseId: string
    onSuccess?: () => void
}

// Website Icon
const WebsiteIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22" 
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M12 2C9.49872 4.73835 8.07725 8.29203 8 12C8.07725 15.708 9.49872 19.2616 12 22" 
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2 12H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2.5 9H21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M2.5 15H21.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
)

export function WebsiteIntegrationCard({ knowledgeBaseId, onSuccess }: WebsiteIntegrationCardProps) {
    const [dialogOpen, setDialogOpen] = useState(false)

    const handleSuccess = () => {
        setDialogOpen(false)
        if (onSuccess) {
            onSuccess()
        }
    }

    return (
        <>
            <Card className="hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-lg bg-muted/50 shrink-0">
                            <WebsiteIcon />
                        </div>
                        <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg">
                                Websites
                            </CardTitle>
                            <CardDescription className="mt-1.5">
                                Add URLs to scrape and import website content
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>

                <CardContent>
                    <Button
                        onClick={() => setDialogOpen(true)}
                        className="w-full"
                    >
                        Add Websites
                    </Button>
                </CardContent>
            </Card>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Add Websites</DialogTitle>
                        <DialogDescription>
                            Enter URLs to scrape and add to your knowledge base. You can add multiple URLs at once.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        <AddLink onSuccess={handleSuccess} knowledgeBaseId={knowledgeBaseId} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}

