import Link from "next/link";
import { MarketingFooter, MarketingHeader } from "@/components/marketing";
import { CtaBand, Faq, Feature, PlanGrid, QrArt, SectionHead, Steps, TrustRow } from "@/components/marketing-blocks";
import { Button, Card, Chip } from "@/components/ui";
import { APPS } from "@/lib/apps";
import { COMPANY } from "@/lib/company";

export const metadata = {
  title: "Klyroo — Shopify exports and QR codes, without the busywork",
  description: "Klyroo Export turns Shopify products, orders, customers and inventory into spreadsheets. Klyroo QR makes QR codes you can print and track. Each app has its own plan. Start free.",
};

const ROWS = [
  ["#10420", "Maya Reyes", "Austin, US", "LEG-BL-M", "1"],
  ["#10421", "Jo Okafor", "Leeds, GB", "JAC-SA-L", "2"],
  ["#10422", "Dee Lindqvist", "Lyon, FR", "TEE-OL-S", "1"],
  ["#10423", "Lena Patel", "Toronto, CA", "BOT-SL-XS", "3"],
];

export default function Home() {
  return (
    <div className="flex-1">
      <MarketingHeader />

      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 pt-14 sm:pt-20 pb-16 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-8 items-center">
        <div className="text-center lg:text-left">
          <Chip tone="info">Two focused apps. One account.</Chip>
          <h1 className="mt-6 text-[40px] sm:text-[56px] leading-[1.05] tracking-[-0.025em] font-light">
            Shopify exports and QR codes, <span className="text-primary">without the busywork.</span>
          </h1>
          <p className="mt-6 text-[18px] leading-[28px] text-muted max-w-xl mx-auto lg:mx-0">
            Turn your store data into clean spreadsheets in minutes, and make QR codes you can print, change and track. Use one app or both. Each has its own simple plan.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <Button href="/login" className="w-full sm:w-auto">Start free</Button>
            <Button href="#apps" variant="secondary" className="w-full sm:w-auto">See the apps</Button>
          </div>
          <div className="mt-7"><TrustRow items={["No card needed", "Read-only Shopify access", "30-day money-back"]} /></div>
        </div>

        {/* Product visual: real QR codes, illustrative export */}
        <div className="relative mx-auto w-full max-w-[560px]">
          <Card featured className="!p-5 shadow-[0_20px_60px_rgba(10,37,64,0.10)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm">Orders for 3PL</p>
                <p className="text-xs text-muted">Live preview from your store</p>
              </div>
              <Chip tone="success">Ready to export</Chip>
            </div>
            <div className="mt-4 overflow-x-auto rounded-ctl border border-line">
              <table className="w-full text-xs whitespace-nowrap">
                <thead>
                  <tr className="text-left text-muted border-b border-line">{["Order", "Ship to", "City", "SKU", "Qty"].map((h) => <th key={h} className="px-3 py-2.5 font-normal">{h}</th>)}</tr>
                </thead>
                <tbody className="tabular">
                  {ROWS.map((r) => (
                    <tr key={r[0]} className="border-b border-line last:border-0">{r.map((c, i) => <td key={i} className="px-3 py-2.5">{c}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-muted">Illustrative example.</p>
          </Card>
          <Card className="!p-4 absolute -bottom-8 -left-2 sm:-left-8 w-[190px] bg-surface shadow-[0_16px_40px_rgba(10,37,64,0.12)]">
            <div className="grid place-items-center rounded-ctl bg-wash p-3"><QrArt content="https://useklyroo.com" size={112} style={{ fg: "#533AFD", shape: "rounded" }} /></div>
            <p className="mt-3 text-xs text-muted">Scan to visit Klyroo</p>
          </Card>
        </div>
      </section>

      {/* Apps */}
      <section id="apps" className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="The apps" title="Pick the one you need." sub="Each Klyroo app does one job well and works on its own. You never pay for features you don't use." />
        <div className="mt-12 grid md:grid-cols-2 gap-4">
          {APPS.map((a) => (
            <Card key={a.slug} featured className="!p-8 flex flex-col">
              <h3 className="text-[26px] leading-[1.12] font-light">{a.fullName}</h3>
              <p className="mt-3 text-muted">{a.tagline}</p>
              <ul className="mt-6 space-y-2.5 text-[15px] flex-1">
                {a.points.map((p) => <li key={p} className="flex gap-3"><span aria-hidden className="mt-2 size-1.5 rounded-full bg-primary shrink-0" />{p}</li>)}
              </ul>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Button href={`/login?app=${a.slug}`}>Start with {a.name}</Button>
                <Link href={a.marketing} className="text-sm text-primary hover:text-primary-hover">Learn more →</Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Why Klyroo" title="Built to be simple, and safe to trust." />
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Feature icon="store" title="Read-only by design">Klyroo Export only reads your Shopify data. It never changes your store.</Feature>
          <Feature icon="download" title="Files you can trust">Exports are private, downloadable only by you, and deleted after 7 days.</Feature>
          <Feature icon="qr" title="No tracking cookies">QR scan analytics use no cookies and store no IP addresses.</Feature>
          <Feature icon="user" title="Real support">Questions go to a real inbox at {COMPANY.supportEmail}. We reply within one working day.</Feature>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="How it works" title="From sign-up to done in minutes." />
        <div className="mt-12">
          <Steps items={[
            ["Create one account", "Sign up with your email. It takes under a minute and needs no card."],
            ["Choose an app", "Start with Export or QR. Add the other any time, with its own plan."],
            ["Do the job", "Connect your store and download a spreadsheet, or design a QR code and print it."],
          ]} />
        </div>
      </section>

      {/* Pricing */}
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Pricing" title="Simple plans. Separate per app." sub="Export plans grow with your number of stores and export size. QR plans grow with your dynamic links and scans." />
        <div className="mt-12 space-y-14">
          <div>
            <h3 className="mb-5 text-[22px] font-light">Klyroo Export</h3>
            <PlanGrid app="export" />
          </div>
          <div>
            <h3 className="mb-5 text-[22px] font-light">Klyroo QR</h3>
            <PlanGrid app="qr" />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[900px] px-4 sm:px-6 py-20 border-t border-line">
        <SectionHead eyebrow="Questions" title="Good to know before you start." center />
        <div className="mt-12">
          <Faq items={[
            ["Does Klyroo change my Shopify store?", "No. Klyroo Export only reads your data, using read-only credentials you create in your own Shopify account. You can revoke access at any time."],
            ["How do I connect my store?", <>You create a small read-only app in your Shopify Dev Dashboard and paste its credentials into Klyroo. It takes about two minutes. <Link href="/docs/export/connect-shopify" className="text-primary">Step-by-step guide</Link>.</>],
            ["How do the Export plans differ?", "Only by the number of stores and the rows per export. Every plan includes all columns, templates, metafields and downloads."],
            ["What is a dynamic QR code?", "A QR code that points to a short link you control. You can change where it sends people at any time, even after it's printed, and see how many people scanned it."],
            ["What happens if I pass my QR scan limit?", "Your codes keep working. We tell you and invite you to upgrade. We never switch off a printed code."],
            ["Is my data safe?", "Credentials are encrypted, export files are private and deleted after 7 days, and QR analytics use no cookies and no IP addresses. Read our privacy policy for details."],
            ["Can I cancel or get a refund?", "Yes. Cancel any time from the app. Every first purchase has a 30-day money-back guarantee."],
            ["Do I need both apps?", "No. Each app is separate, with its own plan. Use one, or both."],
          ]} />
        </div>
      </section>

      <CtaBand title="Get your data and your codes sorted today." sub="Start free. No card needed." href="/login" label="Create your free account" />
      <MarketingFooter />
    </div>
  );
}
