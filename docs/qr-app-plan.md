# Klyroo QR: product plan

**Status:** plan for review · **Date:** 7 Nov 2026 · **Parent:** Klyroo (see `Userelay-PRD.md` for the platform)

Klyroo QR is a standalone app under Klyroo. It works with no Shopify connection, has its own plans and its own billing, and shares only the Klyroo login.

## 1. What it is

A QR code generator in two parts:

| Part | What it does | Where it runs |
|---|---|---|
| **Static codes** | The content is baked into the picture. Free forever, no account needed. | In the visitor's browser only. Nothing is sent to a server. |
| **Dynamic codes** | The code points at a short link we host, so the destination can be edited later. Scans are counted. | A small redirect service we run, separate from the app. |

## 2. Features and plans

Feature set modelled on the reference you shared (a free tier plus one paid "Advanced" tier), adapted for Klyroo. Prices are placeholders to decide.

| | **Free (forever)** | **Plus** | Later: **Team** |
|---|---|---|---|
| Static codes | Unlimited, in the browser, no account | Same | Same |
| Styling | Colours and styles, logo upload | Same | Same |
| Export | PNG and SVG, up to 2048 px | Same | Same |
| Content types | URL, Wi-Fi, vCard, email, SMS, phone, text | Same | Same |
| Dynamic codes | **3 active** (not 3 per day) | Unlimited, with logos | Unlimited |
| Edit destination | Yes | Yes | Yes |
| Scan analytics | Total scans | Unique visitors, daily trend, top codes, country and device | Same, plus export |
| Short links | Klyroo short domain | Custom slug (`short.domain/s/your-brand`) | Custom domain |
| Projects | 2 | 10 | More |
| Team members per project | 2 | 10 | More |
| Creation rate | Standard | 30 new dynamic codes an hour | Higher |
| Branding on scan pages | Small "Made with Klyroo" | None | None |
| Support | Standard email | Priority | Priority + chat |
| **Suggested price** | £0 | **£5/mo early-adopter, £9/mo after** | £19/mo (decide later) |

**Why 3 active dynamic codes, not 3 a day:** a daily allowance invites accounts that churn out codes to abuse the redirect domain. A fixed number of active codes is easy to explain and cheap to run.

## 3. How it is built

- **Static generator:** a client-side library in the Klyroo app. No server, no database. It is also the best acquisition page: a public "free QR code generator" with its own SEO pages.
- **Redirect service (the hard part):** printed codes must never go down. Do **not** host it on the free Render service, which sleeps. Use an edge function (for example Cloudflare Workers with a key-value store) that answers in milliseconds and keeps working if the main app is down. It reads the destination from the edge store, replies with a redirect, and queues a scan event.
- **Short domain:** buy a short, separate domain for redirects (not `useklyroo.com`), so a bad link can never damage the main site's reputation.
- **Data (Supabase):** `qr_projects`, `qr_project_members`, `qr_codes` (type, destination, slug, style, status), `qr_scans` (code, time, country, device class, referrer, visitor hash). Same isolation rules as Export: members read only their own projects.
- **Billing:** its own Paddle product. Env: `PADDLE_PRICE_QR_PLUS`. The platform already supports one subscription per account per app.

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
| **4. Analytics and Plus plan** | Unique visitors, trends, top codes, custom slugs, Paddle product and billing. | Paddle price for QR |
| **5. Teams** | Members per project, invites, roles. | Email sending |

## 6. Decisions needed

1. Short-link domain name for redirects.
2. Final prices (the early-adopter £5 then £9 pattern, or something else).
3. Free dynamic limit (3 active is the recommendation).
4. Lapse policy (30-day grace is the recommendation).
5. Whether Phase 1 launches as a public SEO tool before accounts exist (recommended).
