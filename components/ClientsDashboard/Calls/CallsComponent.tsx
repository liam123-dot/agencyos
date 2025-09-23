'use client'

import { useState, useEffect, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { getCalls } from "./CallsServerComponent";
import { CallsTable } from "./CallsTable";
import { CallsPagination } from "./CallsPagination";
import { CallsLimitSelector } from "./CallsLimitSelector";

interface CallsComponentProps {
    initialPage?: number;
    initialLimit?: number;
    clientId?: string;
}

interface CallsData {
    calls: any[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    limit: number;
}

export function CallsComponent({ initialPage = 1, initialLimit = 10, clientId }: CallsComponentProps) {
    const searchParams = useSearchParams();
    const [callsData, setCallsData] = useState<CallsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const currentPage = parseInt(searchParams.get('page') || initialPage.toString(), 10);
    const currentLimit = parseInt(searchParams.get('limit') || initialLimit.toString(), 10);

    const loadCalls = async (page: number, limit: number) => {
        try {
            setIsLoading(true);
            setError(null);
            console.log('clientId', clientId);
            const data = await getCalls({ page, limit, clientId });
            setCallsData(data);
        } catch (err) {
            console.error('Error loading calls:', err);
            setError('Failed to load calls');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        startTransition(() => {
            loadCalls(currentPage, currentLimit);
        });
    }, [currentPage, currentLimit]);

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-destructive text-lg">{error}</p>
                <p className="text-muted-foreground text-sm mt-2">
                    Please try refreshing the page
                </p>
            </div>
        );
    }

    const showLoading = isLoading || isPending;
    const calls = callsData?.calls || [];
    const totalCount = callsData?.totalCount || 0;
    const totalPages = callsData?.totalPages || 1;
    const serverLimit = callsData?.limit || currentLimit;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                    {showLoading ? (
                        "Loading..."
                    ) : (
                        `Showing ${calls.length} of ${totalCount} calls`
                    )}
                </div>
                <CallsLimitSelector
                    currentLimit={serverLimit}
                />
            </div>
            
            <CallsTable calls={calls} isLoading={showLoading} />
            
            <div className="flex justify-center">
                <CallsPagination
                    currentPage={currentPage}
                    totalPages={Math.max(totalPages, 1)}
                />
            </div>
        </div>
    );
}
