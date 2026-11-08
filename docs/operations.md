# Operating Klyroo

## Settings that need your action (not code)

1. **Supabase email (important).** Follow [resend-setup.md](resend-setup.md). Supabase's built-in sender is limited to a few emails an hour and is for testing only.
2. **Redirect URLs.** Supabase > Authentication > URL Configuration: Site URL `https://useklyroo.com`, and add `https://useklyroo.com/auth/callback` to Redirect URLs.
3. **Optional, better reset emails.** The default reset link only works in the browser that asked for it. To work on any device, edit Supabase > Authentication > Email Templates > Reset Password and set the link to
   `{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=recovery`. Do the same for Confirm signup with `&type=signup`.
4. **Backups.** The free Supabase plan has no downloadable backups. Before taking live payments, move to a paid plan with daily backups (and point-in-time recovery if you can).
5. **Error alerts.** Create a Slack or Discord incoming webhook and set `ERROR_WEBHOOK_URL`. Server errors, failed webhooks, crashed exports and failed redirects are posted there (max 10 a minute). They are always in the Render logs too.
6. **Owner admin.** Set `ADMIN_EMAILS=you@yourdomain.com` (comma separated). `/admin` shows accounts, paid subscriptions, failed exports and webhook errors. Everyone else gets a 404.
7. **Render.** Keep the cron job calling `POST /api/tick` every 5 minutes with `Authorization: Bearer <TICK_SECRET>`. It keeps the service awake, requeues stuck exports and purges old rows.

## Checks to run

| Command | What it checks |
|---|---|
| `npm run check:env` | Required settings are present and consistent (`-- --production` adds live-mode checks) |
| `npm run db:audit` | Row level security, grants, function access, indexes |
| `npm run check:launch` | Public pages meet Dodo's verification guidance |
| `npm run test:*` | The test suites (export, billing, ui, billing-ui, apps, account, dodo) |

## Retention

Webhook records 180 days, export step logs 90 days, export files 7 days. Deleted accounts are removed completely (billing records stay with Dodo).
