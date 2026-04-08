import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Geist_Mono } from "next/font/google";
import { appBasePath } from "@/lib/app-base-path";
import {
  absolutePageUrl,
  canonicalAlternates,
  defaultSiteDescription,
  homeDocumentTitle,
  metadataBase,
  sharedOpenGraph,
  sharedTwitter,
  siteTitleTemplate,
} from "@/lib/site-metadata";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SonnerToaster } from "@/components/sonner-toaster";
import { ThemeProvider } from "@/providers/theme-provider";
import { DbProvider } from "@/providers/db-provider";
import { AppShell } from "@/components/layout/app-shell";
import { ServiceWorkerProvider } from "@/providers/sw-provider";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const homeCanonical = absolutePageUrl("/");

export const metadata: Metadata = {
  metadataBase,
  title: {
    default: homeDocumentTitle,
    template: siteTitleTemplate,
  },
  description: defaultSiteDescription,
  alternates: canonicalAlternates("/"),
  openGraph: {
    ...sharedOpenGraph,
    title: homeDocumentTitle,
    description: defaultSiteDescription,
    url: homeCanonical,
    locale: "es_ES",
  },
  twitter: {
    ...sharedTwitter,
    title: homeDocumentTitle,
    description: defaultSiteDescription,
  },
  icons: {
    icon: `${appBasePath}/favicon.ico`,
    apple: [
      {
        url: `${appBasePath}/icons/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: `${appBasePath}/icons/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
      },
      {
        url: `${appBasePath}/icons/icon-192.svg`,
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        url: `${appBasePath}/icons/icon-512.svg`,
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Finanzzz",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${nunitoSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <TooltipProvider>
            <DbProvider>
              <ServiceWorkerProvider>
                <AppShell>{children}</AppShell>
              </ServiceWorkerProvider>
            </DbProvider>
          </TooltipProvider>
          <SonnerToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
