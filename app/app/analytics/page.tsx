import { getAnalytics } from "@/app/api/owner/getAnalytics"
import { AnalyticsCallsComponent } from "@/components/analytics/AnalyticsCallsComponent"

export default async function AnalyticsPage() {
    const analyticsData = await getAnalytics()

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
                <p className="text-muted-foreground">
                    Monitor call performance, costs, and profit margins across all clients
                </p>
            </div>
            <AnalyticsCallsComponent analyticsData={analyticsData} />
        </div>
    )
}