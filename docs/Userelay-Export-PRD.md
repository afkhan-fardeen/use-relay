# Userelay Export: Product Requirements Document

**Version:** 1.0
**Status:** Draft for review
**Date:** 2026-11-06
**Owner:** Fardeen
**Parent:** Userelay, the company and platform (see `Userelay-PRD.md`). Export is the first tool on the platform.
**Supersedes:** `Userelay-Funnel-PRD.md` (Funnel is dropped for now).
**Working name:** Userelay Export (see open questions).

---

## 1. Summary

**Userelay** is the company and platform. A merchant has one Userelay account, connects their Shopify store, and uses tools from the Userelay suite. **Userelay Export** is the first tool: a bulk data exporter for Shopify, in the same category as Matrixify. It lets merchants and agencies export products, variants, collections, customers, orders, inventory, metafields and more to Excel or CSV, run exports on a schedule, and deliver files to Google Drive, Dropbox, SFTP or email, without writing code or using the Admin API.

**Scope of this PRD:** export first. Import and bulk update (the other half of Matrixify) are phase 2 and are listed as roadmap only.

### Positioning
Matrixify is powerful but dense and priced by volume and features. Userelay Export aims to be the easy version for everyday jobs: ready-made templates, a clear export builder, sensible defaults, and plain pricing. The goal is not feature parity on day one. The goal is to make the 80% of exports (catalog, orders for 3PL or accounting, customers for email, inventory) take under two minutes.

---

## 2. Problem statement

1. **Shopify's built-in export is limited.** It exports a fixed set of columns, only some resources, no metafields for many entities, no scheduling, and no delivery to external destinations.
2. **Operations teams live in spreadsheets.** 3PLs, accountants, marketplaces, ERPs and email tools all want files in specific formats on a schedule.
3. **Existing tools have a steep learning curve.** Merchants hit complex column names, many options and volume-based plans before they get a first useful file.
4. **Large stores break naive exports.** API rate limits and timeouts make exports of tens of thousands of products or orders fail unless the tool uses bulk operations and background jobs.

---

## 3. Goals and non-goals

### Goals (MVP)
- A merchant connects a store and downloads a first export in under 3 minutes.
- Export the core resources with all standard fields plus metafields (section 6.3).
- Ready-made **templates** for common jobs (3PL orders, full catalog, inventory by location, customer list, abandoned-style product audit).
- A **custom export builder**: choose resource, filters, columns, order and format; save as a template.
- **Scheduled exports** (hourly, daily, weekly, monthly, custom time) with delivery to email, Google Drive, Dropbox and SFTP.
- Reliable exports on large stores through Shopify bulk operations and background workers.
- Export history with re-download and clear failure messages.
- Platform: accounts, store connection, plans and billing, owner admin (shared with the suite).

### Non-goals (MVP)
- Import, bulk update and delete (phase 2).
- Store-to-store migration.
- Two-way sync and webhooks-driven live feeds.
- Non-Shopify platforms.
- Custom code, formulas or scripting inside exports.
- A public API for Userelay Export.

---

## 4. Personas

| Persona | Needs |
|---|---|
| **Store operator / merchandiser** | Pull the catalog or inventory into a spreadsheet, review it, share it. No code. |
| **3PL / warehouse manager** | Orders in a fixed column layout, delivered on a schedule to SFTP or email. |
| **Accountant / finance** | Orders, refunds, taxes and payouts per period in a consistent format. |
| **Agency / freelancer** | Run exports across many client stores and reuse templates. |
| **Userelay owner (admin)** | See clients, plans, job volume and errors; support merchants. |

---

## 5. Platform structure

Same three surfaces as the parent PRD:

| Surface | URL | Audience |
|---|---|---|
| Marketing site | `userelay.com` | Prospects. Landing, tool pages (Export), pricing. |
| Customer app | `app.userelay.com` | Merchants. Account, stores, tools, billing. |
| Owner admin | `admin.userelay.com` | Userelay team only. |

Userelay is the brand and account. Tools live inside it (Export now, others later). The current UI shell already built in `web/` is reused: it is rebranded from "Userelay Funnel" to Userelay with a tool switcher, and the Funnel pages are removed.

### Merchant journey
1. Land on the marketing site, click **Start free**.
2. Sign up and **connect a Shopify store**.
3. Land on **Export** with templates front and center.
4. Pick a template or build a custom export, run it, and download the file.
5. Optionally **schedule** it and add a destination.

---

## 6. Functional requirements

### 6.1 Accounts and stores (platform)

| ID | Requirement |
|---|---|
| P-1 | Sign up, log in, reset password, manage profile. |
| P-2 | Connect one or more Shopify stores. Scopes are read-only and requested per resource (see 8.2). |
| P-3 | On connection, verify the shop, store the domain and an encrypted token, and test API access. |
| P-4 | Disconnect flow: revoke stored credentials, cancel schedules, keep or delete files per merchant choice. |
| P-5 | Team members with roles (owner, member). Agencies can hold multiple stores under one account. |
| P-6 | Billing page: plan, usage, invoices, payment method, change or cancel. |

### 6.2 Plans, billing and limits

| ID | Requirement |
|---|---|
| B-1 | Subscriptions are per account with per-store limits. Billing runs behind a `BillingProvider` interface (vendor decision in open questions). |
| B-2 | Billing webhooks verify signatures and are idempotent. |
| B-3 | Plan limits are enforced server-side: stores, number of schedules, rows per export, history retention, destinations. |
| B-4 | On cancel or lapse: schedules pause, history stays readable for a retention period, nothing is deleted from the merchant's Shopify store (the tool is read-only). |
| B-5 | `past_due` has a grace period before schedules pause. |

### 6.3 Resources exported (MVP)

| Resource | Notes |
|---|---|
| **Products** | One row per variant. Standard fields, options, images, SEO, tags, vendor, type, status, collections, sales channels, inventory per location, cost, weight, barcode, metafields. |
| **Collections** | Smart and custom, with rules and product membership. |
| **Customers** | Standard fields, addresses, tags, marketing consent, order counts and totals, metafields. Subject to protected customer data rules. |
| **Orders** | Order, line items, shipping, discounts, taxes, transactions summary, fulfillment status, tags, notes, customer reference, metafields. Layout options: one row per line item or one row per order. |
| **Refunds and transactions** | For finance exports. |
| **Inventory** | Levels by location and SKU. |
| **Discounts** | Codes and automatic discounts. |
| **Metafields** | For any supported resource, selectable by namespace and key. |

Later: draft orders, gift cards, pages, blogs and articles, redirects, menus, files, locations, payouts.

### 6.4 Export builder

| ID | Requirement |
|---|---|
| EX-1 | Choose a resource, then see a live **preview** of the first 20 rows before running. |
| EX-2 | **Filters:** date ranges (created, updated, processed), status, tags, vendor, product type, collection, fulfillment and financial status, inventory thresholds, and "changed since last run" for incremental exports. |
| EX-3 | **Columns:** pick, reorder and rename columns; group by logical sections; search columns; include metafields by namespace and key. |
| EX-4 | **Formats:** CSV and Excel (.xlsx). Choices for delimiter, encoding (UTF-8 with or without BOM), date format, number format and header style. |
| EX-5 | **Layouts:** per-variant, per-order or per-line-item where relevant; option to split large exports into multiple files. |
| EX-6 | **Templates:** save any configuration as a template; ship built-in templates (section 6.5). |
| EX-7 | **Run now** and see progress, row counts and an estimated time on large exports. |
| EX-8 | **Result:** download file, copy a link (expiring), email it, or send to a destination. |
| EX-9 | Clear failure messages with the reason and a retry button. |
| EX-10 | Exports never change the store. |

### 6.5 Built-in templates

| Template | Contents |
|---|---|
| Full product catalog | All variants with core fields, images, SEO and inventory. |
| Inventory by location | SKU, variant, location, available, on hand, committed. |
| Orders for 3PL | Order, shipping address, line items with SKU and quantity, shipping method, notes. Fixed layout, optional SFTP delivery. |
| Orders for accounting | Orders with taxes, discounts, refunds and payment gateway per period. |
| Customer list for email | Name, email, consent, tags, order count, total spent. |
| Product audit | Missing images, missing alt text, zero-stock active products, missing SEO. |
| Price and cost sheet | SKU, price, compare-at, cost, margin. |
| Metafield dump | All metafields for a chosen resource. |

### 6.6 Scheduling and delivery

| ID | Requirement |
|---|---|
| SC-1 | Schedule any saved export: hourly, daily, weekly, monthly, or at a set time with time zone. |
| SC-2 | Incremental mode: only records created or updated since the last successful run. |
| SC-3 | **Destinations:** email, Google Drive, Dropbox, SFTP/FTP, secure download link. Later: Google Sheets, S3. |
| SC-4 | File naming templates (for example `orders_{YYYY-MM-DD}.csv`) and overwrite or keep-versions behavior. |
| SC-5 | Notifications on failure (email), with a one-click retry. Optional success notification. |
| SC-6 | Pause, resume and edit schedules. Runs missed during downtime are caught up once. |
| SC-7 | Destination credentials stored encrypted; connection test before saving. |

### 6.7 History and files

| ID | Requirement |
|---|---|
| H-1 | History lists every run: template, resource, status, rows, size, duration, trigger (manual or schedule), destination result. |
| H-2 | Files are retained per plan (for example 7, 30 or 90 days) and downloaded through expiring signed links. |
| H-3 | Re-run a past export with the same configuration. |
| H-4 | Delete a file early; deletion is permanent. |

### 6.8 Owner admin (platform)
Clients and stores, plans, job volume, failed jobs, queue health, webhook errors, audit log, impersonation (read-only, logged). See parent PRD section 6.5.

---

## 7. Roadmap beyond MVP (not in scope now)

| Phase | Capability |
|---|---|
| **Import and update** | CSV or Excel to create and update products, inventory, prices, customers and metafields, with dry-run validation, change preview, error report and rollback file. |
| **Migrations** | Store-to-store copy of selected resources. |
| **Live feeds** | Webhook-driven continuous exports for 3PL and ERP integrations. |
| **More resources** | Draft orders, gift cards, content, files, payouts. |
| **Public API** | Trigger exports and read results programmatically. |

---

## 8. Technical architecture

### 8.1 Stack

| Layer | Choice |
|---|---|
| Web app (marketing, customer app, admin) | Next.js (App Router), TypeScript, Tailwind |
| Auth and database | Supabase (PostgreSQL), RLS by `account_id` and `store_id` |
| File storage | Object storage (Supabase Storage or S3-compatible) with expiring signed URLs |
| Background jobs | A durable job runner (Inngest or Trigger.dev, or a worker on Fly or Render with a queue). Vercel functions alone are not enough for long exports |
| Shopify data | Admin GraphQL API, using **Bulk Operations** for large resources and paginated queries for small ones |
| File generation | Streaming writers for CSV and XLSX so memory stays flat on million-row exports |
| Delivery | SMTP or transactional email, Google Drive and Dropbox OAuth, SFTP client |
| Billing | Behind a `BillingProvider` interface |
| Hosting | Vercel for web; worker host for jobs |

### 8.2 Shopify access
- **Read-only scopes**, requested by resource: `read_products`, `read_inventory`, `read_locations`, `read_orders` (and `read_all_orders` for history beyond about 60 days), `read_customers`, `read_discounts`, `read_content`, `read_files`.
- Orders and customers fall under Shopify's **protected customer data** rules. Access, storage and retention must follow them.
- How the store is connected (installed Shopify app vs merchant-created credentials) is the main open decision, see risks and open questions.

### 8.3 Export job flow
1. The merchant runs an export or a schedule fires. A job record is created (`queued`).
2. The worker builds a GraphQL bulk query from the resource, filters and selected fields, and starts a bulk operation (or paginated queries for small resources).
3. The worker polls or receives the completion webhook, then streams the JSONL result.
4. A transformer flattens it into rows (per variant, per order or per line item), applies column mapping and formatting, and streams to CSV or XLSX in object storage, splitting files at the configured size.
5. The job runs delivery to the chosen destinations, records results and notifies on failure.
6. Cleanup removes files after the retention period.

Handling: one or more bulk operations per store at once is limited by Shopify, so a per-store queue serializes work; rate limits are respected; jobs are idempotent with retries and exponential backoff; stuck jobs are detected and failed with a message.

### 8.4 Data model (draft)

```
-- Platform tables (shared): accounts, users, stores, apps/tools, plans, subscriptions,
-- webhook_events, audit_log   (see Userelay-PRD.md 7.5)

export_templates(id, account_id, store_id nullable, name, resource, config jsonb,
                 is_builtin, created_at)
export_schedules(id, store_id, template_id, cron_or_rule, timezone, incremental bool,
                 destinations jsonb, status[active|paused], last_run_at, next_run_at)
export_jobs(id, store_id, template_id, schedule_id nullable, trigger[manual|schedule],
            status[queued|running|succeeded|failed|cancelled], resource,
            rows int, bytes bigint, started_at, finished_at, error_code, error_detail,
            shopify_bulk_op_id)
export_files(id, job_id, storage_key, format, part int, size, expires_at, deleted_at)
export_deliveries(id, job_id, destination_id, status, detail, delivered_at)
destinations(id, account_id, type[email|gdrive|dropbox|sftp|link], config_encrypted,
             verified_at)
```

### 8.5 Security and privacy
- Shopify tokens and destination credentials encrypted at rest (AES-256-GCM); read-only Shopify scopes.
- Export files are private, encrypted at rest, and downloaded only through short-lived signed URLs. Link expiry is configurable.
- Orders and customer exports contain personal data: retention limits, deletion on request, access logging, and mandatory customer data request and erasure support.
- RLS on every tenant table; admin routes role-checked server-side; SFTP host keys verified.
- Audit log for admin actions and for downloads of sensitive resources.

---

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| **Performance** | A 10,000-product export completes in under 3 minutes; 1M order rows complete without failure and with flat memory use. Preview returns in under 5 seconds. |
| **Reliability** | Jobs are durable and idempotent; retries with backoff; failed jobs have clear causes; scheduled runs hit their time within 5 minutes. |
| **Correctness** | Row counts match Shopify for the same filters (verified in tests); no truncated or duplicated rows; correct encoding for non-Latin text; Excel limits (about 1M rows per sheet) handled by splitting. |
| **Compatibility** | CSV opens correctly in Excel and Google Sheets (UTF-8 BOM option, safe handling of leading `=`, `+`, `-`, `@` to prevent formula injection). |
| **Scalability (MVP target)** | 200 stores, 1,000 scheduled jobs per day, files up to 2 GB. |
| **Accessibility** | WCAG AA contrast and keyboard-operable controls. |
| **Observability** | Structured logs, error tracking, alerts on failure rate, queue depth and stuck jobs. |

### Testing requirements
- Unit tests for column mapping, row flattening, formatting, filters and file splitting.
- Integration tests against a Shopify **development store** seeded with large datasets (tens of thousands of products and orders).
- Golden-file tests: known store data produces an expected file for each built-in template.
- Failure tests: expired token, revoked access, bulk operation failure, destination unreachable.
- Security tests: signed URL expiry, cross-tenant access attempts, formula injection.

---

## 10. UX and design direction

**The UI follows `essential-apps.com-design.md`** (dark canvas, lime accent, Inter, 12px controls, lime chips). The existing component set in `web/` (buttons, cards, chips, tables, sidebar shell) is reused.

Key screens:

| Screen | Content |
|---|---|
| **Home** | Template grid by job ("Orders for 3PL", "Full catalog", ...), recent runs, scheduled exports. |
| **Export builder** | Step layout: Resource → Filters → Columns → Format → Run. A persistent right-hand panel shows the preview table and row estimate. |
| **Run view** | Progress bar, rows so far, stages (querying, building file, delivering), and the download button when done. |
| **Schedules** | List with next run, last result, destination and pause control; create and edit flow. |
| **History** | Table of runs with status chips, filters, re-run and download. |
| **Destinations** | Connect and test Google Drive, Dropbox, SFTP, email. |
| **Stores and billing** | Connected stores, usage against plan limits, invoices. |

Design notes: lime marks the primary action and the active step only; status uses lime, outline and `error` chips with text labels, never color alone; empty states always show the next action; plain language for column names (the Shopify field name is shown as a secondary label).

**Voice:** direct and plain. Tell people what will be in the file before they run it.

---

## 11. Pricing and plans (proposed, placeholders)

| Plan | Includes |
|---|---|
| **Free** | 1 store, 3 manual exports a month, up to 1,000 rows, templates only |
| **Starter** | 1 store, unlimited manual exports, 50k rows per export, 3 schedules, email and download delivery |
| **Pro** | 3 stores, 1M rows per export, 25 schedules, Drive, Dropbox and SFTP, incremental exports, 90-day history |
| **Agency** | 25 stores, high volume, team seats, shared templates, priority support |

Trial length, billing unit and prices are open questions.

---

## 12. Success metrics

| Area | Metric |
|---|---|
| Onboarding | Median time from signup to first downloaded file under 3 minutes; at least 60% of signups complete one export |
| Reliability | Export success rate above 99% (excluding merchant-side credential errors); scheduled runs on time above 99% |
| Accuracy | Zero row-count mismatches in golden tests; zero reported data-corruption incidents |
| Engagement | Share of paying stores with at least one active schedule; templates used per store |
| Business | MRR, month-2 retention, upgrade rate Starter to Pro |
| Support | Tickets per 100 exports; time to resolve failures |

---

## 13. Roadmap

| Phase | Scope |
|---|---|
| **0: Validate** | Decide how the store connects and how it is billed (risk 1). Confirm protected customer data requirements. Prototype a bulk operation to XLSX on a large dev store. Interview 5 to 10 operators and agencies. |
| **1: Platform** | Rebrand the existing UI shell to Userelay with a tool switcher; auth, accounts, store connection, plans and billing, owner admin basics. |
| **2: Export MVP** | Products, inventory, orders, customers; templates; builder with preview; CSV and XLSX; run now; history and downloads. |
| **3: Schedules and delivery** | Scheduling, incremental exports, email, Drive, Dropbox, SFTP, failure alerts. |
| **4: Breadth and hardening** | Remaining resources (collections, discounts, refunds, metafields everywhere), large-store tests, observability, beta merchants. |
| **5: Launch** | Public site, onboarding guide, support process. |
| **Later** | Import and update, migrations, live feeds, API. |

---

## 14. Risks

| # | Risk | Mitigation |
|---|---|---|
| 1 | **Shopify connection and billing policy.** A tool that reads store data needs Admin API access. An installed app brings Shopify's billing requirements; merchant-created credentials are more friction and have their own limits. Staff statements say charges for merchants acquired through Shopify must use Shopify billing. | Get a written answer from Partner support in Phase 0. Keep billing behind an interface so Shopify billing can be added. Design the connection layer to support both an installed app and credentials. |
| 2 | **Protected customer data** for orders and customers (access approval, minimization, retention). | Request access early, store files briefly, encrypt, log downloads, support erasure. |
| 3 | **Entrenched competitor.** Matrixify has years of features and many reviews. | Compete on speed to first file, templates, clear UX and fair pricing. Do not chase feature parity before launch. |
| 4 | **Bulk operation limits** (concurrency, timeouts, result expiry). | Per-store queue, retries, download results promptly, test on large stores. |
| 5 | **Large file handling** (memory, Excel row limits, slow delivery). | Streaming writers, file splitting, resumable delivery, size caps per plan. |
| 6 | **Data leaks** through shared links or misconfigured storage. | Private buckets, short-lived signed URLs, tenant isolation tests, access logs. |
| 7 | **Merchant mistakes** (wrong filters, wrong columns). | Preview before run, row estimates, saved templates, clear column labels. |
| 8 | **API version changes** from Shopify. | Pin API versions, contract tests, scheduled upgrade windows. |

---

## 15. Open questions

1. **Connection model:** installed Shopify app (one click, covers bulk operations cleanly, brings Shopify billing) or merchant-created credentials (more friction, own billing)? This decides the onboarding UX and billing.
2. **Billing vendor:** Paddle, Lemon Squeezy, or Shopify billing for installed-app merchants; per account or per store.
3. **Name:** Userelay Export, or another tool name under the Userelay brand.
4. **Plan limits:** row caps, schedule counts and retention values need real cost modeling once the storage and compute costs are known.
5. **Destinations at launch:** are email, Drive, Dropbox and SFTP all required for MVP, or is download plus email enough to start?
6. **Order history:** how far back must orders go at launch (needs `read_all_orders`)?
7. **Import timing:** how soon after Export does import and update need to ship?
8. **Support:** channel and response targets.
