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
  title: "MPH Songs",
  description: "Song lyrics manager for MPH. Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.",
  keywords: ["MPH", "Songs", "Lyrics", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui"],
  authors: [{ name: "MPH Team" }],
  openGraph: {
    title: "MPH Songs",
    description: "Song lyrics manager for MPH",
    url: "https://mph-songs.vercel.app",
    siteName: "MPH Songs",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MPH Songs",
    description: "Song lyrics manager for MPH",
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