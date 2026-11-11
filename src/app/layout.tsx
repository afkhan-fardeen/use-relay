import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

// Stand-in for sohne-var (licensed). Inter's variable weights cover the 300/400 system.
const sans = Inter({ variable: "--font-sans-stack", subsets: ["latin"], weight: "variable" });

const plausible = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN; // optional, cookie-free analytics

export const metadata: Metadata = {
  metadataBase: new URL("https://useklyroo.com"),
  openGraph: { type: "website", siteName: "Klyroo", locale: "en_GB" },
  twitter: { card: "summary_large_image" },
  title: "Klyroo: Shopify apps that keep it simple",
  description:
    "Klyroo is a company that makes simple, focused Shopify apps, starting with Klyroo Data Exporter.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ctl focus:bg-primary focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
        {plausible && <Script defer data-domain={plausible} src="https://plausible.io/js/script.js" strategy="afterInteractive" />}
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">{children}</div>
      </body>
    </html>
  );
}
