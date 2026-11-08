import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Stand-in for sohne-var (licensed). Inter's variable weights cover the 300/400 system.
const sans = Inter({ variable: "--font-sans-stack", subsets: ["latin"], weight: "variable" });

export const metadata: Metadata = {
  title: "Klyroo — small, sharp tools for ecommerce teams",
  description:
    "Klyroo makes focused apps for ecommerce teams: Klyroo Export for Shopify data and Klyroo QR for QR codes. Each app has its own plan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ctl focus:bg-primary focus:px-4 focus:py-2 focus:text-white">Skip to content</a>
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none">{children}</div>
      </body>
    </html>
  );
}
