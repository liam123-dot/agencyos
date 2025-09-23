'use client'

import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "../../ui/dialog"
import { DialogHeader } from "../../ui/dialog"
import { Button } from "../../ui/button"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { useState } from "react"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { inviteClientMember } from "@/app/api/clients/clientMembers"

interface AddMemberFormData {
    name: string
    email: string
}

export default function AddNewMember({ clientId }: { clientId: string }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isCreating, setIsCreating] = useState(false)
    const [formData, setFormData] = useState<AddMemberFormData>({
        name: '',
        email: ''
    })

    const handleInputChange = (field: keyof AddMemberFormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!formData.name.trim()) {
            toast.error("Member name is required")
            return
        }

        if (!formData.email.trim()) {
            toast.error("Member email is required")
            return
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            toast.error("Please enter a valid email address")
            return
        }

        setIsCreating(true)
        try {
            // TODO: Implement server action to add member
            // For now, just simulate success
            await inviteClientMember(clientId, formData.email)
            
            toast.success("Member will be added successfully!")
            setIsOpen(false)
            // Reset form
            setFormData({
                name: '',
                email: ''
            })
        } catch (error) {
            console.error('Error adding member:', error)
            toast.error("Failed to add member. Please try again.")
        } finally {
            setIsCreating(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>Add New Member</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
                <DialogHeader className="pb-6">
                    <DialogTitle className="text-xl font-semibold">Add New Member</DialogTitle>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                disabled={isCreating}
                                required
                                className="h-10"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="e.g. john@example.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                disabled={isCreating}
                                required
                                className="h-10"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => setIsOpen(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || !formData.name.trim() || !formData.email.trim()}>
                            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Member
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}