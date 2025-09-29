import { Sparkles } from "lucide-react"

export default async function WorkflowsPage({ searchParams }: { searchParams: Promise<{ client_id: string | undefined }> }) {
    const { client_id } = await searchParams

    return (
        <div className="flex min-h-full flex-1 items-center justify-center bg-muted/40 px-6 py-24">
            <div className="max-w-xl space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Workflows are on the way</h1>
                    <p className="text-base text-muted-foreground">
                        We’re putting the finishing touches on a beautiful workflow builder just for you
                    </p>
                </div>
                <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2 rounded-full border border-dashed border-border/60 px-4 py-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Launching soon
                    </span>
                    {/* <span className="hidden sm:inline">Follow updates in the changelog.</span> */}
                </div>
            </div>
        </div>
    )
}