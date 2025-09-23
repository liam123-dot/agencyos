interface AppPageProps {
    params: Promise<{ orgId: string }>
    searchParams: Promise<{ client_id?: string }>
}

export default async function AppPage({ params, searchParams }: AppPageProps) {
    const { orgId } = await params
    const { client_id } = await searchParams

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">App Page</h1>
            
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h2 className="text-lg font-semibold text-blue-800 mb-2">Organization Info</h2>
                    <p className="text-blue-700">
                        <span className="font-medium">Organization ID:</span> {orgId}
                    </p>
                </div>

                {client_id && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-green-800 mb-2">Client Info</h2>
                        <p className="text-green-700">
                            <span className="font-medium">Client ID:</span> {client_id}
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                            You are accessing this organization as a client user
                        </p>
                    </div>
                )}

                {!client_id && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h2 className="text-lg font-semibold text-purple-800 mb-2">Access Type</h2>
                        <p className="text-purple-700">
                            You are accessing this organization as a direct member
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}