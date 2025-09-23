
import { CallsComponent } from "@/components/ClientsDashboard/Calls/CallsComponent";

interface CallsPageProps {
    searchParams: Promise<{
        page?: string;
        limit?: string;
        client_id?: string;
    }>;
    params: Promise<{
        orgId: string;
    }>;
}

export default async function CallsPage({ searchParams, params }: CallsPageProps) {
    const resolvedSearchParams = await searchParams;
    const resolvedParams = await params;
    const clientId = resolvedSearchParams.client_id;

    console.log('clientIdParams', clientId);

    const currentPage = parseInt(resolvedSearchParams.page || '1', 10);
    const currentLimit = parseInt(resolvedSearchParams.limit || '10', 10);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Calls</h1>
                <p className="text-muted-foreground">
                    View and manage all calls made through your agents
                </p>
            </div>
            
            <CallsComponent 
                initialPage={currentPage}
                initialLimit={currentLimit}
                clientId={clientId}
            />
        </div>
    );
}