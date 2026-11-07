import { FakeQr } from "@/components/fake-qr";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { Button, Card, Chip, Eyebrow } from "@/components/ui";

export const metadata = { title: "Klyroo QR — QR code generator" };

export default function QrLanding() {
  return (
    <div className="flex-1">
      <MarketingHeader tool="QR" anchors={[{ href: "#features", label: "Features" }]} />
      <section className="mx-auto max-w-[1200px] px-6 pt-24 pb-20 text-center">
        <Chip tone="info">Klyroo QR · Preview</Chip>
        <h1 className="mt-8 mx-auto max-w-[860px] text-[40px] sm:text-[56px] leading-[1.08] tracking-[-0.02em] font-light">
          Branded QR codes, ready for print.
        </h1>
        <p className="mt-6 mx-auto max-w-[620px] text-[17px] leading-[27px] text-muted">
          Design QR codes for packaging, flyers and your store, in your colours. No Shopify needed: Klyroo QR works on its own.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/login?app=qr">Try it free</Button>
        </div>
        <p className="mt-4 text-sm text-muted">In preview: you can try the designer. Saving and downloads are coming soon.</p>
      </section>

      <section id="features" className="mx-auto max-w-[1200px] px-6 pb-24">
        <Eyebrow>What it will do</Eyebrow>
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            ["Links, Wi-Fi, text", "Pick a type and enter the content. We handle the format."],
            ["Your look", "Choose colours, and soon add your logo."],
            ["Print-ready files", "Download PNG or SVG when saving is switched on."],
          ].map(([t, d], i) => (
            <Card key={t} className="!p-6">
              <div className="grid place-items-center rounded-ctl bg-wash p-5"><FakeQr seed={i + 3} size={96} /></div>
              <h3 className="mt-5 text-[19px] font-light">{t}</h3>
              <p className="mt-2 text-sm text-muted">{d}</p>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">The graphics above are samples and are not scannable.</p>
      </section>
      <MarketingFooter />
    </div>
  );
}
