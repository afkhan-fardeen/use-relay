# Render environment variables

Set these in Render > your service (`userelay`) > **Environment**, then **Save, rebuild and deploy**.
`NEXT_PUBLIC_*` values are baked in at build time, so a new deploy is needed after changing them.
Copy secret values from your local `web/.env.local` (never paste them in chat or commit them). `render.yaml` holds the same list.

## Required

| Key | Value | Secret? |
|---|---|---|
| `NODE_VERSION` | `24` | no |
| `NEXT_PUBLIC_SITE_URL` | `https://useklyroo.com` | no |
| `NEXT_PUBLIC_SUPABASE_URL` | from `.env.local` | no |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | from `.env.local` | no (public by design) |
| `SUPABASE_SERVICE_ROLE_KEY` | from `.env.local` | **yes** |
| `MASTER_KEY` | from `.env.local` (32 random bytes, base64). Changing it makes saved Shopify secrets unreadable | **yes** |
| `TICK_SECRET` | from `.env.local`; the same value is in the cron-job.org `Authorization: Bearer ...` header | **yes** |
| `ADMIN_EMAILS` | `afkhan.fardeen@gmail.com` | no |

## Billing (Dodo Payments)

| Key | Value | Secret? |
|---|---|---|
| `DODO_PAYMENTS_ENVIRONMENT` | `test_mode` now; `live_mode` after verification | no |
| `DODO_PAYMENTS_API_KEY` | from `.env.local` (a `dodo_test_...` key in test mode) | **yes** |
| `DODO_PAYMENTS_WEBHOOK_KEY` | from `.env.local` (`whsec_...`) | **yes** |
| `DODO_PRODUCT_EXPORT_STARTER` | `pdt_0NrPysHU8uVpSOa3QYvBu` | no |
| `DODO_PRODUCT_EXPORT_GROWTH` | `pdt_0NrPysMqaQnbNS1r8CcyJ` | no |
| `DODO_PRODUCT_EXPORT_SCALE` | `pdt_0NrPysRTfFH5RCfQp0Qgs` | no |
| `DODO_PRODUCT_QR_PRO` | `pdt_0NrPysV3156gQDM6BtqGi` | no |
| `DODO_PRODUCT_QR_BUSINESS` | `pdt_0NrPysZFeKUzcVdJWLp5A` | no |

## Optional

| Key | Value |
|---|---|
| `ERROR_WEBHOOK_URL` | Slack or Discord incoming webhook URL, for error alerts |
| `SHOPIFY_API_VERSION` | leave unset (defaults to `2026-10`) |

## Do NOT set on Render

`DATABASE_URL` and `SUPABASE_CA_PATH` (only for running migrations from your computer), `DODO_API_BASE` and `SHOPIFY_TEST_ORIGIN` (tests only), and the old `PADDLE_*` / `NEXT_PUBLIC_PADDLE_*` keys (delete them if they exist).

## Going live later

Change only these: `DODO_PAYMENTS_ENVIRONMENT=live_mode`, the live `DODO_PAYMENTS_API_KEY`, the live `DODO_PAYMENTS_WEBHOOK_KEY` (from the live webhook endpoint), and the five live `DODO_PRODUCT_*` IDs from `npm run dodo:catalog` run in live mode.

## Check it

After deploy: `curl https://useklyroo.com/api/health` returns `{"ok":true}`; a POST to `/api/dodo/webhook` with no signature returns 401 (not 503, which means the webhook key is missing). Locally, `npm run check:env -- --production` checks your `.env.local` against the same list.
