'use client'

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ConnectAccountSelector } from "./ConnectAccountSelector"

interface ConnectAccountDialogClientProps {
  clientId: string
  onSuccess?: (account: any, app: string) => void
  triggerButton?: React.ReactNode
}

export function ConnectAccountDialogClient({
  clientId,
  onSuccess,
  triggerButton
}: ConnectAccountDialogClientProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = (account: any, app: string) => {
    setOpen(false)
    onSuccess?.(account, app)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            Connect App
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Connect an App</DialogTitle>
          <DialogDescription>
            Choose an app to connect to your account. You can connect to over 2,800+ apps.
          </DialogDescription>
        </DialogHeader>
        <ConnectAccountSelector
          clientId={clientId}
          onSuccess={handleSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}

