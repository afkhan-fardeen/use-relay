import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Stand-in for sohne-var (licensed). Inter's variable weights cover the 300/400 system.
const sans = Inter({ variable: "--font-sans-stack", subsets: ["latin"], weight: "variable" });

export const metadata: Metadata = {
  title: "Klyroo Export — Shopify data to spreadsheets",
  description:
    "Klyroo Export turns Shopify products, orders, customers, inventory and collections into clean spreadsheets, with read-only access. Free to start.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
