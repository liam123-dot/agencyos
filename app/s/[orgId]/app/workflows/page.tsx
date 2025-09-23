export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ client_id: string }> }) {

    const { client_id } = await searchParams

    return (
        <div>
            Coming soon...
        </div>
    )
}