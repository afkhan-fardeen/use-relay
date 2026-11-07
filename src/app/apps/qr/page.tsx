import { FakeQr } from "@/components/fake-qr";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import Link from "next/link";
import { Button, Card, Chip, Eyebrow } from "@/components/ui";
import { QR_PLANNED } from "@/lib/billing/plans";

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

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <Eyebrow>Planned plans</Eyebrow>
        <h2 className="mt-4 text-[32px] leading-[1.1] font-light">Free for static codes. Paid when you need dynamic ones.</h2>
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {QR_PLANNED.map((p) => (
            <Card key={p.key} featured={p.recommended} className={`!p-6 ${p.recommended ? "!border-primary/50" : ""}`}>
              <h3 className="text-[22px] leading-[26px] font-light">{p.name}</h3>
              <p className="mt-1 text-sm text-muted">{p.blurb}</p>
              <p className="mt-4 text-[32px] leading-[1.1] font-normal tabular">{p.priceLabel}{p.key !== "free" && <span className="text-base font-normal text-muted"> /mo</span>}</p>
              <ul className="mt-4 space-y-2.5 text-[15px] text-muted">
                {p.features.map((f) => <li key={f.text} className="flex gap-3"><span aria-hidden>○</span>{f.text}</li>)}
              </ul>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">These are plans, not yet released. Plans open at launch. See <Link href="/pricing" className="text-primary">pricing</Link>.</p>
      </section>
      <MarketingFooter />
    </div>
  );
}
