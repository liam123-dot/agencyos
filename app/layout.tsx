import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppLevelProviders } from "@/components/appLevelProviders";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "AgencyOS - Modern Web Platform",
  description: "A modern, customizable platform built with Next.js and Supabase",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.className} antialiased`}>
        <AppLevelProviders>
          {children}
        </AppLevelProviders>
      </body>
    </html>
  );
}
