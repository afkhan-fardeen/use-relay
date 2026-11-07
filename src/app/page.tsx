import Link from "next/link";
import { Logo } from "@/components/sidebar";
import { Button, Card, Chip, Eyebrow } from "@/components/ui";
import { templates } from "@/lib/export";

const features = [
  { t: "Templates for real jobs", d: "Orders for your 3PL, a full catalog, inventory by location, a customer list for email. Pick one and run it.", chip: `${templates.length} templates` },
  { t: "Build your own", d: "Choose the data, filter it, pick and rename the columns, and check a live preview before you run.", chip: "Live preview" },
  { t: "Runs on a schedule", d: "Hourly, daily, weekly or monthly. Only changed records if you want, so files stay small.", chip: "Coming soon" },
  { t: "Delivered for you", d: "Send files to email, Google Drive, Dropbox or SFTP. Failures email you with a one-click retry.", chip: "Coming soon" },
  { t: "Built for big stores", d: "Uses Shopify bulk operations and background jobs, so large exports finish instead of timing out.", chip: "1M+ rows" },
  { t: "Read-only and private", d: "We only ask for read access. Credentials are encrypted and files are served through short-lived links.", chip: "Never writes" },
];

const steps = [
  { n: "01", t: "Connect your store", d: "Create a read-only app in Shopify and paste its credentials. It takes about two minutes." },
  { n: "02", t: "Pick a template", d: "Start from a ready-made export or build one. Check the preview." },
  { n: "03", t: "Run or schedule", d: "Download the file now, or send it somewhere on a schedule." },
];

const plans = [
  { name: "Free", price: "$0", points: ["1 store", "3 manual exports a month", "Up to 1,000 rows", "All templates"] },
  { name: "Starter", price: "$19", points: ["1 store", "50k rows per export", "3 schedules", "Email and download"] },
  { name: "Pro", price: "$39", featured: true, points: ["3 stores", "1M rows per export", "25 schedules", "Drive, Dropbox, SFTP", "90-day history"] },
  { name: "Agency", price: "$99", points: ["25 stores", "High volume", "Team seats", "Shared templates"] },
];

export default function Landing() {
  return (
    <div className="flex-1">
      <header className="sticky top-0 z-30 bg-canvas/90 backdrop-blur border-b border-line">
        <div className="mx-auto max-w-[1200px] px-6 h-[72px] flex items-center justify-between">
          <Logo tool={null} />
          <nav aria-label="Main" className="hidden md:flex items-center gap-8 text-sm font-normal text-muted">
            <a href="#features" className="hover:text-ink">Features</a>
            <a href="#how" className="hover:text-ink">How it works</a>
            <a href="#pricing" className="hover:text-ink">Pricing</a>
          </nav>
          <div className="flex items-center gap-5">
            <Link href="/login" className="hidden sm:inline text-sm font-normal text-muted hover:text-ink">Log in</Link>
            <Button size="sm" href="/login">Start free</Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1200px] px-6 pt-24 pb-20 text-center">
        <Chip tone="info">Klyroo Export · for Shopify</Chip>
        <h1 className="mt-8 mx-auto max-w-[900px] text-[40px] sm:text-[56px] leading-[1.08] tracking-[-0.02em] font-light">
          Every Shopify export, ready in minutes.
        </h1>
        <p className="mt-6 mx-auto max-w-[640px] text-[17px] leading-[27px] text-muted">
          Products, orders, customers and inventory to CSV, on a schedule, delivered to your 3PL, your accountant or your inbox. No code and no API.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button href="/login">Start free</Button>
          <Button variant="secondary" href="/app">Try the demo</Button>
        </div>
        <p className="mt-4 text-sm text-muted">Read-only access. No card to start.</p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <Card featured className="!p-6 sm:!p-10">
          <div className="grid lg:grid-cols-[1fr_320px] gap-10 items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Eyebrow>Orders for 3PL</Eyebrow>
                <Chip tone="outline">paid</Chip>
                <Chip tone="info">Every day 06:00</Chip>
              </div>
              <div className="overflow-x-auto rounded-ctl border border-line">
                <table className="w-full text-xs whitespace-nowrap">
                  <thead>
                    <tr className="text-left text-muted border-b border-line">
                      {["Order", "Ship to", "City", "SKU", "Qty"].map((h) => <th key={h} className="px-4 py-3 font-normal">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    {[
                      ["#10420", "Maya Reyes", "Austin", "LEG-BL-M-100", "1"],
                      ["#10421", "Jo Okafor", "Leeds", "JAC-SA-L-101", "2"],
                      ["#10422", "Dee Lindqvist", "Lyon", "TEE-OL-S-102", "1"],
                      ["#10423", "Lena Patel", "Toronto", "BOT-SL-XS-103", "3"],
                    ].map((r) => (
                      <tr key={r[0]} className="border-b border-line last:border-0">
                        {r.map((c, i) => <td key={i} className="px-4 py-3">{c}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-card border border-line p-6 bg-canvas">
              <Eyebrow>Delivered</Eyebrow>
              <p className="mt-2 text-[22px] leading-[26px] font-normal">sftp.eastcoast3pl.com</p>
              <p className="text-sm text-muted mt-1">orders_2026-11-06.csv · 1,284 rows</p>
              <div className="my-5 border-t border-line" />
              <div className="flex items-center gap-2 text-sm"><span aria-hidden className="size-2 rounded-full bg-primary" />Succeeded in 34s</div>
              <div className="flex items-center gap-2 text-sm mt-2 text-muted"><span aria-hidden className="size-2 rounded-full bg-secondary" />Next run tomorrow, 06:00</div>
            </div>
          </div>
        </Card>
        <p className="mt-4 text-center text-xs text-muted">Illustrative example data.</p>
      </section>

      <section id="features" className="mx-auto max-w-[1200px] px-6 py-24 border-t border-line">
        <Eyebrow>What you get</Eyebrow>
        <h2 className="mt-4 max-w-[680px] text-[37px] leading-[44px] font-light">The spreadsheet your team keeps asking for.</h2>
        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Card key={f.t}>
              <Chip tone="info">{f.chip}</Chip>
              <h3 className="mt-6 text-[22px] leading-[26px] font-light">{f.t}</h3>
              <p className="mt-3 text-[15px] leading-6 text-muted">{f.d}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 py-24 border-t border-line">
        <Eyebrow>Templates</Eyebrow>
        <h2 className="mt-4 text-[37px] leading-[44px] font-light">Start from the job, not the field list.</h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((t) => (
            <div key={t.id} className="border border-line rounded-card p-6">
              <p className="text-[13px] font-normal text-secondary">{t.category}</p>
              <h3 className="mt-4 font-light">{t.name}</h3>
              <p className="mt-2 text-sm text-muted">{t.blurb}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="mx-auto max-w-[1200px] px-6 py-24 border-t border-line">
        <Eyebrow>How it works</Eyebrow>
        <h2 className="mt-4 text-[37px] leading-[44px] font-light">From connect to first file in three minutes.</h2>
        <ol className="mt-12 grid md:grid-cols-3 gap-4">
          {steps.map((s) => (
            <li key={s.n} className="border border-line rounded-card p-8">
              <span className="text-primary font-normal text-sm">{s.n}</span>
              <h3 className="mt-6 text-[22px] leading-[26px] font-light">{s.t}</h3>
              <p className="mt-3 text-[15px] leading-6 text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="pricing" className="mx-auto max-w-[1200px] px-6 py-24 border-t border-line">
        <Eyebrow>Pricing</Eyebrow>
        <h2 className="mt-4 text-[37px] leading-[44px] font-light">Simple plans. No per-row surprises.</h2>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((p) => (
            <Card key={p.name} featured={p.featured} className={`!p-6 ${p.featured ? "!border-primary/50" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-[22px] leading-[26px] font-light">{p.name}</h3>
                {p.featured && <Chip>Popular</Chip>}
              </div>
              <p className="mt-6 text-[40px] leading-[44px] font-normal tabular">{p.price}<span className="text-base font-normal text-muted"> /mo</span></p>
              <ul className="mt-6 space-y-3 text-[15px] text-muted">
                {p.points.map((x) => <li key={x} className="flex gap-3"><span aria-hidden className="text-primary">✓</span>{x}</li>)}
              </ul>
              <Button variant={p.featured ? "primary" : "secondary"} href="/login" className="mt-8 w-full">Start free</Button>
            </Card>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted">Placeholder prices, pending final pricing.</p>
      </section>

      <section className="mx-auto max-w-[1200px] px-6 pb-24">
        <Card featured className="!p-12 text-center">
          <h2 className="text-[40px] leading-[1.05] tracking-[-0.02em] font-light max-w-[640px] mx-auto">Stop copy-pasting from Shopify.</h2>
          <div className="mt-8 flex justify-center"><Button href="/login">Start free</Button></div>
        </Card>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1200px] px-6 py-10 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <Logo tool={null} />
          <div className="flex gap-6"><a href="#" className="hover:text-ink">Privacy</a><a href="#" className="hover:text-ink">Terms</a></div>
          <p>© 2026 Klyroo</p>
        </div>
      </footer>
    </div>
  );
}
