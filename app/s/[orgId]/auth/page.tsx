
import { getPublicOrg } from "@/app/api/user/selected-organization/getOrg";
import { ClientSignInForm } from "@/components/clients/ClientAuth/ClientSignInForm";
import { notFound, redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function SubdomainAuthPage({ params }: { params: Promise<{ orgId: string }> }) {
    const { orgId } = await params;

    const supabase = await createServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    console.log('user', user);

    if (user) {
        redirect('/app')
    }

    try {
        const organization = await getPublicOrg(orgId);
        
        return (
            <div className="min-h-screen flex flex-col">
                <div className="flex-1 flex items-center justify-center p-6 md:p-10">
                    <div className="w-full max-w-sm">
                        <div className="text-center mb-8">
                            {organization.logo_url && (
                                <div className="flex justify-center mb-6">
                                    <div className="relative w-16 h-16">
                                        <Image
                                            src={organization.logo_url}
                                            alt={`${organization.name} logo`}
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            )}
                            <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
                            <p className="text-muted-foreground">
                                Sign in to your {organization.name} client portal
                            </p>
                        </div>
                        <ClientSignInForm 
                            organizationId={orgId}
                            organizationName={organization.name}
                        />
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error('Error loading organization:', error);
        notFound();
    }
}

