import { getClientInviteDetails } from "@/app/api/clients/clientInvites"
import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg"
import { ClientSignUpForm } from "@/components/clients/ClientAuth/ClientSignUpForm"
import Image from "next/image"

interface InvitePageProps {
    params: Promise<{ orgId: string }>
    searchParams: Promise<{ token?: string }>
}

export default async function InvitePage({ params, searchParams }: InvitePageProps) {
    
    const { orgId } = await params
    const { token } = await searchParams

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
                    <p className="text-gray-600">Token is required</p>
                </div>
            </div>
        )
    }

    try {
        const org = await getPublicOrg(orgId)
        const inviteDetails = await getClientInviteDetails(token)

        if (!inviteDetails.clients) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
                        <p className="text-gray-600">Client not found</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        {org.logo_url && (
                            <div className="flex justify-center mb-6">
                                <div className="relative w-16 h-16">
                                    <Image
                                        src={org.logo_url}
                                        alt={`${org.name} logo`}
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        )}
                        <h1 className="text-2xl font-bold mb-2">Join {org.name}</h1>
                        <p className="text-muted-foreground mb-6">
                            Complete your registration to access your client portal
                        </p>
                    </div>
                    <ClientSignUpForm
                        clientName={inviteDetails.clients.name}
                        clientId={inviteDetails.clients.id}
                        token={token}
                        inviteEmail={inviteDetails.email}
                    />
                </div>
            </div>
        )
    } catch (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">Invalid Invitation</h1>
                    <p className="text-gray-600">
                        {error instanceof Error ? error.message : 'This invitation is no longer valid'}
                    </p>
                </div>
            </div>
        )
    }
}