'use server'

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation";

export async function getUser() {

    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    // console.log('user', user);
    
    if (error || !user) {
        redirect('/auth')
    }

    const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (userError) {
        redirect('/auth')
    }

    return { userData, supabaseServerClient: supabase }
}