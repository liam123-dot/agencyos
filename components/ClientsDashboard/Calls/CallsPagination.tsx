'use client'

import { useRouter, useSearchParams } from "next/navigation";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

interface CallsPaginationProps {
    currentPage: number;
    totalPages: number;
}

export function CallsPagination({ currentPage, totalPages }: CallsPaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const createPageUrl = (page: number) => {
        const params = new URLSearchParams(searchParams);
        if (page === 1) {
            params.delete('page');
        } else {
            params.set('page', page.toString());
        }
        // Preserve existing limit parameter
        const queryString = params.toString();
        return queryString ? `?${queryString}` : window.location.pathname;
    };

    const handlePageChange = (page: number) => {
        router.replace(createPageUrl(page));
    };

    // Always show pagination UI, but disable navigation if only one page
    const isDisabled = totalPages <= 1;

    // Calculate which pages to show
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); 
             i <= Math.min(totalPages - 1, currentPage + delta); 
             i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
        <Pagination>
            <PaginationContent>
                <PaginationItem>
                    <PaginationPrevious 
                        href={!isDisabled && currentPage > 1 ? createPageUrl(currentPage - 1) : undefined}
                        onClick={!isDisabled && currentPage > 1 ? () => handlePageChange(currentPage - 1) : undefined}
                        className={isDisabled || currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                </PaginationItem>

                {visiblePages.map((page, index) => (
                    <PaginationItem key={index}>
                        {page === '...' ? (
                            <PaginationEllipsis />
                        ) : (
                            <PaginationLink
                                href={!isDisabled ? createPageUrl(page as number) : undefined}
                                onClick={!isDisabled ? () => handlePageChange(page as number) : undefined}
                                isActive={currentPage === page}
                                className={isDisabled ? 'pointer-events-none opacity-50' : ''}
                            >
                                {page}
                            </PaginationLink>
                        )}
                    </PaginationItem>
                ))}

                <PaginationItem>
                    <PaginationNext 
                        href={!isDisabled && currentPage < totalPages ? createPageUrl(currentPage + 1) : undefined}
                        onClick={!isDisabled && currentPage < totalPages ? () => handlePageChange(currentPage + 1) : undefined}
                        className={isDisabled || currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                    />
                </PaginationItem>
            </PaginationContent>
        </Pagination>
    );
}
