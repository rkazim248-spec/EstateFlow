import type { Metadata, Viewport } from "next";
import { Instrument_Serif, Inter } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "EstateFlow — Real Estate Management",
    template: "%s | EstateFlow",
  },
  description:
    "EstateFlow — property and client management for Pakistani real estate. Find, manage and grow with the shared EstateFlow web and mobile workspace.",
  applicationName: "EstateFlow",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EstateFlow",
  },
  openGraph: {
    type: "website",
    siteName: "EstateFlow",
    title: "EstateFlow — Real Estate Management",
    description:
      "A calmer workspace for property listings, clients, matching, marketing images and social planning.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "EstateFlow — Real Estate Management",
    description:
      "Property and client management for Pakistani real estate. Find, manage and grow.",
  },
  robots: { index: false, follow: false },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0866F5" },
    { media: "(prefers-color-scheme: dark)", color: "#101D3A" },
  ],
};

const themeScript = `(function(){try{var raw=localStorage.getItem('estateflow.appearance');var p=raw?JSON.parse(raw):{};var mode=p.mode||'system';var accent=p.accent||'teal';var dark=mode==='dark'||(mode!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.classList.toggle('dark',dark);r.setAttribute('data-accent',accent);r.style.colorScheme=dark?'dark':'light';}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
