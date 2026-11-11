import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, Feature, PlanGrid, QrArt, SectionHead, Steps, TrustRow } from "@/components/marketing-blocks";
import { JsonLd } from "@/components/json-ld";
import { softwareLd } from "@/lib/seo";
import { Button, Card, Chip } from "@/components/ui";

export const metadata = {
  icons: { icon: "/brand/klyroo-qr-favicon.svg" },
  title: "Klyroo QR — QR code generator with editable links",
  description: "Make QR codes for links, Wi-Fi, contact cards, email, SMS and phone. Free static codes in your browser, plus dynamic links you can change and track.",
};

export default function QrLanding() {
  return (
    <div className="flex-1">
      <JsonLd data={softwareLd({ name: "Klyroo QR", description: "QR codes for links, Wi-Fi, contact cards and more, with editable dynamic links and cookie-free scan analytics.", path: "/apps/qr", category: "BusinessApplication", low: 0, high: 45, features: ["Seven kinds of code", "PNG and SVG downloads", "Dynamic links", "Scan analytics without cookies"] })} />
      <MarketingHeader tool="QR" anchors={[{ href: "#features", label: "Features" }, { href: "#pricing", label: "Pricing" }, { href: "/qr-code-generator", label: "Free generator" }, { href: "/docs/qr/getting-started", label: "Docs" }]} />
      <main>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-16 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
        <div className="text-center lg:text-left">
          <Chip tone="info">Klyroo QR</Chip>
          <h1 className="mt-6 text-[40px] sm:text-[56px] leading-[1.05] tracking-[-0.025em] font-light">
            QR codes you can <span className="text-primary">print, change and track.</span>
          </h1>
          <p className="mt-6 text-[18px] leading-[28px] text-muted max-w-xl mx-auto lg:mx-0">
            Make a QR code in seconds, in your colours and with your logo. Free codes are made in your browser. Dynamic links let you change the destination after you&apos;ve printed, and show you the scans.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button href="/qr-code-generator" className="w-full sm:w-auto">Make a free QR code</Button>
            <Button href="/login?app=qr" variant="secondary" className="w-full sm:w-auto">Create an account</Button>
          </div>
          <div className="mt-7"><TrustRow items={["No account for static codes", "No cookies or IP tracking", "PNG and SVG downloads"]} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4 max-w-[460px] mx-auto w-full">
          {[
            { c: "https://useklyroo.com", s: { fg: "#533AFD" as const, shape: "rounded" as const }, l: "Link" },
            { c: "WIFI:T:WPA;S:Cafe Blue;P:welcome2024;H:false;;", s: { fg: "#0A2540" as const, shape: "dots" as const }, l: "Wi-Fi" },
            { c: "mailto:hello@example.com", s: { fg: "#137A48" as const, shape: "square" as const }, l: "Email" },
            { c: "tel:+442079460958", s: { fg: "#B54708" as const, shape: "rounded" as const }, l: "Phone" },
          ].map((x) => (
            <Card key={x.l} featured className="!p-4 text-center">
              <div className="grid place-items-center rounded-ctl bg-wash p-3"><QrArt content={x.c} size={132} style={x.s} /></div>
              <p className="mt-3 text-sm text-muted">{x.l}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="features" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="What you get" title="Everything you need to put a code on anything." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Feature icon="qr" title="Seven kinds of code">Links, plain text, Wi-Fi, contact cards, email, SMS and phone numbers. Each one is checked so it scans.</Feature>
          <Feature icon="apps" title="Your colours, your logo">Choose colours and a shape, add your logo, and we warn you if the contrast is too low to scan.</Feature>
          <Feature icon="download" title="Print-ready files">Download PNG up to 2048 pixels, or SVG that stays sharp at any size.</Feature>
          <Feature icon="link" title="Dynamic links">Point a code at a short link. Change where it goes any time, without reprinting.</Feature>
          <Feature icon="history" title="Scan analytics">See scans per day, unique visitors, devices, countries and where people came from.</Feature>
          <Feature icon="store" title="Private by design">No cookies, no IP addresses stored, and static codes are made in your browser. Nothing you type is sent to us.</Feature>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="How it works" title="From idea to printed in minutes." />
        <div className="mt-12">
          <Steps items={[
            ["Choose a type", "Link, Wi-Fi, contact card and more. Fill in the details."],
            ["Make it yours", "Pick colours, shape and a logo. Check the live preview and scan it with your phone."],
            ["Download or track", "Download PNG or SVG. Or save a dynamic link to change it later and see the scans."],
          ]} />
          <p className="mt-6 text-sm text-muted">Learn more in the <Link href="/docs/qr/getting-started" className="text-primary">QR guide</Link>.</p>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Pricing" title="Free for static codes. Paid when you need dynamic ones." sub="Static codes are free and unlimited. Dynamic links, scan analytics and custom short link names are on Pro and Business." />
        <div className="mt-12"><PlanGrid app="qr" /></div>
        <p className="mt-4 text-sm text-muted max-w-3xl">If you pass your monthly scan limit, your codes keep working and we ask you to upgrade. We never switch off a printed code.</p>
      </section>

      <section className="mx-auto max-w-[900px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Questions" title="Good to know." center />
        <div className="mt-12">
          <Faq items={[
            ["What's the difference between static and dynamic?", "A static code holds its content inside the picture. It's free and permanent, but it can't be changed or counted. A dynamic code points to a short link on Klyroo, so you can change where it goes and see scans."],
            ["Will my codes stop working if I cancel?", "Static codes always work. If you downgrade, your dynamic links keep redirecting, but you can't create new ones beyond your plan."],
            ["Do you track the people who scan?", "We count scans, devices, countries and referring sites. We use no cookies and store no IP addresses. A visitor is a code that changes every day."],
            ["Can I use my logo?", "Yes. Upload a PNG, JPEG or WebP. We raise the error correction automatically so the code still scans."],
            ["How do I make sure it scans?", "Use a dark code on a light background, leave the blank border around it, and print it at least 2 cm wide. See the printing tips in our guide."],
            ["Do I need a Shopify store?", "No. Klyroo QR works on its own."],
          ]} />
        </div>
      </section>

      <CtaBand title="Make your first QR code in under a minute." sub="Free, in your browser. No account needed." href="/qr-code-generator" label="Open the free generator" />
      </main>
      <MarketingFooter />
    </div>
  );
}
