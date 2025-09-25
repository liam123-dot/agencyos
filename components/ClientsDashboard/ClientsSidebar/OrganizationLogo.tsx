"use client"

import Image from "next/image";

interface OrganizationLogoProps {
  name: string;
  logoUrl?: string | null;
  size?: number;
}

export function OrganizationLogo({ name, logoUrl, size = 40 }: OrganizationLogoProps) {
  if (logoUrl) {
    return (
      <div className={`relative flex-shrink-0 rounded-lg overflow-hidden`} style={{ width: size, height: size }}>
        <Image
          src={logoUrl}
          alt={`${name} logo`}
          fill
          className="object-contain"
        />
      </div>
    );
  }
  
  // Fallback to initial if no logo
  const initial = name && name.trim().length > 0 
    ? name.trim().charAt(0).toUpperCase() 
    : 'C';
  
  return (
    <div 
      className="flex items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
      style={{ width: size, height: size }}
    >
      {initial}
    </div>
  );
}
