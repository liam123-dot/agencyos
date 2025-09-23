'use client'

import { useForm } from "react-hook-form"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../../ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Input } from "../../ui/input"
import { toast } from "sonner"
import { createClient } from "@/app/api/clients/createClient"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

const createClientSchema = z.object({
    name: z.string().min(1, { message: "Client name is required" })
})

type CreateClientFormValues = z.infer<typeof createClientSchema>

export function CreateClient() {
    const [open, setOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const router = useRouter()

    const form = useForm<CreateClientFormValues>({
        resolver: zodResolver(createClientSchema),
        defaultValues: {
            name: ""
        },
    })

    const onSubmit = async (data: CreateClientFormValues) => {
        setIsSubmitting(true)
        try {
            await createClient({ name: data.name })
            toast.success("Client created successfully")
            router.refresh()
            setOpen(false)
            form.reset()
        } catch (error) {
            toast.error("Failed to create client. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>Create Client</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Client</DialogTitle>
                    <DialogDescription>
                        Fill in the details below to add a new client to your organization.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Acme Inc." {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Client
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
