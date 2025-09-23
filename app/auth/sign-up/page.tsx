import { SignUpForm } from "@/components/sign-up-form";
import { Navigation } from "@/components/navigation";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Create your account</h1>
            <p className="text-muted-foreground">
              Join Whitelabel and get started today
            </p>
          </div>
          <SignUpForm />
        </div>
      </div>
    </div>
  );
}
