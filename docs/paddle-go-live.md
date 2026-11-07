# Going live with Paddle, and how the domain is set up

## Domain layout (decision)

One domain, paths per app. Keep it this way for now.

| URL | What |
|---|---|
| `useklyroo.com` (and `www`, which redirects) | Company home, `/apps/export`, `/apps/qr`, `/pricing`, legal pages |
| `useklyroo.com/export`, `/qr`, `/account` | The signed-in apps and shared account |
| `useklyroo.com/api/...` | Paddle webhook, health check, scheduler |

Why not subdomains (`app.`, `export.`, `bundles.`, `api.`)?
- **Paddle approves each domain you take payments on.** One domain means one approval, not four.
- **Login:** one origin means one sign-in session. Separate subdomains need shared-cookie and redirect setup for every one of them.
- **Hosting:** a single Render service. Subdomains mean more services, more certificates, more settings to keep in sync.
- **Search:** one domain concentrates search ranking.
- Bundles and Cart are not Klyroo apps today. The apps are Export and QR.

Move to subdomains only if an app needs its own infrastructure. The first likely one is the QR **redirect service**, which should live on a separate short domain anyway (see `qr-app-plan.md`).

## Support email

`support@useklyroo.com`. Spaceship's mail servers are already set on the domain (MX and SPF exist). To finish:
1. In Spaceship → Email, create the mailbox `support@useklyroo.com`.
2. Send yourself a test email in and out.
3. Later, use that mailbox's SMTP settings as Supabase's custom SMTP so sign-up emails come from your domain.

## Paddle go-live checklist

Run `npm run check:launch` at any time. It checks Paddle's published requirements against the live site.

1. **Fill in `src/lib/company.ts`:** legal name, registered address, country and governing law. Paddle requires the seller's legal name in the Terms and Privacy policy. Then deploy.
2. **Review the three policy pages with a lawyer.** They are a solid starting draft written for how Klyroo works, not legal advice.
3. **Run `npm run check:launch`.** All checks must pass.
4. **Paddle dashboard (live account):**
   - Complete business and identity verification.
   - Settings → Website approval: submit `https://useklyroo.com`. One domain covers everything.
   - Paddle reviews the site: product description, pricing, Terms, Privacy and Refund pages, HTTPS.
5. **Test in the sandbox first** (see `billing-setup.md`).
6. **Switch to live:** create the live catalog and keys, set `NEXT_PUBLIC_PADDLE_ENV=production` and the live values on Render, redeploy, and run one real payment.
