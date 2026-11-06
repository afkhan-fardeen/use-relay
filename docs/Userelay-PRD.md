# Userelay: Product Requirements Document

**Version:** 2.0 (supersedes the "Virtual Sets" PRD v1.0)
**Status:** Draft for review
**Date:** 2026-11-06
**Owner:** Fardeen

---

## 1. Summary

**Userelay** is a multi-app commerce suite for Shopify brands. A merchant creates one Userelay account, connects their Shopify store once, and then subscribes to individual apps, each with its own plans. The first app is **Bundles**, a FastBundle-style app that lets a merchant publish a set of products on its own product page while the order, cart, inventory and fulfillment only ever see the real component SKUs.

Billing runs outside the Shopify App Store through a Merchant of Record (Paddle or Lemon Squeezy). Merchants install Userelay through our own install link.

### What changed from PRD v1.0

| Topic | v1.0 | v2.0 |
|---|---|---|
| Product shape | Single "Virtual Sets" product | Platform (Userelay) with multiple apps; Bundles is app #1 |
| Surfaces | Merchant dashboard only | Marketing site, customer app, and owner admin |
| Shopify integration | OAuth or custom token | **Full Shopify app** (OAuth) with extensions; the custom-token path is dropped from the MVP |
| Discounts | `discountAutomaticBasicCreate` | **Shopify Function (Discount)** reading bundle line-item properties |
| Design | Not specified | Swiss-minimal editorial, earthy palette (see section 9) |

---

## 2. Problem statement

1. **Broken 3PL and warehouse logistics.** Many bundling apps create synthetic parent SKUs or split kits after the order is placed. This breaks barcode scanning, desyncs inventory across fulfillment centers, and complicates partial returns.
2. **Storefront performance drag.** Large app scripts hurt Core Web Vitals and conversion.
3. **App cost and billing sprawl.** Merchants pay for many single-feature apps with overlapping features, tier caps and transaction fees.

**Opportunity:** a suite of focused apps that stays light on the storefront, bills plainly, and keeps orders clean down to the warehouse.

---

## 3. Goals and non-goals

### Goals (MVP)
- A merchant can sign up, connect a store, subscribe to Bundles, and publish a first set in under 5 minutes.
- Bundles sell as separate native line items; no parent or synthetic SKU is ever created or sold.
- Bundle discounts are applied reliably in Shopify's cart and checkout, independent of Userelay server uptime.
- The owner (you) can see all clients, subscriptions and app settings in one admin portal.
- The platform is structured so app #2 is a new module, not a rebuild.

### Non-goals (MVP)
- Public Shopify App Store listing.
- Apps other than Bundles (Export, Cart drawer, Insights are roadmap only).
- Headless / non-theme storefronts.
- Custom Admin API token installs.
- Multi-currency price rules beyond what Shopify handles natively.

---

## 4. Personas

| Persona | Needs |
|---|---|
| **Brand founder / operator** | Raise average order value with curated sets; zero fulfillment errors; predictable software cost. |
| **E-commerce merchandiser** | Pair products, build sets and schedule pricing without editing code. |
| **Warehouse / 3PL manager** | Orders arrive with normal, scannable SKUs; no kit reconciliation. |
| **Userelay owner (admin)** | See clients, plans, usage, revenue and errors; manage apps and plans; support merchants. |

---

## 5. Platform structure

### 5.1 Three surfaces

| Surface | URL (suggested) | Audience |
|---|---|---|
| Marketing site | `userelay.com` | Prospects. Landing page, per-app pages, pricing, sign up / log in. |
| Customer app | `app.userelay.com` | Merchants. Account, stores, app list, subscribe, use apps. Also embedded in Shopify admin. |
| Owner admin | `admin.userelay.com` | Userelay team only. Role-restricted. |

### 5.2 Merchant journey

1. Land on the marketing site, click **Start free**.
2. **Sign up** (email + password or magic link).
3. **Connect a Shopify store** (Shopify install and permission screen).
4. See the **app list** with status per app (not subscribed, trial, active, coming soon).
5. Choose an app, **pick a plan**, and subscribe (hosted checkout via Paddle or Lemon Squeezy).
6. Open the app and start using it. For Bundles: create the first set.
7. Turn on the **Userelay theme embed** in the Shopify theme editor (guided).

### 5.3 App model
An **app** is a record (name, slug, status, description) with a set of **plans** (price, limits, feature flags) plus its own code module. Entitlements are checked from the subscription for that app and store. Adding a new app means adding a record, plans and a module.

---

## 6. Functional requirements

### 6.1 Accounts and stores (platform)

| ID | Requirement |
|---|---|
| P-1 | Users can sign up, log in, reset password, and manage their profile. |
| P-2 | An account can connect one or more Shopify stores through the Shopify install flow. Required scopes are requested minimally (see 7.2). |
| P-3 | On install, verify the shop (`shop { name currencyCode }`), store the shop domain and an encrypted access token, and register required webhooks. |
| P-4 | Handle app uninstall: mark the store disconnected, deactivate its sets, remove discounts, retain data per retention policy. |
| P-5 | Team members can be invited to an account with roles (owner, member). |
| P-6 | Billing page shows subscriptions per app and store, invoices, payment method, and plan change / cancel. |

### 6.2 Subscriptions and billing

| ID | Requirement |
|---|---|
| B-1 | Subscriptions are per **app per store**, billed through Paddle or Lemon Squeezy (final vendor to be decided; see open questions). |
| B-2 | Webhook handlers for `subscription_created`, `subscription_updated`, `subscription_cancelled`, `payment_failed`. All verify the signature and are **idempotent** (event ID stored; replays are no-ops). |
| B-3 | Feature gating is enforced server-side from the plan's entitlements (never trusted from the client). |
| B-4 | On cancellation or lapse: sets become inactive, automatic discounts are disabled, and product pages and catalog history are **not deleted**. |
| B-5 | Failed payments move the subscription to `past_due` with a grace period before gating (length TBD). |

### 6.3 App: Bundles

**Concept.** A *set* is a merchant-defined group of two or more existing products. It gets its own product page (a "shell" product) so it can be merchandised like any product. The shell is never purchased: adding the set to the cart adds the real component variants as separate line items.

| ID | Requirement |
|---|---|
| BN-1 | Merchant creates a set by choosing two or more existing products and naming it. |
| BN-2 | For each component, merchant can restrict which variants are selectable (sizes, colors). |
| BN-3 | Pricing models: **percentage off**, **fixed amount off the set**, **fixed set price**. Fixed amounts are distributed proportionally across component lines. |
| BN-4 | On publish, the backend creates the **shell product** (title, images, description, status) and writes the bundle recipe to an app-owned metafield (`$app:bundle_recipe`). |
| BN-5 | The shell product is **not purchasable**: never added to the cart or checkout (see BN-10). |
| BN-6 | The merchant can edit, duplicate, pause (draft) and archive sets. Editing a published set updates its shell product and discount configuration. |
| BN-7 | Plan limits are enforced (e.g. Starter: 3 active sets). |
| BN-8 | Storefront script detects the recipe on the product page, hides the default variant picker, and renders one picker per component (dropdown or pills). |
| BN-9 | The widget reads live variant availability and disables sold-out options. |
| BN-10 | **Add set to cart** issues a single batch request to `/cart/add.js` with each chosen variant as its own line item, each tagged with hidden line-item properties (`_bundle_id`, `_bundle_set`). The shell product ID is never sent. |
| BN-11 | After adding, the script dispatches a standard cart-updated event so theme cart drawers refresh. |
| BN-12 | A **Shopify Discount Function** applies the set discount at cart and checkout when all required components sharing a `_bundle_id` are present. The discount lives in Shopify, so it works even if Userelay is offline. |
| BN-13 | If a component is removed from the cart, the set discount for that bundle instance no longer applies (see edge cases, 6.4). |
| BN-14 | Shell products and sets stay in sync with their components: if a component is deleted, archived or out of stock, the set is flagged and (configurably) hidden. |
| BN-15 | Set analytics (post-MVP): views, add-to-cart, orders, revenue, and AOV lift. |

### 6.4 Bundles edge cases (to resolve in tech spec)

- Two instances of the same set in one cart (each has its own `_bundle_id`).
- Two different sets that share a component product.
- A component quantity changed or removed in the cart.
- Partial returns and refunds of a single component (discount allocation is by line, so each line refunds at its discounted price).
- Component price changes after the set is published (percentage and fixed-set-price behavior).
- Currency: markets with different currencies and rounding.
- Draft orders, POS and wholesale channels (out of scope for MVP; confirm behavior).
- Discount stacking with other automatic discounts and codes.

### 6.5 Owner admin

| ID | Requirement |
|---|---|
| A-1 | Restricted to owner-role users. Separate route group with its own auth checks. |
| A-2 | **Clients:** searchable list of accounts and stores with plan, status, installed apps, and last activity. Detail view with subscription history. |
| A-3 | **Support tools:** view a client's sets and errors; impersonate (read-only by default; every use is audit-logged). |
| A-4 | **Apps:** create and edit apps (name, slug, status: live / coming soon / hidden). |
| A-5 | **Plans:** create and edit each app's plans, prices (mapped to the billing vendor's price IDs), limits and feature flags. |
| A-6 | **Revenue and health:** MRR, new / churned subscriptions, failed payments, webhook failures, sync errors. |
| A-7 | **Audit log** of admin actions. |

---

## 7. Technical architecture

### 7.1 Stack

| Layer | Choice |
|---|---|
| Web app (marketing, customer app, admin) | Next.js (App Router), TypeScript, Tailwind |
| Database and auth | Supabase (PostgreSQL), Row-Level Security by `store_id` / `account_id` |
| Jobs, rate limiting, API quota | Upstash Redis (queue plus Shopify cost-aware throttling) |
| Shopify integration | Shopify app with OAuth; Admin GraphQL API; webhooks |
| Pricing logic | Shopify Function (Discount) deployed as an app extension |
| Storefront | Theme app embed loading one lightweight script (Preact / vanilla TS, built with Vite, served from a CDN) |
| Billing | Paddle or Lemon Squeezy (Merchant of Record) |
| Hosting | Vercel (web), CDN for the script |

### 7.2 Shopify scopes (initial)
`read_products`, `write_products`, `write_discounts`, `read_discounts`, `read_inventory`. Storefront access for availability: unauthenticated Storefront API product-inventory read. Additional scopes (for example publications / sales channels) to be confirmed in the tech spec.

### 7.3 Why a Discount Function
Basic automatic discounts apply to products or collections with minimum requirements and cannot express "these specific variants were added together as one bundle", nor a fixed set price or a proportionally distributed fixed amount. A Discount Function runs inside Shopify, reads the `_bundle_id` line-item properties, and computes the discount per line. It also removes the dependency on Userelay's servers at checkout.

### 7.4 Data flow (Bundles)
1. Merchant publishes a set → backend creates the shell product, writes `$app:bundle_recipe`, and stores discount configuration for the Function (metafield or Function configuration).
2. Shopper opens the shell product page → script reads the recipe, renders pickers, checks availability.
3. Shopper clicks Add → script posts the component variants with `_bundle_id` to `/cart/add.js`.
4. Cart and checkout → the Function applies the discount.
5. Order is created with normal line items → warehouse, 3PL and inventory see standard SKUs.

### 7.5 Core data model (draft)

```
accounts(id, name, created_at)
users(id, account_id, email, role[owner|member], created_at)
stores(id, account_id, shop_domain unique, access_token_encrypted, currency_code,
       status[connected|disconnected], installed_at)
apps(id, slug unique, name, status[live|coming_soon|hidden], description)
plans(id, app_id, slug, name, price_cents, interval, billing_price_id,
      limits jsonb, features jsonb)
subscriptions(id, store_id, app_id, plan_id, status[trialing|active|past_due|cancelled],
              billing_customer_id, billing_subscription_id, current_period_end)
webhook_events(id, source, event_id unique, received_at, processed_at, status)
audit_log(id, actor_user_id, action, target_type, target_id, meta jsonb, created_at)

-- Bundles app
bundle_sets(id, store_id, shopify_product_gid, title, discount_type
            [percentage|fixed_amount|fixed_price], discount_value,
            status[draft|active|archived], created_at)
bundle_components(id, set_id, shopify_product_gid, allowed_variant_gids jsonb,
                  display_order)
```

Platform tables are shared; each app owns its own tables prefixed by app (for example `bundle_*`).

---

## 8. Non-functional requirements

| Area | Requirement |
|---|---|
| **Storefront weight** | Script ≤ 5 KB gzipped (target ~3 KB); async, non-blocking; no measurable impact on LCP / INP / CLS. |
| **Latency** | Widget initialization ≤ 150 ms from CDN cache. |
| **Checkout independence** | Discounts are computed by the Shopify Function; checkout must not depend on Userelay servers. |
| **Graceful degradation** | If the API or script fails, the shell page falls back to standard theme behavior with no unhandled errors, and the page never freezes. |
| **Security** | Access tokens encrypted at rest (AES-256-GCM). All webhooks verify signatures (HMAC-SHA256 for Shopify; vendor signature for billing). RLS on every tenant table. Admin routes role-checked server-side. Secrets only in environment config. |
| **Reliability** | Idempotent webhook processing, retry with exponential backoff, dead-letter queue, rate-limit aware Shopify calls. |
| **Privacy and compliance** | Shopify mandatory privacy webhooks (customer data request, customer erasure, shop erasure); data retention policy; privacy policy and terms. |
| **Observability** | Structured logs, error tracking, alerting on webhook failures and sync errors. |
| **Accessibility** | WCAG AA contrast and keyboard-operable controls on all Userelay UI. |

### Testing requirements
- Unit tests for discount math (all three models, rounding, multi-quantity) and plan gating.
- Integration tests for OAuth install, uninstall, and webhook replay.
- A dedicated **Shopify development store** for end-to-end tests of the full add-to-cart, checkout and order flow.
- A manual 3PL-style check: confirm the order export contains only component SKUs.

---

## 9. Design direction

**Style:** Swiss minimal with an earthy editorial voice. Strict grid, hairline rules, generous whitespace, type-led.

| Token | Value |
|---|---|
| Page (cream) | `#F3EFE8` |
| Surface (paper) | `#FBF9F5` |
| Fill (sand) | `#E8E2D6` |
| Borders (rule) | `#D8D1C4` |
| Muted text (stone) | `#5C574F` |
| Ink (charcoal) | `#1F1E1C` |
| Accent (terracotta) | `#A8431F` |
| Status: active / trial / past due | green `#4F6B3A` on `#E3EAD8`; ink on sand; terracotta on `#F3DDD2` |

**Type:** Geist (headlines and UI), Geist Mono (labels, numbers, status tags), Instrument Serif italic as a single accent word in headlines.
**Components:** slightly rounded (6px controls, 10px cards), flat, 1px borders, no shadows. Buttons: terracotta primary, charcoal dark, outline secondary.
**Voice:** confident and editorial, plain and specific.
**Reference:** the Userelay canvas (landing page and component sheet).

---

## 10. Pricing and plans (Bundles)

Prices are **to be decided**. Proposed structure from v1.0:

| Plan | Included |
|---|---|
| **Starter** | Up to 3 active sets; all discount types |
| **Pro** | Unlimited sets; in-cart upsell triggers; custom CSS |
| **Scale** | Unlimited sets; high-throughput queues; priority support |

Free trial length and per-store vs per-account billing: open questions.

---

## 11. Success metrics

| Area | Metric |
|---|---|
| Fulfillment integrity | Zero 3PL / SKU-mapping incidents attributable to bundle orders |
| Onboarding | Median time from signup to first published set < 5 minutes |
| Storefront | Script ≤ 5 KB gzipped; no regression in Core Web Vitals |
| Reliability | Checkout discount success rate; webhook processing success; zero lost billing events |
| Business | MRR growth; month-2 cohort retention; Starter-to-Pro upgrade rate |
| Merchant outcome | AOV lift on stores actively merchandising several sets |

Targets for the business metrics (retention, upgrade rate, AOV lift) should be set after the first cohort of merchants; v1.0's figures were aspirational.

---

## 12. Roadmap

| Phase | Scope |
|---|---|
| **0: Foundations** | Shopify Partner account, dev store, billing vendor decision, domain and branding |
| **1: Platform** | Marketing site, auth, accounts, store connect, app list, plans, billing integration, owner admin (clients, apps, plans) |
| **2: Bundles MVP** | Set builder, shell product, storefront script, Discount Function, entitlement gating, privacy webhooks |
| **3: Hardening** | Edge cases (6.4), tests on dev store, observability, beta merchants |
| **4: Launch** | Public landing page, onboarding guide, support process |
| **Later apps** | Export (bulk catalog / order / metafield export), Cart drawer and upsell, Insights (cross-app analytics) |

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| Discount Function limits (number of lines, rounding, stacking) | Prototype early on a dev store; document supported scenarios. |
| Selling outside the App Store (trust, install friction, Shopify policy) | Confirm distribution options and policy constraints before launch; clear install guidance. |
| Merchant of Record vendor fit for SaaS sold to Shopify merchants (fees, payouts, country support) | Decide vendor in Phase 0; keep billing behind an interface. |
| Theme compatibility (cart drawers, custom product templates) | Theme app embed plus a tested compatibility list; graceful fallback. |
| Shell product appears in search, feeds and collections | Define how shells are published (sales channels, tags, SEO) and how they are kept out of unintended feeds. |
| Inventory display on the shell page | Compute availability from components only; never rely on the shell's own inventory. |

---

## 14. Open questions

1. **Billing vendor:** Paddle or Lemon Squeezy? Both are Merchants of Record; confirm fees and payout support for your country.
2. **Distribution:** unlisted/custom distribution through our own install link is assumed. Confirm it fits your plan for scale, or whether an App Store listing is wanted later.
3. **Trial:** length and whether a card is required.
4. **Billing unit:** per store per app, or per account?
5. **Shell product visibility:** should shells be hidden from collections, search and feeds by default, or fully merchandisable?
6. **Currency and markets:** which Shopify Markets behaviors must the discount support at launch?
7. **Dev environment:** do you already have a Shopify Partner account and a dev store?
8. **Brand:** final name confirmation (Userelay), domain, and logo mark.
9. **Support:** channel and expected response targets.

---

## 15. Appendix: v1.0 requirement mapping

| v1.0 | v2.0 |
|---|---|
| FR-1.1, 1.3, 1.4 (OAuth, verify, setup guide) | P-2, P-3, section 5.2 step 7 |
| FR-1.2 (manual token) | Dropped for MVP |
| FR-2.1–2.4 (set creation, variants, pricing, shell) | BN-1 to BN-4 |
| FR-2.5 (automatic discount) | BN-12 (Discount Function) |
| FR-3.1–3.6 (storefront flow) | BN-8 to BN-11, BN-5 |
| FR-4.1–4.4 (billing, gating, cancellation) | B-1 to B-5 |
| Non-functional requirements | Section 8 |
| Data schema (stores, virtual_sets, set_components) | Section 7.5 (extended for accounts, apps, plans, subscriptions) |
| Roadmap phases 2–4 | Section 12 (Export, Cart drawer, Insights) |
