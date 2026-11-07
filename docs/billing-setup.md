# Billing setup (Paddle sandbox)

Billing is off until the variables below are set. With them unset, everyone is on the free beta
(30 exports an hour, 250k rows, 5 stores) and each app's Billing page says "Free during the beta".
Billing is switched on per app: Export turns on when its prices are set; QR stays free until it has its own.

## 1. In the Paddle **sandbox** dashboard (sandbox-vendors.paddle.com)

1. **Catalog → Products:** create one product per Klyroo app. For **Klyroo Export** create three recurring monthly prices in GBP:
   Starter £19, Growth £49, Scale £99. (Klyroo QR gets its own product later: Pro £20 and Business / API £45, with env `PADDLE_PRICE_QR_PRO` and `PADDLE_PRICE_QR_BUSINESS`; each app bills separately.). Copy each price ID (`pri_...`).
2. **Developer tools → Authentication:**
   - create a **client-side token** (`test_...`)
   - create an **API key** with these permissions: `customer.read`, `customer_portal_session.write`,
     `subscription.read`, `subscription.write`.
3. **Developer tools → Notifications:** add a destination.
   - URL: `https://useklyroo.com/api/paddle/webhook`
   - Events: `subscription.created`, `subscription.activated`, `subscription.updated`,
     `subscription.canceled`, `subscription.past_due`, `subscription.paused`,
     `subscription.resumed`, `subscription.trialing`
   - Copy the destination's **secret key**.
4. **Checkout → Checkout settings:** set the default payment link to `https://useklyroo.com/export/billing`.

## 2. Environment variables (Render → Environment)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_PADDLE_ENV` | `sandbox` |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | the `test_...` client token |
| `PADDLE_API_KEY` | the sandbox API key |
| `PADDLE_WEBHOOK_SECRET` | the notification destination secret |
| `PADDLE_PRICE_EXPORT_STARTER` | `pri_...` (Export, Starter) |
| `PADDLE_PRICE_EXPORT_GROWTH` | `pri_...` (Export, Growth) |
| `PADDLE_PRICE_EXPORT_SCALE` | `pri_...` (Export, Scale) |

`NEXT_PUBLIC_*` values are baked in at build time: redeploy after changing them.

## 3. Test

Open Export → Billing, choose a plan, pay with Paddle's sandbox test card (4242 4242 4242 4242, any future
date, any CVC). The plan should activate within seconds. Cancel and plan changes use the
"Manage" button and the Switch buttons.

## 4. Going live (later)

Create a live Paddle account, repeat step 1 there, change `NEXT_PUBLIC_PADDLE_ENV` to `production`
and replace every value above with the live ones. Paddle also needs approved domain, terms, privacy
policy and refund policy pages before it will take real payments.
