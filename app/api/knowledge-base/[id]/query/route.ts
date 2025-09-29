import { NextResponse } from "next/server"

import { createServerClient } from "@/lib/supabase/server"
import { Ragie } from "ragie"


const apiKey = process.env.RAGIE_API_KEY

export async function POST(request: Request, {params}: {params: Promise<{id: string}>}) {

    const {id} = await params

    const body = await request.json()


    const supabaseServerClient = await createServerClient()

    const message = body.message;
    
    if (message.type !== "knowledge-base-request") {
        return NextResponse.json({message: 'Invalid message type'})
    }

    // get the last message
    const query = message.messages[message.messages.length - 1].message;

    console.log('query is', query)

    
    const ragie = new Ragie({
        auth: apiKey
    })

    const response = await ragie.retrievals.retrieve({
        query,
        filter: {
            knowledge_base_id: id
        }
    })
    /*
     response comes as list of documents, each document has chunks, each of which has a content and a score.
     first, split out the response into chunks
    */

    const chunks = response.scoredChunks.map((chunk: any) => {
        return {
            content: chunk.text
        }
    })

    return NextResponse.json(chunks)

}