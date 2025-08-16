import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AJI_Creators - AI-Powered Development",
  description: "Modern Next.js scaffold optimized for AI-powered development with AJI_Creators. Built with TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["AJI_Creators", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI development", "React"],
  authors: [{ name: "AJI_Creators Team" }],
  openGraph: {
    title: "AJI_Creators Code Scaffold",
    description: "AI-powered development with modern React stack",
    url: "https://chat.aji_creators.ai",
    siteName: "AJI_Creators",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AJI_Creators Code Scaffold",
    description: "AI-powered development with modern React stack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}