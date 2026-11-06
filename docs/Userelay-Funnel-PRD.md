# Userelay Funnel: Product Requirements Document

**Version:** 1.0
**Status:** Draft for review
**Date:** 2026-11-06
**Owner:** Fardeen
**Parent:** Userelay platform (see `Userelay-PRD.md`). This PRD defines app #1 of the suite. It supersedes the PRD's assumption that Bundles ships first.
**Working name:** Userelay Funnel (name is an open question, see section 15).

---

## 1. Summary

**Userelay Funnel** is a campaign funnel analyzer for Shopify brands. It shows what each marketing campaign actually produced at every step, from landing to product view, add to cart, checkout and order, and how much revenue it brings in over the following weeks. It is built for media buyers and founders who run top-of-funnel (TOF) campaigns that ad platforms judge only by purchase ROAS.

It runs on **our platform with our billing** (Paddle or Lemon Squeezy). It does not need a theme change, a storefront script or a Shopify App Store listing. Data comes from two sources:
1. A **Shopify custom pixel** (Settings → Customer events) that sends storefront funnel events to our ingest endpoint.
2. **Shopify order data** (Admin API and webhooks) as the revenue ground truth, added in a second connection step.

### Positioning
Simpler and cheaper than Triple Whale or Northbeam, and honest about what it can and cannot see. Not a black-box attribution model.

---

## 2. Problem statement

1. **Ad platforms judge awareness campaigns on purchases.** A TOF campaign can show poor ROAS while it drives product views, carts and later purchases. Buyers turn off campaigns that were working.
2. **GA4 is slow and hard to use.** It lags and does not show clean campaign-level funnel steps tied to UTMs.
3. **Existing attribution tools are expensive and opaque.** They charge hundreds of dollars a month, install heavy trackers and report modeled numbers that operators cannot verify.
4. **Revenue from TOF arrives late.** No simple tool shows how much revenue a campaign has produced after 1, 7, 14 and 30 days.

**Opportunity:** a focused, low-risk, read-only tool with a clear methodology and visible data coverage.

---

## 3. Goals and non-goals

### Goals (MVP)
- A merchant connects a store and sees a working campaign funnel within 10 minutes, with no code edits.
- Show, per campaign: landings, product views, add to cart, checkout started, orders, and first-touch revenue.
- Show **revenue maturity curves** by first-touch campaign (day 1, 7, 14, 30).
- Show **data coverage** on every view (share of orders matched to a tracked session, consent loss), so users know how much to trust it.
- Cost per micro-conversion (cost per add to cart, cost per checkout) using spend the merchant enters.
- Attribute influencers by discount code and referral link.
- Entitlements, billing and plans run entirely on the Userelay platform.

### Non-goals (MVP)
- Ad platform integrations (Meta, TikTok, Google). Spend is entered manually or by CSV at launch.
- Multi-touch, probabilistic or modeled attribution.
- Incrementality or media mix modeling.
- Post-purchase survey (needs a checkout extension, so it needs an installed app; later).
- Non-Shopify platforms.
- Writing anything to the store. The product is read-only.

---

## 4. Personas

| Persona | Needs |
|---|---|
| **Media buyer / agency lead** | See whether TOF campaigns create intent before cutting them; compare creatives by cost per add to cart. |
| **Brand founder** | One clear page on which campaigns and creators are worth paying for; low cost and low setup effort. |
| **Retention / lifecycle lead** | See which first-touch campaigns bring customers who reorder. |
| **Userelay owner (admin)** | See clients, ingest volume, errors and revenue (platform admin, see parent PRD). |

---

## 5. Key concepts

- **Session:** a browsing session identified by a first-party session ID created in the pixel.
- **Campaign key:** the identity of a campaign. Preferred order: campaign ID (`utm_id` or a dynamic ID in `utm_campaign`), then `utm_campaign` name, then source/medium. IDs survive renames.
- **First touch:** the first tracked visit for a customer, from the Shopify journey data or our own session history.
- **Attributed order:** an order whose checkout token matches a tracked session, or which carries a known discount code or referral. Everything else is **unattributed** and shown as such.
- **Coverage:** attributed orders divided by all orders for the period.

---

## 6. Data sources and connection tiers

| Tier | What the merchant does | What we get | Why it exists |
|---|---|---|---|
| **Tier 0: Pixel only** | Pastes our custom pixel in Customer events. No credentials shared. | Landing, product viewed, added to cart, checkout started, checkout completed (with order ID, total, line items, discount codes). UTMs and click IDs from the landing URL. | Lowest friction and lowest trust cost. Gives most of the funnel. |
| **Tier 1: Pixel + Admin API** | Also creates an app in the Shopify Dev Dashboard and connects client credentials (read-only scopes). | Full order history (beyond the pixel's install date), order journey summary (first/last visit), customer order history for LTV, refunds. | Needed for history, LTV and reconciliation. |

Notes:
- Tier 1 scopes: `read_orders`, `read_customers`, `read_products`. Access beyond about 60 days of orders may need extra scope or approval; confirm in the tech spec.
- Protected customer data rules apply. Store the minimum (hashed customer ID, order totals, dates). No names or emails in MVP.
- Shopify's current rules on credential-based connections and off-platform billing must be confirmed (section 14, risk 1).

---

## 7. Functional requirements

### 7.1 Accounts, stores and connection (platform)

| ID | Requirement |
|---|---|
| P-1 | Sign up, log in, reset password, profile. (Platform) |
| P-2 | Add a store by shop domain; generate a store-specific pixel snippet and ingest key. |
| P-3 | Guided Tier 0 setup with live "waiting for first event" status and a test-event check. |
| P-4 | Guided Tier 1 setup: Dev Dashboard app creation steps, credential entry, scope check, connection test. Credentials encrypted at rest. |
| P-5 | Disconnect flow: stop ingest, revoke stored credentials, retain or delete data per merchant choice. |
| P-6 | Team members with roles (owner, member). |

### 7.2 Billing and entitlements (platform)

| ID | Requirement |
|---|---|
| B-1 | Subscriptions per store for Funnel, billed through the platform vendor (Paddle or Lemon Squeezy; behind an interface). |
| B-2 | Billing webhooks verify signatures and are idempotent. |
| B-3 | Plan limits (events per month, stores, history window, team seats) are enforced server-side. |
| B-4 | On lapse or cancel: stop showing new data after grace period; data retained per policy; ingest endpoint keeps accepting events during `past_due` grace so there are no gaps. |
| B-5 | Billing state never touches the merchant's Shopify store. Funnel only reads. |

### 7.3 Event ingest

| ID | Requirement |
|---|---|
| IN-1 | The pixel runs in Shopify's sandbox, subscribes to standard events only, batches events and sends them to our ingest endpoint with the store ingest key. |
| IN-2 | The pixel respects Shopify's Customer Privacy API. No tracking without consent where consent is required; the pixel reports consent-denied sessions only as an anonymous count. |
| IN-3 | Pixel creates a first-party session ID and captures landing URL, referrer, UTMs, `utm_id`, and click IDs (`fbclid`, `ttclid`, `gclid`). |
| IN-4 | Ingest endpoint validates the key, rate-limits per store, deduplicates by event ID, and writes within 2 seconds at the 95th percentile. |
| IN-5 | Pixel size and CPU cost are minimal; failures are silent and never affect the storefront. |
| IN-6 | Raw events are retained for a limited window (default 90 days) then rolled up. |

### 7.4 Order data (Tier 1)

| ID | Requirement |
|---|---|
| OR-1 | Subscribe to `orders/create`, `orders/paid`, `orders/updated`, `refunds/create` (and cancelled) webhooks; verify HMAC; process idempotently. |
| OR-2 | Backfill order history on connection, within API rate limits (cost-aware throttling). |
| OR-3 | Join orders to sessions by checkout token. Store join result and confidence (matched, matched by discount code, unattributed). |
| OR-4 | Read the order journey summary (first and last visit, UTMs) as a fallback source of attribution. |
| OR-5 | Store refunds and net revenue; attribution reports show net and gross. |
| OR-6 | Customer-level fields: hashed customer ID, first-order flag, order count, for new vs returning and LTV. |

### 7.5 Attribution logic

| ID | Requirement |
|---|---|
| AT-1 | Resolve each session's campaign key (section 5) and normalize names (case, spacing, known aliases). |
| AT-2 | **First-touch revenue:** an order's revenue is credited to the customer's first tracked campaign within a configurable window (default 30 days). Last-touch is also shown for comparison. No other models in MVP. |
| AT-3 | **Discount code attribution:** merchant maps codes to creators or campaigns; matched orders are credited even without a session. |
| AT-4 | **Referral links:** merchant generates tagged links per creator; the tag is read from UTMs. |
| AT-5 | Unmatched orders are never reassigned by guesswork. They appear as "Unattributed". |
| AT-6 | Every number links to a methodology note explaining how it is computed. |

### 7.6 Dashboard and reports

| ID | Requirement |
|---|---|
| D-1 | **Campaign funnel table:** per campaign, spend, landings, product views, add to cart (count and rate), checkout started, orders, first-touch revenue, cost per add to cart, cost per checkout. Date range, filters, sort, CSV export. |
| D-2 | **Funnel view:** a step chart for one or several selected campaigns, with drop-off between steps. |
| D-3 | **Revenue maturity curves:** cumulative first-touch revenue per campaign cohort at day 1, 7, 14, 30, with a marker for "still maturing". |
| D-4 | **New vs returning and LTV by first-touch campaign** (Tier 1): share of new customers, reorder rate, revenue per customer at 30, 60, 90 days. |
| D-5 | **Creator view:** per code or referral link, spend, orders, revenue, refund rate. |
| D-6 | **Coverage panel** on every view: orders matched to a session, orders matched by code, unattributed, consent-denied sessions, and the date of the last event received. |
| D-7 | **UTM health:** detect missing, inconsistent or duplicate UTMs and show copy-paste templates for Meta, TikTok and Google. |
| D-8 | **Reconciliation page:** compares total orders and revenue with Shopify's own totals for a period, and highlights gaps. |
| D-9 | **Recommendations (post-launch of D-1 to D-3):** per campaign, a scale / hold / cut suggestion with plain reasons and the numbers behind it. Never shown without sufficient data volume; low-volume campaigns show "not enough data". |
| D-10 | Scheduled email report (weekly) with headline numbers and campaigns to watch. |

### 7.7 Spend input

| ID | Requirement |
|---|---|
| SP-1 | Manual spend entry per campaign per day or per period. |
| SP-2 | CSV import with column mapping and validation. |
| SP-3 | Spend currency is the store currency in MVP. |
| SP-4 | (Post-MVP) Meta, TikTok, Google connectors replace manual entry; they require each platform's app review and are out of MVP scope. |

### 7.8 Owner admin (platform)
Clients, plans, ingest volume per store, webhook and ingest errors, audit log. See parent PRD section 6.5.

---

## 8. Technical architecture

### 8.1 Stack

| Layer | Choice |
|---|---|
| Web app (marketing, customer app, admin) | Next.js (App Router), TypeScript, Tailwind |
| Auth and relational data | Supabase (PostgreSQL), RLS by `account_id` / `store_id` |
| Event storage | Postgres tables partitioned by day for MVP; move to ClickHouse or a similar columnar store when volume requires it |
| Ingest | Edge function (Vercel Edge or Cloudflare Worker) that validates and queues; a worker writes in batches |
| Jobs | Vercel Cron and a jobs table for MVP (webhook retries, backfill, rollups, reports). Add a queue (Upstash) only when needed |
| Shopify integration | Custom pixel (JS, sandboxed); Admin GraphQL API with merchant-provided credentials; webhooks |
| Billing | Paddle or Lemon Squeezy behind a `BillingProvider` interface |
| Email | Transactional email provider for reports |

### 8.2 Event flow
1. Shopper lands on the store with UTMs. The pixel creates a session and sends `landing` plus subsequent standard events in batches.
2. The ingest edge endpoint validates the store key, deduplicates, and stores the event.
3. On `checkout_completed` the event carries the checkout token and order ID.
4. The order webhook arrives (Tier 1). The join job matches order to session by checkout token and records attribution and confidence.
5. Rollup jobs aggregate by campaign key and day for the dashboard.

### 8.3 Core data model (draft)

```
-- Platform tables (shared): accounts, users, stores, apps, plans, subscriptions,
-- webhook_events, audit_log   (see Userelay-PRD.md 7.5)

funnel_store_settings(store_id, ingest_key_hash, tier, attribution_window_days,
                      consent_mode, created_at)
funnel_events(id, store_id, event_id unique, session_id, event_type
              [landing|product_viewed|added_to_cart|checkout_started|checkout_completed],
              occurred_at, campaign_key, utm jsonb, click_ids jsonb,
              product_ref, value_cents, checkout_token, order_ref)
funnel_sessions(id, store_id, session_id, first_seen_at, landing_url, referrer,
                campaign_key, consent_state)
funnel_orders(id, store_id, shopify_order_gid, checkout_token, created_at,
              gross_cents, refunded_cents, discount_codes jsonb,
              customer_hash, is_first_order, attributed_session_id,
              attribution_method[session|code|journey_summary|none])
funnel_campaigns(id, store_id, campaign_key, display_name, source, medium, aliases jsonb)
funnel_spend(id, store_id, campaign_id, date, amount_cents)
funnel_code_map(id, store_id, discount_code, campaign_id, creator_name)
funnel_rollups_daily(store_id, campaign_id, date, landings, product_views, atc,
                     checkouts, orders, first_touch_revenue_cents, ...)
```

### 8.4 Privacy and security
- Pixel honors Shopify consent signals; consent-denied traffic is counted only as an anonymous number.
- No personal data in events. Customer IDs are hashed per store. No emails or names stored in MVP.
- Admin credentials encrypted at rest (AES-256-GCM); read-only scopes only; revocable.
- Ingest keys are per store, hashed in storage, rotatable.
- Webhooks verify HMAC; billing webhooks verify vendor signatures.
- Mandatory customer-data request and erasure support (delete by customer hash and by store).
- RLS on every tenant table; admin routes role-checked server-side.
- Privacy policy, terms and a data processing agreement before launch.

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| **Storefront impact** | Pixel runs in Shopify's sandbox; payload small; no measurable effect on LCP, INP or CLS. |
| **Ingest latency** | p95 under 2 seconds from event to stored. |
| **Freshness** | Dashboard shows data less than 5 minutes old for pixel events and orders. |
| **Accuracy** | Order counts and revenue match Shopify totals within 1% for matched periods (shown on reconciliation page). |
| **Reliability** | Idempotent ingest and webhook handling; retries with backoff; dead-letter store; ingest stays up during billing issues. |
| **Scale (MVP target)** | 100 stores, up to 5M events per store per month. |
| **Accessibility** | WCAG AA contrast and keyboard-operable controls. |
| **Observability** | Structured logs; alerts on ingest error rate, webhook failures and join-rate drops. |

### Testing requirements
- Unit tests for campaign key resolution, first-touch and last-touch logic, windows, refunds, and rollups.
- Integration tests for webhook replay, backfill with rate limits, and checkout-token join.
- A Shopify development store with scripted traffic and orders; totals must match the dashboard.
- Consent tests: events not sent when consent is denied.
- Load test on ingest at 10x expected peak.

---

## 10. UX and design direction

**The UI follows `essential-apps.com-design.md`** (dark, high-contrast, neon-lime accent). The earthy palette in the parent PRD section 9 is not used.

| Item | Direction |
|---|---|
| Canvas | Black `#000000`; panels `#0A0A0A`; borders `#FFFFFF1A` / `#FFFFFF26` |
| Accent | Lime `#C2FA4F` with charcoal `#303030` text; used sparingly for primary actions, selected states and key chips |
| Text | White for headings, `#B3B3B3` for supporting text |
| Type | Bricolage Grotesque for the marketing hero only; Inter for all product UI |
| Shape | 12px controls (50px height), 16px cards, fully rounded chips |
| Elevation | Flat; borders and tonal shifts, minimal shadow |
| Error | `#FF5A5F`, rare |

Dashboard-specific application (extending the design file, which only describes a marketing page):
- Data tables use hairline borders and muted headers; the lime accent marks the selected row or sort column, not every metric.
- Charts use white and grays for neutral series and lime for the highlighted campaign. Because the palette has no second accent, comparisons use luminance steps and direct labels, not additional hues. If more series colors are needed, they are added to the design tokens deliberately, not ad hoc.
- Coverage and "still maturing" use chips with distinct label text, so meaning never depends on color alone.
- Status uses lime chip (good), muted outline chip (neutral/waiting) and `error` chip (problem).
- Empty states explain the next setup step and show the live "waiting for first event" check.

**Voice:** direct and plain. Say what the number is, what it covers and what it does not.

---

## 11. Pricing and plans (proposed)

Prices are to be decided. Structure proposal (per store):

| Plan | Includes |
|---|---|
| **Starter** | Tier 0 or 1, 1 store, up to 100k tracked events per month, 90-day history, D-1 to D-3, manual spend |
| **Pro** | Up to 1M events per month, 12-month history, LTV by campaign, creator view, scheduled reports, CSV export, 3 seats |
| **Agency** | Multiple stores, 5M events per store per month, team seats, white-label reports |

Open: trial length, card required, per-store vs per-account billing.

---

## 12. Success metrics

| Area | Metric |
|---|---|
| Onboarding | Median time from signup to first event received under 10 minutes; at least 70% of signups reach first event |
| Accuracy | Order and revenue totals within 1% of Shopify on the reconciliation page; attributed-order coverage reported per store (target to be set from beta data) |
| Engagement | Weekly active stores; share of stores opening maturity curves within the first week |
| Reliability | Ingest success rate; webhook success rate; zero lost billing events |
| Business | MRR, month-2 retention, upgrade rate Starter to Pro |
| Outcome | Merchant-reported decisions changed (for example, campaigns kept running because of maturity data), collected in beta interviews |

---

## 13. Roadmap

| Phase | Scope |
|---|---|
| **0: Validate** | Confirm Shopify policy position (risk 1), billing vendor, name and domain. Prototype the custom pixel on a dev store and verify the checkout-token join. Interview 5 to 10 media buyers. |
| **1: Platform** | Marketing site, auth, accounts, store setup, plans, billing, owner admin (shared with the suite). |
| **2: Funnel MVP (Tier 0)** | Pixel, ingest, sessions, campaign key resolution, funnel table and funnel view, spend CSV and manual entry, coverage panel, UTM health. |
| **3: Orders (Tier 1)** | Credentials connection, webhooks, backfill, checkout-token join, first-touch revenue, maturity curves, reconciliation page, refunds. |
| **4: Insight depth** | LTV by campaign, creator view, weekly reports, recommendations. |
| **5: Beta and launch** | Private beta stores, privacy documents, onboarding guide, public launch. |
| **Later** | Meta, TikTok and Google spend connectors; post-purchase survey (installed-app extension); incrementality-lite; other platforms; other suite apps (Export, Bundles). |

---

## 14. Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Shopify policy:** credential-based connection and off-platform billing may conflict with Shopify rules or be restricted. Staff statements indicate app charges for merchants acquired through Shopify must use Shopify billing; the written policy is not explicit for this model. | Get a written answer from Partner support in Phase 0. Tier 0 uses only a custom pixel (no app, no credentials). Keep billing behind an interface so Shopify billing can be added if needed. |
| 2 | **Pixel data is incomplete** (consent, blockers, Safari limits, cross-device). | Make coverage visible on every view; never present unmatched revenue as attributed; document methodology. |
| 3 | **Order history limits:** default API access covers only recent orders. | Check required scopes early; show history window clearly; backfill what is available. |
| 4 | **Custom pixel behavior changes** (Shopify updates to Customer events or sandbox). | Use only documented standard events; monitor changelog; contract tests on a dev store. |
| 5 | **Competition** (Triple Whale, Northbeam, Polar, Lifetimely, Shopify's own reports). | Compete on simplicity, price, honesty and maturity curves. Validate demand in Phase 0 before heavy build. |
| 6 | **Event volume and cost** on Postgres. | Daily partitions, rollups, retention limits, plan caps; plan the move to a columnar store. |
| 7 | **Privacy and compliance** (GDPR, CCPA, consent). | No personal data in MVP, consent handling, DPA, deletion endpoints, regional review before launch. |
| 8 | **Merchant setup friction** for Tier 1 (Dev Dashboard credentials). | Tier 0 stands alone; step-by-step guide with a connection test; ship screenshots and a short video. |
| 9 | **Ad platform connectors** need app review and long lead times. | Out of MVP; manual spend first; start review early after launch if demand is proven. |

---

## 15. Open questions

1. **Policy:** what does Shopify Partner support say about (a) off-platform billing for a pixel-plus-credentials product and (b) credential-based Admin API connections?
2. **Name:** Userelay Funnel, or another name for the suite app (the research notes suggested several)?
3. **Billing vendor:** Paddle or Lemon Squeezy; per store or per account; trial length.
4. **History window:** how many days of order history can we read on typical stores, and what scope or approval extends it?
5. **First-touch window:** default 30 days, or configurable per store from day one?
6. **Metric definitions:** confirm "assisted revenue" naming, since the MVP model is first-touch only.
7. **Regions:** which privacy regimes must be supported at launch (EU, UK, US states)?
8. **Data retention:** raw events 90 days, rollups 24 months. Confirm.
9. **Build order:** ship Funnel first and Bundles later, or run both in parallel?
10. **Support:** channel and response targets.
