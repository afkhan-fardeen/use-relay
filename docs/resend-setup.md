# Email setup with Resend (sign-up and password-reset emails)

Supabase sends the emails (confirm sign-up, reset password). Resend is the delivery service behind it, so they actually reach inboxes. About 30 minutes, plus DNS waiting time.

## 1. Create the Resend account and add your domain

1. Sign up at **resend.com** (free plan: 3,000 emails a month, 100 a day, enough to launch).
2. **Domains > Add Domain**, enter `useklyroo.com`. Choose the region closest to your customers (Ireland / `eu-west-1` for the UK and EU).
3. Resend shows DNS records, normally:
   - a **TXT** record `resend._domainkey` (DKIM, a long value),
   - an **MX** record on `send` (for bounces) and a **TXT** SPF record on `send`.

## 2. Add the records in Spaceship

Spaceship > your domain `useklyroo.com` > **Advanced DNS** > Add record. Copy each record exactly as Resend shows it:

| Type | Host (Spaceship field) | Value |
|---|---|---|
| TXT | `resend._domainkey` | the long `p=...` value from Resend |
| MX | `send` | `feedback-smtp.<region>.amazonses.com`, priority `10` |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:support@useklyroo.com` (you add this one yourself; it tells receivers how to treat mail and sends you reports) |

Notes:
- In Spaceship enter only the host part (`resend._domainkey`, `send`), not the full domain.
- Do not touch the existing records that point the site at Render.
- These records are on the `send` subdomain and a DKIM name, so they don't clash with a mailbox for `support@useklyroo.com` on the main domain.
- Back in Resend click **Verify**. It can take a few minutes up to a few hours. Wait until the domain shows **Verified**.

## 3. Create an API key

Resend > **API Keys > Create**: name `supabase-smtp`, permission **Sending access**, domain `useklyroo.com`. Copy the key (starts `re_`). It's shown once. Never put it in code or chat.

## 4. Connect Supabase to Resend

Supabase > **Authentication > Emails > SMTP Settings** > enable **Custom SMTP**:

| Field | Value |
|---|---|
| Sender email | `noreply@useklyroo.com` |
| Sender name | `Klyroo` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | your `re_...` API key |

Save. Then **Authentication > Rate Limits** and raise "emails sent per hour" (the default with custom SMTP is low; 30 to 100 is fine to start).

## 5. Use the branded email templates

Supabase > **Authentication > Emails > Templates**:

1. **Confirm sign up**: subject `Confirm your Klyroo email`, paste [email-templates/confirm-signup.html](email-templates/confirm-signup.html).
2. **Reset password**: subject `Reset your Klyroo password`, paste [email-templates/reset-password.html](email-templates/reset-password.html).

These use `token_hash` links, so the link works on any device (phone, other browser). The logo is `https://useklyroo.com/brand/klyroo-email.png`, hosted by the site, so deploy first.

## 6. Check the redirect settings

Supabase > **Authentication > URL Configuration**: Site URL `https://useklyroo.com`; Redirect URLs include `https://useklyroo.com/auth/callback`.

## 7. Test

1. Create an account with a real address you own (Gmail works). The confirmation email should arrive within a minute with the Klyroo logo, from `Klyroo <noreply@useklyroo.com>`.
2. Click the link: you land in the app.
3. Log out, use **Forgot your password?**, check the email, set a new password.
4. In Gmail open the message > "Show original": SPF, DKIM and DMARC should all say **PASS**.
5. In Resend > **Emails** you can see each message and whether it was delivered or bounced.

## If something goes wrong

| Problem | Fix |
|---|---|
| Domain stays "Pending" | A record was copied wrongly or the host contains the domain twice (`send.useklyroo.com.useklyroo.com`). Re-check in Spaceship. |
| "Error sending confirmation email" in the app | Wrong SMTP password/port, or the domain isn't verified yet. |
| Emails go to spam | Wait for DKIM/SPF to show pass, keep `p=none` DMARC for now, don't send test emails to throwaway addresses. |
| Link says expired | Links work once. Ask for a new one. |
| Nothing arrives, no error | Check Resend > Emails for a bounce reason; check the Supabase rate limit. |

## Support inbox (separate from sending)

Resend only sends. To **receive** mail at `support@useklyroo.com`, use Spaceship's email product (Spacemail) or its free email forwarding to your own inbox. Reply-to on app emails is the same address, so customers can answer. Set it up before submitting the site to Dodo; reviewers may email it.
