'use client'

import { useEffect } from 'react';

interface DynamicTitleProps {
  title: string;
  logoUrl?: string | null;
}

export function DynamicTitle({ title, logoUrl }: DynamicTitleProps) {
  useEffect(() => {
    if (title) {
      document.title = title;
    }
  }, [title]);

  useEffect(() => {
    if (logoUrl) {
      // Update favicon
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = logoUrl;

      // Also update apple-touch-icon if it exists
      let appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
      if (!appleTouchIcon) {
        appleTouchIcon = document.createElement('link');
        appleTouchIcon.rel = 'apple-touch-icon';
        document.head.appendChild(appleTouchIcon);
      }
      appleTouchIcon.href = logoUrl;
    }
  }, [logoUrl]);

  return null; // This component doesn't render anything
}
