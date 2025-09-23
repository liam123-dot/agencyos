'use client'

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CallsLimitSelectorProps {
    currentLimit: number;
}

export function CallsLimitSelector({ currentLimit }: CallsLimitSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleLimitChange = (newLimit: string) => {
        const params = new URLSearchParams(searchParams);
        
        // Reset to page 1 when changing limit
        params.delete('page');
        
        if (newLimit === '10') {
            params.delete('limit');
        } else {
            params.set('limit', newLimit);
        }
        
        const queryString = params.toString();
        const newUrl = queryString ? `?${queryString}` : window.location.pathname;
        router.replace(newUrl);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Show:</span>
            <Select value={currentLimit.toString()} onValueChange={handleLimitChange}>
                <SelectTrigger className="w-20">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">per page</span>
        </div>
    );
}
