import { syncClientSubscriptions } from "@/app/api/clients/clientSubscriptions"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ orgId: string }> }) {

    const supabaseServerClient = await createServerClient()

    const { orgId } = await params
    const { data } = await request.json()
    console.log(data)
    // for any stripe subscription event, we need to sync the client subscriptions
    if ('subscription' in data.data.object) {
        const customerId = data.data.object.customer
        const { data: client } = await supabaseServerClient.from('clients').select('*').eq('stripe_customer_id', customerId).single()
        if (client) {
            await syncClientSubscriptions(client.id)
        }
    }
    return new Response('OK')
}