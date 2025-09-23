
'use server'

import { redirect } from "next/navigation"
import { getUser } from "@/app/api/user/getUser"


export default async function SubdomainPage({ params }: { params: Promise<{ orgId: string }> }) {
    
    const user = await getUser()

    console.log('user', user);

    if (!user) {
        redirect('/auth')
    } else {
        redirect('/app')
    }

}

