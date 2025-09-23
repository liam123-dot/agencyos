import ClientMembersComponent from "@/components/clients/ClientMembers/ClientMembersComponent"

export default async function Members({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    
    return (
        <ClientMembersComponent clientId={id} />
    )
}