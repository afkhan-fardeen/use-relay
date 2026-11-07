import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Stand-in for sohne-var (licensed). Inter's variable weights cover the 300/400 system.
const sans = Inter({ variable: "--font-sans-stack", subsets: ["latin"], weight: "variable" });

export const metadata: Metadata = {
  title: "Klyroo Export — Shopify data exports, scheduled",
  description:
    "Export Shopify products, orders, customers and inventory to CSV. Templates, schedules and delivery to email, Drive, Dropbox and SFTP.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
