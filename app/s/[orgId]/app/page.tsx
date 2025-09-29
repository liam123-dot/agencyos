import ClientAnalyticsComponent from "@/components/clients/ClientAnalytics/ClientAnalyticsComponent"

interface AppPageProps {
    params: Promise<{ orgId: string }>
    searchParams: Promise<{ 
        client_id?: string
        start_date?: string
        end_date?: string
        granularity?: string
        agent_id?: string
    }>
}

export default async function AppPage({ params, searchParams }: AppPageProps) {
    const { orgId } = await params
    const resolvedSearchParams = await searchParams

    return (
        <div className="p-6 md:p-8">
            <ClientAnalyticsComponent searchParams={resolvedSearchParams} />
        </div>
    )
}