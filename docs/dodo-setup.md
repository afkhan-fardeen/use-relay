# Billing with Dodo Payments

Dodo Payments is our Merchant of Record (it collects payment and tax, issues invoices and sends refunds).
Klyroo Export is the only app today. Plans: Starter £19, Growth £49, Scale £99.
All paid plans are monthly, in GBP, with a 3-day free trial. Free plans are not in Dodo.

## How it works in the code

| Piece | Where |
|---|---|
| Catalog script | `npm run dodo:catalog` (`scripts/dodo-catalog.mjs`), idempotent |
| Product IDs | env `DODO_PRODUCT_<APP>_<PLAN>` |
| Checkout | server action `startCheckout` creates `POST /checkouts` and redirects to the hosted page; the account id is signed into the metadata |
| Webhook | `POST /api/dodo/webhook` (Standard Webhooks: `webhook-id`, `webhook-timestamp`, `webhook-signature`), idempotent, order-safe |
| Access | `src/lib/billing/entitlements.ts`. `active` (includes the trial) and `past_due` keep access; a scheduled cancel (`cancel_at_next_billing_date`) keeps access; `cancelled`, `expired`, `failed`, `on_hold` and `paused` do not |
| Portal | `POST /customers/{id}/customer-portal/session` (payment method, invoices, cancel) |
| Plan change | `POST /subscriptions/{id}/change-plan` with `prorated_immediately` |

## Environment variables (Render and `.env.local`)

| Variable | Value |
|---|---|
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` or `live_mode`. No default: the app fails loudly if it is unset |
| `DODO_PAYMENTS_API_KEY` | API key for that mode |
| `DODO_PAYMENTS_WEBHOOK_KEY` | the webhook signing secret (`whsec_...`) |
| `DODO_PRODUCT_EXPORT_STARTER` / `_GROWTH` / `_SCALE` | `pdt_...` from the catalog script |
| `NEXT_PUBLIC_SITE_URL` | `https://useklyroo.com` (return URL after checkout) |

Billing stays "Free for now" until the key, the webhook secret and at least one product exist for that app.

## Verified end to end (test mode)

`npm run test:dodo` drives the real deployed site and Dodo test mode: checkout with the 3-day trial, test-card payment, signed webhook, access, customer portal, plan change, scheduled and immediate cancellation, and a declined card. It confirmed that checkout metadata (the signed account id) reaches the webhook.

Checkout may display prices in the buyer's local currency (Dodo's adaptive currency); the catalog price stays in GBP.

## Test mode checklist

1. `npm run dodo:catalog` and copy the printed `DODO_PRODUCT_*` lines to Render.
2. Create the webhook endpoint (dashboard: Developer > Webhooks, or `POST /webhooks`) with URL
   `https://useklyroo.com/api/dodo/webhook` and the `subscription.*` events. Copy its signing secret to `DODO_PAYMENTS_WEBHOOK_KEY`.
3. Redeploy, open Export > Billing, choose a plan and pay with a Dodo test card.
4. Confirm the plan activates, the trial shows, and Manage billing opens the portal.
5. Cancel in the portal: access continues until the period ends. Cancel immediately from the Dodo dashboard: access ends.

## Going live

1. Dodo dashboard > Verification: choose **Individual**, submit the Product Information form (your site must show pricing, Terms, Privacy, Refund and cancellation policy and a contact route), complete ID verification (KYC) and bank details. Reviews usually take 1-3 business days. Run `npm run check:launch` first.
2. Run `DODO_PAYMENTS_ENVIRONMENT=live_mode DODO_PAYMENTS_API_KEY=<live key> npm run dodo:catalog` (the script reads `.env.local`; pass the live key inline instead).
3. Create the live webhook endpoint, set the five `DODO_PRODUCT_*`, the live key and secret, and `DODO_PAYMENTS_ENVIRONMENT=live_mode` on Render, then redeploy.
4. Take one real payment of your own and refund it.

Refunds: Dodo refunds are started from the Dodo dashboard (Payments > refund). Our refund policy tells customers to email support, and you issue the refund there.
