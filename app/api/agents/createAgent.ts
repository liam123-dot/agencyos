'use server'

import { VapiClient } from "@vapi-ai/server-sdk"
import { assignVapiAgentToClient } from "./assignAgentToClient"
import { revalidatePath } from "next/cache"
import { authorizedToAccessClient } from "../clients/clientMembers"

export async function createAgent(name: string, clientId?: string) {
    try {
        const authorized = await authorizedToAccessClient(clientId)
        if (!authorized) {
            throw new Error('Unauthorized')
        }

        const { client, organization, supabaseServerClient } = authorized


        const vapiClient = new VapiClient({token: organization.vapi_api_key})

        const agent = await vapiClient.assistants.create({
            name: name,
            model: {
                model: 'gpt-4o-mini',
                provider: 'openai'
            },
            firstMessage: 'Hello, how can I help you today?',
            voicemailMessage: 'Thank you for calling. Please leave a message after the beep.',
            endCallMessage: 'Thank you for calling. Goodbye!',
            firstMessageInterruptionsEnabled: true,
            transcriber: {
                model: 'nova-2',
                language: 'en',
                provider: 'deepgram'
            },
            startSpeakingPlan: {
                waitSeconds: 0.3,
                smartEndpointingPlan: {
                    provider: 'livekit',
                    waitFunction: '(20 + 500 * sqrt(x) + 2500 * x^3 + 700 + 4000 * max(0, x-0.5)) / 2'
                }
            }
        })

        await assignVapiAgentToClient(client.id, agent.id)

        // Revalidate the agents list pages
        revalidatePath(`/s/${client.organization_id}/app/agents`, 'page')
        // Also revalidate client dashboard if this was created from there
        if (clientId) {
            revalidatePath(`/app/clients`, 'page')
        }

        return agent
    } catch (error) {
        console.error('Error creating agent:', error)
        
        // Re-throw with user-friendly message
        if (error instanceof Error) {
            throw new Error(error.message)
        }
        
        throw new Error('Failed to create agent. Please try again.')
    }
}
