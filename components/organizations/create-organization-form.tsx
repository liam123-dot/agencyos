'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CreateOrganizationFormProps, Organization } from '@/lib/types/organizations';
import { useCreateOrganization } from '@/lib/hooks/use-organizations';

const formSchema = z.object({
  name: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateOrganizationDialogProps extends CreateOrganizationFormProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateOrganizationForm({
  onSuccess,
  onCancel,
  className,
}: CreateOrganizationFormProps) {
  const { createOrganization, isLoading, error } = useCreateOrganization();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      console.log('Creating organization:', values);
      const organization = await createOrganization({
        name: values.name,
      });
      
      form.reset();
      onSuccess(organization);
    } catch (err) {
      // Error is handled by the hook
      console.error('Failed to create organization:', err);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Acme Inc." 
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormDescription>
                  The display name for your organization.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />



          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
            {/* <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button> */}
          </div>
        </form>
      </Form>
    </div>
  );
}

export function CreateOrganizationDialog({
  trigger,
  open,
  onOpenChange,
  onSuccess,
  onCancel,
  className,
}: CreateOrganizationDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const handleSuccess = (organization: Organization) => {
    setIsOpen(false);
    onSuccess(organization);
  };

  const handleCancel = () => {
    setIsOpen(false);
    onCancel?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Set up a new organization to collaborate with your team.
          </DialogDescription>
        </DialogHeader>
        <CreateOrganizationForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          className={className}
        />
      </DialogContent>
    </Dialog>
  );
}
