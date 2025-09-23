'use server'

import { redirect } from "next/navigation";
import { getUser } from "@/app/api/user/getUser";
import { getUserOrganizations, updateSelectedOrganization } from "@/lib/actions/organization-actions";
import { OnboardingWrapper } from './onboarding-wrapper';

export async function OnboardingServer() {
  try {
    const { userData } = await getUser();

    // Redirect unauthenticated users to login
    if (!userData) {
      redirect("/auth");
    }

    // Get user's organizations on the server
    const organizations = await getUserOrganizations();

    // If user has a selected organization, redirect to app
    if (userData.selected_organization_id) {
      redirect("/app");
    }

    // If user has organizations but none selected, auto-select the first one
    if (organizations && organizations.length > 0) {
      await updateSelectedOrganization(organizations[0].id);
      redirect("/app");
    }

    // No organizations found, show onboarding flow
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center space-y-4 mb-8">
              <h1 className="text-3xl font-bold">Welcome!</h1>
              <p className="text-muted-foreground text-lg">
                Let's get you set up with an organization to start collaborating.
              </p>
            </div>
            
            <OnboardingWrapper />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error in onboarding:', error);
    // Show error state
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-destructive">Error</h3>
          <p className="text-muted-foreground">
            Something went wrong while setting up your workspace. Please try again.
          </p>
        </div>
      </div>
    );
  }
}
