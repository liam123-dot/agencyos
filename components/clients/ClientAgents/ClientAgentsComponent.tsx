import ImportAgent from "./ImportAgent"
import ClientAgentsList from "./ClientAgentsList"

export default function ClientAgentsComponent({ clientId }: { clientId: string }) {
    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <ImportAgent clientId={clientId} />
            </div>
            <ClientAgentsList clientId={clientId} />
        </div>
    )
}