import { UpdatePasswordForm } from "@/components/update-password-form";
import { Navigation } from "@/components/navigation";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Update your password</h1>
            <p className="text-muted-foreground">
              Enter your new password below
            </p>
          </div>
          <UpdatePasswordForm />
        </div>
      </div>
    </div>
  );
}
