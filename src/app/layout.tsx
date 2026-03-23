import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from '@vercel/analytics/next';
import { ThemeProvider } from "next-themes";
import { ServiceWorkerRegistrar } from "@/components/service-worker-registrar";

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
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/favicon/favicon.ico" },
      { url: "/icons/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: "/icons/favicon/favicon.ico",
    apple: "/icons/favicon/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MPH Songs",
  },
  applicationName: "MPH Songs",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ServiceWorkerRegistrar />
          <Toaster />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
