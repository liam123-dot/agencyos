'use client';

import React, { useState } from 'react';
import { useVapi } from '@/hooks/use-vapi';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Loader2 } from 'lucide-react';

export function TestAgentButton({ assistantId, vapiPublishableKey }: { assistantId: string, vapiPublishableKey: string }) {
  const {
    start,
    stop,
    isSessionActive,
  } = useVapi(vapiPublishableKey);
  
  const [isConnecting, setIsConnecting] = useState(false);

  const handleClick = async () => {
    if (isSessionActive) {
      stop();
    } else {
      setIsConnecting(true);
      try {
        await start(assistantId);
      } finally {
        // Reset connecting state after a short delay to show the transition
        setTimeout(() => setIsConnecting(false), 1000);
      }
    }
  };

  const getButtonContent = () => {
    if (isConnecting) {
      return (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting...
        </>
      );
    }
    
    if (isSessionActive) {
      return (
        <>
          <PhoneOff className="h-4 w-4" />
          End Call
        </>
      );
    }
    
    return (
      <>
        <Phone className="h-4 w-4" />
        Test Agent
      </>
    );
  };

  return (
    <div className="w-full">
      <Button
        onClick={handleClick}
        disabled={isConnecting}
        className="w-full bg-slate-800 hover:bg-slate-700 text-white border-0 h-12 text-base font-medium"
        variant="default"
      >
        {getButtonContent()}
      </Button>

      {isSessionActive && !isConnecting && (
        <p className="text-xs text-muted-foreground/80 text-center mt-2 animate-pulse">
          Connected to assistant
        </p>
      )}
    </div>
  );
};