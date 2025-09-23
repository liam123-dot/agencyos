'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { removePhoneNumber } from "@/app/api/phone-numbers/removePhoneNumber"

interface RemovePhoneNumberButtonProps {
    phoneNumberId: string;
    phoneNumber: string;
    onRemoveSuccess?: () => void;
}

export function RemovePhoneNumberButton({ 
    phoneNumberId, 
    phoneNumber, 
    onRemoveSuccess 
}: RemovePhoneNumberButtonProps) {
    const [isRemoving, setIsRemoving] = useState(false)
    const [isOpen, setIsOpen] = useState(false)

    const handleRemove = async () => {
        setIsRemoving(true)

        try {
            const result = await removePhoneNumber(phoneNumberId)

            if (result.success) {
                toast.success(`Successfully removed ${phoneNumber}`)
                onRemoveSuccess?.()
                // Only close dialog on success
                setIsOpen(false)
            } else {
                toast.error(result.error || "Failed to remove phone number")
                // Keep dialog open on error so user can retry
            }
        } catch (err) {
            toast.error("An unexpected error occurred")
            // Keep dialog open on error so user can retry
        } finally {
            setIsRemoving(false)
        }
    }

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => {
            // Prevent closing dialog while removing
            if (!isRemoving) {
                setIsOpen(open)
            }
        }}>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={isRemoving}
                >
                    {isRemoving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                        {isRemoving ? "Removing Phone Number..." : "Are you sure?"}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {isRemoving ? (
                            <>
                                Please wait while we remove <strong>{phoneNumber}</strong> from your account...
                            </>
                        ) : (
                            <>
                                This will permanently remove the phone number <strong>{phoneNumber}</strong> from your account. 
                                This action cannot be undone.
                            </>
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isRemoving}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleRemove}
                        disabled={isRemoving}
                        className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRemoving ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Removing phone number...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove Phone Number
                            </>
                        )}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
