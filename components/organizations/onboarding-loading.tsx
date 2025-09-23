import { Loader2 } from 'lucide-react';

export function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span>Setting up your workspace...</span>
      </div>
    </div>
  );
}
