# Klyroo QR: product plan

**Status:** plan for review · **Date:** 7 Nov 2026 · **Parent:** Klyroo (see `Userelay-PRD.md` for the platform)

Klyroo QR is a standalone app under Klyroo. It works with no Shopify connection, has its own plans and its own billing, and shares only the Klyroo login.

## 1. What it is

A QR code generator in two parts:

| Part | What it does | Where it runs |
|---|---|---|
| **Static codes** | The content is baked into the picture. Free forever, no account needed. | In the visitor's browser only. Nothing is sent to a server. |
| **Dynamic codes** | The code points at a short link we host, so the destination can be edited later. Scans are counted. | A small redirect service we run, separate from the app. |

## 2. Plans (decided)

| Plan | Price (GBP) | Dynamic links | Scans a month | Who it is for |
|---|---|---|---|---|
| **Free** | £0, forever | 0 (static only) | Unlimited (direct link, we never see the scan) | One-off prints, personal contact cards, Wi-Fi stickers |
| **Pro** (recommended) | **£20 / month** | Up to 25 | 20,000 | Multi-store operators, marketing links, packaging, event flyers |
| **Business / API** | **£45 / month** | Unlimited | 100,000 | High-volume campaigns, custom routing domains, agency seats |

What each plan includes:

- **Free:** unlimited static codes made in the browser (no account), colours and styles, logo, PNG and SVG up to 2048 px, URL, Wi-Fi, contact card, email, SMS and phone.
- **Pro:** everything in Free, plus dynamic links (edit the destination any time), scan analytics (visitors, trends, top codes), custom short link names, priority email support.
- **Business / API:** everything in Pro, plus custom routing domains, agency seats and projects, API access, priority support.

All of the above is "Soon" on the site until built. Billing env names: `DODO_PRODUCT_QR_PRO`, `DODO_PRODUCT_QR_BUSINESS`.

### Notes on this pricing
- **£20 is a premium price.** Comparable tools advertise unlimited dynamic codes for roughly £5 to £9 a month. Pro only justifies £20 if it is clearly sold to businesses (multi-store, packaging, events) and the analytics are strong. Watch free-to-Pro conversion. If it is weak, add a small bridge plan (for example £8 for 5 dynamic links and 2,000 scans) rather than cutting Pro.
- **Scan limits must never break a printed code.** When a code passes its monthly limit, it **keeps redirecting**. We email the owner and show an upgrade prompt in the app. Only block at a hard ceiling that is clearly abuse (for example 3× the limit in a month). This is a promise to write into the terms.
- **Free has no dynamic codes,** which removes the biggest abuse and cost risk from the free tier and keeps Free simple to explain.
- **Business / API features** (custom domains, agency seats, API) are the largest builds. Do not sell the plan before they exist; list it as Planned.
- **Monthly scan counting** needs a reliable counter per code and per account. Plan it in Phase 3.

## 3. How it is built

- **Static generator:** a client-side library in the Klyroo app. No server, no database. It is also the best acquisition page: a public "free QR code generator" with its own SEO pages.
- **Redirect service (the hard part):** printed codes must never go down. Do **not** host it on the free Render service, which sleeps. Use an edge function (for example Cloudflare Workers with a key-value store) that answers in milliseconds and keeps working if the main app is down. It reads the destination from the edge store, replies with a redirect, and queues a scan event.
- **Short domain:** buy a short, separate domain for redirects (not `useklyroo.com`), so a bad link can never damage the main site's reputation.
- **Data (Supabase):** `qr_projects`, `qr_project_members`, `qr_codes` (type, destination, slug, style, status), `qr_scans` (code, time, country, device class, referrer, visitor hash). Same isolation rules as Export: members read only their own projects.
- **Billing:** its own Dodo product. Env: `DODO_PRODUCT_QR_PRO`. The platform already supports one subscription per account per app.

## 4. Privacy and safety (decide before dynamic launches)

- **No cookies on scan pages and no raw IP addresses stored.** Count unique visitors with a daily rotating hash of IP and device, and take country from the edge. This keeps scan analytics out of cookie-consent rules in the UK and EU. Say so in the privacy policy.
- **Abuse and phishing:** check destinations against Google Safe Browsing when a code is created and on a schedule, rate-limit creation, block lists, a "report this link" page, and a takedown process in the terms.
- **If a subscription lapses:** never break printed codes silently. Keep paused codes redirecting for 30 days, email the owner, then show a clear "this code is paused" page. Only the 3 free active codes stay live.
- **Terms:** add QR-specific acceptable use and a takedown clause before launch.

## 5. Phases

| Phase | Scope | Needs |
|---|---|---|
| **1. Static generator** | Public client-side tool: all content types, styling, logo, PNG/SVG to 2048 px. Replaces the current preview graphics with real, scannable codes. | Frontend only |
| **2. Accounts** | Save designs, library, projects. Free plan limits. | Database tables |
| **3. Dynamic codes** | Short domain, edge redirect service, edit destination, scan counting, safety checks. | Short domain, edge hosting |
| **4. Analytics and Plus plan** | Unique visitors, trends, top codes, custom slugs, Dodo product and billing. | Dodo product for QR |
| **5. Teams** | Members per project, invites, roles. | Email sending |

## 6. Decisions still needed

1. Short-link domain name for redirects.
2. Over-limit rule: keep redirecting (recommended) and the hard-ceiling multiple.
3. Lapse policy: 30-day grace before codes show a "paused" page (recommended).
4. Whether Phase 1 launches as a public SEO tool before accounts exist (recommended).
