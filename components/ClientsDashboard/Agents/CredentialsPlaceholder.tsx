import { Key } from "lucide-react"

export default function CredentialsPlaceholder() {
    return (
        <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-6 py-4 border-b border-border/60">
                <div>
                    <h2 className="text-xl font-semibold">Credentials</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        0 credentials
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="rounded-full border border-dashed border-border/80 bg-muted/20 p-4 text-muted-foreground mb-3">
                    <Key className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1">Credentials Management</h3>
                <p className="text-muted-foreground text-sm max-w-md">
                    Manage API keys, tokens, and other credentials for your agents and workflows.
                </p>
                <p className="text-muted-foreground text-sm mt-4">
                    Coming soon...
                </p>
            </div>
        </>
    )
}

