import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { QrDesigner } from "@/components/qr/designer";

export const metadata = {
  title: "Free QR code generator — Klyroo QR",
  description: "Make QR codes for links, Wi-Fi, contact cards, email, SMS and phone numbers. Custom colours and logo, PNG and SVG downloads. Free, in your browser, no account needed.",
};

export default function PublicGenerator() {
  return (
    <div className="flex-1">
      <MarketingHeader />
      <main className="mx-auto max-w-[1200px] px-6 py-12">
        <h1 className="text-[36px] sm:text-[44px] leading-[1.1] font-light tracking-[-0.02em]">Free QR code generator</h1>
        <p className="mt-3 max-w-2xl text-[17px] leading-[27px] text-muted">
          Make a QR code in seconds. It&apos;s created in your browser, so nothing you type is sent to us. No account, no watermark.
        </p>
        <div className="mt-10"><QrDesigner mode="public" /></div>
      </main>
      <MarketingFooter />
    </div>
  );
}
