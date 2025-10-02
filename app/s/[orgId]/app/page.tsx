import ClientAnalyticsComponent from "@/components/clients/ClientAnalytics/ClientAnalyticsComponent"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Analytics",
}

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
        <div className="p-4 md:p-6">
            <ClientAnalyticsComponent searchParams={resolvedSearchParams} />
        </div>
    )
}