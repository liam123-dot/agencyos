import { useQuery } from "@tanstack/react-query";
import { getAnalytics } from "@/app/api/owner/getAnalytics";

interface GetAnalyticsParams {
    clientId?: string;
    agentId?: string;
    startDate?: string;
    endDate?: string;
}

export function useAnalytics(params?: GetAnalyticsParams) {
    return useQuery({
        queryKey: ['analytics', params],
        queryFn: () => getAnalytics({
            clientId: params?.clientId && params.clientId !== 'all' ? params.clientId : undefined,
            agentId: params?.agentId && params.agentId !== 'all' ? params.agentId : undefined,
            startDate: params?.startDate || undefined,
            endDate: params?.endDate || undefined,
        }),
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

