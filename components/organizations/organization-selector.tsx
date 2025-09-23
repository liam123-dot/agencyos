'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useOrganizationSwitcher } from '@/lib/contexts/organization-context';
import { OrganizationSelectorProps } from '@/lib/types/organizations';
import { getRoleDisplayName, getRoleColor } from '@/lib/utils/organizations';

export function OrganizationSelector({
  value,
  onChange,
  className,
  placeholder = "Select organization...",
  disabled = false,
}: OrganizationSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const { organizations, switchOrganization, isLoading } = useOrganizationSwitcher();

  const selectedOrganization = organizations.find((org) => org.id === value);

  const handleSelect = async (organizationId: string) => {
    if (organizationId === value) return;
    
    try {
      await switchOrganization(organizationId);
      onChange(organizationId);
      setOpen(false);
    } catch (error) {
      console.error('Failed to switch organization:', error);
    }
  };

  const handleCreateNew = () => {
    setOpen(false);
    // This would typically open a create organization modal
    // For now, we'll just trigger the onChange with a special value
    onChange('__create_new__');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            className
          )}
          disabled={disabled || isLoading}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedOrganization ? (
              <>
                <span className="truncate">{selectedOrganization.name}</span>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs px-1.5 py-0.5",
                    getRoleColor(selectedOrganization.user_role)
                  )}
                >
                  {getRoleDisplayName(selectedOrganization.user_role)}
                </Badge>
              </>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            {organizations.length > 0 && (
              <CommandGroup heading="Your Organizations">
                {organizations.map((org) => (
                  <CommandItem
                    key={org.id}
                    value={org.id}
                    onSelect={() => handleSelect(org.id)}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Check
                        className={cn(
                          "h-4 w-4",
                          value === org.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{org.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {org.member_count} member{org.member_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs px-1.5 py-0.5 shrink-0",
                        getRoleColor(org.user_role)
                      )}
                    >
                      {getRoleDisplayName(org.user_role)}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            <CommandSeparator />
            <CommandGroup>
              <CommandItem onSelect={handleCreateNew} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                <span>Create new organization</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
