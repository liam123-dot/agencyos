"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

type ResetStep = "email" | "code" | "password" | "complete";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<ResetStep>("email");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Send OTP to email for password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/forgot-password`, // Keep user on this page
      });
      if (error) throw error;
      setCurrentStep("code");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Verify the OTP code
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: 'recovery',
      });
      if (error) throw error;
      setCurrentStep("password");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      // Update the user's password
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      if (error) throw error;
      setCurrentStep("complete");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          Enter your email address and we&apos;ll send you a verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendCode}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send verification code"}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link
              href="/auth"
              className="underline underline-offset-4"
            >
              Login
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderCodeStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Enter Verification Code</CardTitle>
        <CardDescription>
          We&apos;ve sent a 6-digit code to {email}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerifyCode}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="text-center text-lg tracking-widest"
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? "Verifying..." : "Verify code"}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Didn&apos;t receive the code?{" "}
            <button
              type="button"
              onClick={() => setCurrentStep("email")}
              className="underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderPasswordStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Set New Password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Enter new password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );

  const renderCompleteStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Password Reset Complete</CardTitle>
        <CardDescription>Your password has been successfully updated</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4">
            You can now sign in with your new password.
          </p>
          <Link href="/auth">
            <Button className="w-full">
              Continue to Login
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {currentStep === "email" && renderEmailStep()}
      {currentStep === "code" && renderCodeStep()}
      {currentStep === "password" && renderPasswordStep()}
      {currentStep === "complete" && renderCompleteStep()}
    </div>
  );
}
