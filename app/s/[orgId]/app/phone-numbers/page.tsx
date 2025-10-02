'use server'

import PhoneNumbersWrapper from "@/components/organizations/TwilioSetup/PhoneNumbersWrapper"
import { redirect } from "next/navigation"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Phone Numbers",
}

interface PhoneNumbersPageProps {
    searchParams: Promise<{ client_id?: string }>
}

export default async function PhoneNumbersPage({ searchParams }: PhoneNumbersPageProps) {
    const { client_id } = await searchParams

    if (!client_id) {
        // If no client_id is provided, redirect to the main app page
        // In a real app, you might want to show a client selector or handle this differently
        redirect('/app')
    }

    return (
        <div className="p-4 md:p-6">
            <PhoneNumbersWrapper clientId={client_id} />
        </div>
    )
}