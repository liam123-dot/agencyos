import { getAnalytics } from "@/app/api/owner/getAnalytics"
import { AnalyticsCallsComponent } from "@/components/analytics/AnalyticsCallsComponent"

export default async function AnalyticsPage() {
    const analyticsData = await getAnalytics()

    return (
        <div className="container mx-auto p-6 space-y-6">
            <AnalyticsCallsComponent analyticsData={analyticsData} />
        </div>
    )
}