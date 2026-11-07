# Paddle prompts for Klyroo

These replace the generic Paddle prompts. They describe what Klyroo already has, so an assistant doesn't rebuild it.
Run them in order, with the `paddle-sandbox` MCP connected (see "Setup" below).

## What already exists in the code

| Paddle prompt | Klyroo status |
|---|---|
| Pricing page with checkout | Done. `/pricing` shows the plans. Each app's Billing page (`/export/billing`, `/qr/billing`) opens Paddle.js overlay checkout. |
| Webhook with signature check | Done. `src/app/api/paddle`, `src/lib/billing/webhook.ts`. Raw body, HMAC-SHA256, 5-minute tolerance, non-2xx on failure, idempotent upserts. |
| Mirror state and access helper | Done. `subscriptions` is unique per (account, app). `src/lib/billing/entitlements.ts` grants access for `active`, `trialing` and `past_due`. A scheduled cancel does not remove access. |
| Customer portal | Done. Billing page "Manage billing" opens a Paddle portal session. |
| Catalog | Script ready: `npm run paddle:catalog`. |

## Catalog (decided)

One Paddle product per paid plan, one monthly GBP price each, all with a 3-day free trial. Free plans are not in Paddle.

| Product | Price (GBP / month) | Amount string | Env var |
|---|---|---|---|
| Klyroo Export Starter | £19 | `"1900"` | `PADDLE_PRICE_EXPORT_STARTER` |
| Klyroo Export Growth | £49 | `"4900"` | `PADDLE_PRICE_EXPORT_GROWTH` |
| Klyroo Export Scale | £99 | `"9900"` | `PADDLE_PRICE_EXPORT_SCALE` |
| Klyroo QR Pro | £20 | `"2000"` | `PADDLE_PRICE_QR_PRO` |
| Klyroo QR Business | £45 | `"4500"` | `PADDLE_PRICE_QR_BUSINESS` |

Annual prices are not offered yet. Tell the assistant if you want them (and the discount) before running the catalog.

## Setup

1. In Claude Code run:
   `/plugin marketplace add anthropics/claude-plugins-community`
   then `/plugin install paddle@claude-community`.
2. Connect the Paddle MCP to your **sandbox** account (and later a second one for live). I cannot do this step for you.
3. In Paddle sandbox (sandbox-vendors.paddle.com) go to Developer tools > Authentication:
   - create an **API key** with permissions for products, prices, notification settings, customers, subscriptions, transactions and checkout settings;
   - create a **client-side token** (starts `test_`).

## Prompt 1: catalog (sandbox)

> Create Klyroo's catalog in my Paddle sandbox, in GBP. Create one product per paid plan (five products, listed in docs/paddle-prompts.md), tax category standard, each with a single monthly price in GBP and a 3-day free trial (`trial_period`: 3 days). Amounts are lowest-denomination strings. Do not create products for Free plans. Reuse what already exists rather than duplicating. When done, list every product and price with its Paddle ID as `PADDLE_PRICE_*=pri_...` lines.

Without the MCP: `PADDLE_API_KEY=pdl_sdbx_... npm run paddle:catalog` does the same and prints the env lines.

## Prompt 2: configuration and webhook (sandbox)

> Klyroo's checkout, webhook handler, subscription mirror and customer portal are already built (see docs/paddle-prompts.md). Do not rebuild them. Using the paddle-sandbox MCP: (1) create a notification destination pointing at `https://useklyroo.com/api/paddle` for subscription.created, activated, updated, canceled, past_due, paused, resumed, trialing, and for customer.created, customer.updated and transaction.completed, and give me the signing secret for `PADDLE_WEBHOOK_SECRET`; (2) set the default payment link to `https://useklyroo.com/pricing`; (3) read my checkout payment methods, tax mode and balance currency, tell me what they are, and ask before changing anything. Never delete the destination, products, prices, customers, subscriptions or transactions.

Note: the destination must be reachable, so deploy first. Klyroo's app reads `NEXT_PUBLIC_PADDLE_ENV`; set it explicitly to `sandbox` or `production` in Render.

## Prompt 3: test everything (sandbox)

> Test Klyroo's Paddle integration end to end in sandbox, in order. (1) Confirm `NEXT_PUBLIC_PADDLE_ENV=sandbox`, a `test_` client token, API calls to sandbox-api.paddle.com, and a sandbox destination. (2) Guide me through a purchase of Klyroo Export Growth with card 4242 4242 4242 4242 and a decline with 4000 0000 0000 0002; check the 3-day trial shows, the webhook returned 2xx, and the `subscriptions` row for my account and the `export` app has status `trialing` and the right plan. (3) Check delivery under Events > Notifications. (4) With the MCP: (a) change Export Growth to Export Scale with `do_not_bill` and confirm the row shows the new price; (b) schedule cancellation for `next_billing_period` and confirm status is still active/trialing with access kept; (c) cancel immediately and confirm status `canceled` and the account falls back to the Free plan. Also confirm buying QR Pro does not change the Export subscription. Stop and fix on any failure. Use my database MCP (Supabase) to check rows. Do not delete anything except a throwaway test artifact, after asking me.

## Prompt 4: go live

> Take Klyroo live. Use paddle-sandbox as source and paddle-live as destination. (1) Recreate the five products and monthly GBP prices with the 3-day trial in live; give me the new `PADDLE_PRICE_*` env lines (price IDs live in env vars, not in code, so nothing needs find-and-replace). (2) Help me create a live client token (`live_`), a live API key, and a live notification destination at `https://useklyroo.com/api/paddle` with its secret, and set `NEXT_PUBLIC_PADDLE_ENV=production` in Render. (3) Once the domain is approved, set the default payment link to `https://useklyroo.com/pricing`. (4) Audit readiness with `npm run check:launch`: terms, privacy and refund pages, product description, contact details, pricing matches live Paddle, domain resolves. (5) Then tell me to continue at vendors.paddle.com.

Skip the Paddle Retain `pwCustomer` step unless you subscribe to Retain.
Webhook IP allowlist: Render's free tier has no IP firewall, so signature verification is the protection. This is fine; the signature check already rejects anything not sent by Paddle.

## What only you can do

1. Connect the Paddle MCP (steps above) or give me nothing; do not paste keys in chat.
2. Put the API key and client token in `web/.env.local` and in Render (Environment tab). Never commit them.
3. Fill your legal name, address, country and governing law (`src/lib/company.ts`).
4. Submit useklyroo.com under Paddle > Settings > Website approval (no API).
5. Finish Paddle verification (identity and bank details) at vendors.paddle.com.
