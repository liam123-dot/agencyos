import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Navigation } from "@/components/navigation";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">Reset your password</h1>
            <p className="text-muted-foreground">
              Enter your email to receive a password reset link
            </p>
          </div>
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
