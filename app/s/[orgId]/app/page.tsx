import ClientAnalyticsComponent from "@/components/clients/ClientAnalytics/ClientAnalyticsComponent"

interface AppPageProps {
    params: Promise<{ orgId: string }>
    searchParams: Promise<{ client_id?: string }>
}

export default async function AppPage({ params, searchParams }: AppPageProps) {
    const { orgId } = await params
    const { client_id } = await searchParams

    return (
        <div className="p-6 md:p-8">
            <ClientAnalyticsComponent />
        </div>
    )
}