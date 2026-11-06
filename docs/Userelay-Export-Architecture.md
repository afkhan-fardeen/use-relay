# Userelay Export: How It Works (Architecture and Reliability Plan)

**Status:** Draft for review · **Date:** 2026-11-06 · **Owner:** Fardeen
**Builds on:** `Userelay-Export-PRD.md` (what we build). This document covers how it runs: fast, reliable, secure, and safe when things fail.

Items marked **[verify]** are Shopify behaviors I am recalling from memory and must be confirmed against current Shopify docs before we depend on them.

---

## 1. Principles

1. **Postgres is the source of truth.** Every export is a row with a state. Workers are disposable; if one dies, another picks the job up from the row.
2. **Generate once, deliver many.** Building the file and delivering it are separate steps with separate retries. A flaky SFTP server never forces a re-query of Shopify.
3. **Never hold the whole export in memory.** Everything streams: Shopify result, row flattening, file writing, upload.
4. **Read-only, least privilege, short-lived.** We never write to a merchant's store, and we keep credentials and files for as short a time as we can.
5. **Fail loudly and specifically.** Every failure ends in a clear state, a human-readable reason, an alert if it is ours, and a retry path.

---

## 2. System overview

```
Browser ──► Next.js (app.userelay.com) ──► Postgres (Supabase)  ◄── Scheduler tick (every 30s)
                │                               ▲   │
                │ enqueue job                   │   │ claim (SKIP LOCKED)
                ▼                               │   ▼
          jobs table  ───────────────►  Worker service (Node, long-running)
                                              │   │   │
                         Shopify Admin API ◄──┘   │   └──► Object storage (private bucket)
                         (Bulk Operations)        └──► Destinations (email link, Drive, Dropbox, SFTP)
```

| Piece | Choice | Why |
|---|---|---|
| Web and API | Next.js on Vercel | Fast to ship; handles UI, auth, enqueueing, signed download links. Never runs long jobs. |
| Database, auth | Supabase Postgres with RLS | Tenant isolation at the database level; job queue lives here too. |
| Job queue | Postgres table claimed with `FOR UPDATE SKIP LOCKED` (or `pg-boss`) | One fewer system to run; transactional with job state; easy to inspect and repair. |
| Worker | Small Node service on Fly.io, Railway or Render | Exports run for minutes and stream large files; serverless time limits make that fragile. Can scale to N instances. |
| File storage | S3-compatible private bucket (Supabase Storage, S3 or R2) | Cheap, durable, lifecycle rules for auto-delete. |
| Secrets | Cloud KMS or a managed secrets store for the master key | Keys never live in the database or the repo. |

Alternative considered: a managed durable-execution service (Inngest or Trigger.dev). It gives retries and observability for free, but adds a vendor in the critical path and has runtime limits on some tiers. Decision: start with Postgres plus our own worker; revisit if operations become a burden.

---

## 3. Connecting a store (paste credentials)

1. Merchant creates an app in the Shopify Dev Dashboard, gives it read-only scopes, installs it, and pastes **store domain, client ID and client secret**.
2. We validate the domain format (`*.myshopify.com` only), then mint a token using the **client credentials grant**. **[verify]** Tokens from this flow expire after about 24 hours, so we must mint on demand rather than store one forever.
3. We call a cheap query (`shop { name currencyCode }`) and read the **granted scopes** to confirm access. The UI shows exactly which resources are available.
4. We store the client secret **encrypted** (section 7.1). We keep the minted token **in memory only**, with a short cache and automatic re-mint on a 401.
5. Re-checks: a nightly health check per store, and on any auth failure the store flips to `needs_attention` and the merchant is emailed. Schedules for that store pause instead of failing repeatedly.

Failsafe: if minting fails because the merchant revoked the app, we stop immediately (no retry storm), mark the store, and keep all history readable.

---

## 4. Export pipeline (one run)

### 4.1 States

`queued → starting → shopify_running → downloading → building → publishing → delivering → succeeded`
Terminal alternatives: `failed`, `cancelled`, `expired`. Each transition is a single atomic update that records time, worker ID and detail.

### 4.2 Steps

1. **Enqueue.** The API creates the job with an **idempotency key** (store + template + trigger + minute, or the schedule run ID). A double-click or a retried request returns the existing job.
2. **Claim.** A worker claims the next eligible job with `SKIP LOCKED`, sets `locked_by` and `lease_until`, and heartbeats every 15 seconds. Per-store concurrency is enforced at claim time.
3. **Start Shopify work.**
   - Large resources (orders, products with variants, customers, inventory): submit a **Bulk Operation** query. We store the bulk operation ID on the job *immediately*.
   - Small resources and the preview: paginated GraphQL with `first: N` and cost-aware throttling.
   - Shopify limits how many bulk operations run per store at once **[verify current limit]**, so we queue per store.
4. **Wait.** Poll the bulk operation with backoff (2s growing to 30s), or use the completion webhook where available. Show progress in the UI.
5. **Download.** Stream the result file (JSONL) from Shopify. **[verify]** The result URL is time-limited, so we download promptly and never rely on it later.
6. **Transform.** Stream line by line. Shopify bulk output lists parents and children as separate lines linked by `__parentId`; we join them as they stream, flatten to the chosen layout (per variant, per order, per line item), apply column mapping and formatting.
7. **Write.** Stream to CSV or XLSX in the bucket under a **temporary key**. Split into parts at a size or row limit. Compute a checksum and row count as we go.
8. **Publish.** On success, atomically finalize (rename or commit the file record in one transaction with the job state). A half-written file can never be mistaken for a finished one.
9. **Deliver.** Create one delivery row per destination; each has its own state, retries and error. Email sends a secure link, not the file.
10. **Finish.** Mark `succeeded` (or `succeeded_with_delivery_errors`), notify per preference, schedule file expiry.

### 4.3 Resuming after a crash

- Every step records progress on the job row. If a worker dies, the lease expires, a **reaper** (runs every minute) returns the job to `queued` with `attempt += 1`.
- If a Shopify bulk operation ID is already stored, the new attempt **reattaches to that operation** instead of starting another one. This avoids duplicate work and quota use.
- Temporary files are deleted by a lifecycle rule; a new attempt starts a fresh temporary file.

---

## 5. Speed

| Technique | Effect |
|---|---|
| Shopify Bulk Operations for big data | Avoids page-by-page API calls and rate-limit waits; Shopify does the heavy lifting server-side. |
| End-to-end streaming | Constant memory; first bytes written before the download finishes; 1M-row exports fit on a small worker. |
| Preview with a tiny query | The first 20 rows return in seconds without starting a bulk operation. |
| Request only selected columns | The GraphQL query is built from the chosen fields, so we never fetch images or metafields nobody asked for. |
| Incremental exports | Filter on `updated_at` since the last successful run; daily jobs shrink from millions to thousands of rows. |
| Parallelism across stores | Many stores run at once; within one store we respect Shopify's limits. |
| Gzip for transfer and storage where the destination allows it | Smaller uploads, faster delivery. |
| Dedupe identical in-flight jobs | Two people asking for the same export share one run. |
| Workers scale horizontally | Add instances when queue depth rises; the queue handles distribution. |

Targets: first preview under 5 seconds; a 10,000-product export under 3 minutes; 1M rows without failure and flat memory.

---

## 6. Reliability and failsafes

### 6.1 Retries

| Failure type | Examples | Behavior |
|---|---|---|
| **Retryable** | Network error, Shopify 5xx or throttle, bulk op transient failure, destination timeout | Exponential backoff with jitter, capped attempts (for example 5), then fail with a clear reason. |
| **Terminal** | Revoked token, missing scope, invalid template, destination auth rejected | Fail at once, no retry, tell the merchant exactly what to fix. |
| **Ours** | Bug, out of memory, unexpected exception | Retry once, then `failed` and **alert us**; the merchant sees a neutral message and a support reference. |

### 6.2 Scheduler

- Schedules store `next_run_at` in UTC plus the merchant's time zone; the next time is computed with a time-zone library so **DST changes** and month-end rules behave.
- A tick every 30 seconds selects due schedules with `SKIP LOCKED`, creates a job with idempotency key `schedule_id + planned_time`, and advances `next_run_at` in the same transaction. Two scheduler instances cannot double-fire.
- **Missed runs** (for example after downtime) are caught up **once**, not once per missed interval.
- **Dead man's switch:** an alert fires if a schedule that should have run has no job within a grace window.
- Repeated failures auto-pause the schedule and email the merchant (so a broken SFTP does not run 500 times).

### 6.3 Deliveries

- Each destination is independent. One failing never blocks the others or the download link.
- Retries with backoff over several hours for transient errors; clear `failed` state with the reason after that.
- **Idempotent delivery:** file names include the job ID or a deterministic timestamp, and overwrite behavior is explicit, so a retry cannot create duplicate or half files. SFTP uploads write to a temporary name and rename on completion.
- A **circuit breaker** per destination: after repeated failures we stop trying for a cooling period and tell the merchant.

### 6.4 Protecting Shopify and ourselves

- Cost-aware rate limiting per store using the throttle status Shopify returns.
- Per-account and per-plan quotas (rows, concurrent jobs) enforced when the job is claimed.
- Backpressure: if the queue is deep, new manual runs show an estimated wait instead of failing.
- Hard caps: maximum file size and runtime per plan; jobs over the cap fail early with advice (add filters or split).
- Graceful shutdown: on SIGTERM a worker stops claiming, finishes or checkpoints the current step, and releases its lease.

### 6.5 Data consistency (what we promise)

A bulk export reflects Shopify's data at roughly the time the operation ran. It is not a single database snapshot, so records changed during a long export may appear in either state. We say this plainly in the docs, and incremental runs re-capture anything updated after the last run's start time (we use the **start** time as the next cursor so no change is missed; duplicates are possible and expected).

### 6.6 Backups and recovery

- Supabase point-in-time recovery for the database.
- Job rows and history are the recovery map; files are reproducible by re-running, so file storage is not backed up beyond normal durability.
- Runbooks for: stuck queue, worker crash loop, Shopify outage, bucket outage, key rotation.

---

## 7. Security

### 7.1 Secrets and encryption

- **Envelope encryption:** each store gets a random data key; the data key is encrypted by a master key held in KMS (or a managed secrets store). Credentials are encrypted with **AES-256-GCM**, with the store ID as additional authenticated data so a ciphertext cannot be reused for another store.
- Only the **worker** decrypts credentials, and only at the moment of use. The web app can write secrets but cannot read them back. The UI never shows a stored secret again.
- Key rotation: the master key can be rotated and data keys re-wrapped without touching merchants.
- Secrets never appear in logs, error messages, analytics or URLs (a log scrubber and tests enforce this).

### 7.2 Access to Shopify

- Read-only scopes, requested per resource; the UI warns if a needed scope is missing.
- Protected customer data (orders, customers): minimum columns by default, PII columns clearly marked, retention limits, deletion on request, and access logging, in line with Shopify's protected data requirements.

### 7.3 Files

- Private bucket, per-tenant path prefix, encryption at rest.
- Download only through **signed URLs with a short life** (for example 10 to 15 minutes), generated after an authenticated, authorized request; every download is audit-logged.
- Email sends a link that requires login (or a short-lived signed link), **not an attachment**, so sensitive files do not sit in inboxes.
- Automatic expiry by plan (7, 30, 90 days) through bucket lifecycle rules, plus a daily cleanup job that confirms deletion.
- Spreadsheet formula injection is blocked in the writer (cells starting with `=`, `+`, `-`, `@` are neutralized). Already implemented and tested in the UI demo code.

### 7.4 Destinations

- **SFTP/FTP:** merchant-supplied hosts are an SSRF risk. We resolve the host, reject private, loopback and cloud-metadata IP ranges, pin the resolved IP for the connection, allow only expected ports, and **pin the host key** on first successful connection (merchant confirms the fingerprint). Plain FTP is off by default.
- **Google Drive and Dropbox:** OAuth with the narrowest scopes (Drive per-file access, Dropbox app folder); refresh tokens encrypted like other secrets.
- **Email:** sent from our domain with SPF, DKIM and DMARC; no file attachments.

### 7.5 Application security

- **Tenant isolation:** RLS on every tenant table, keyed to account and store; the service role is used only by the worker and server routes. Cross-tenant access attempts are in the automated test suite.
- Admin routes are role-checked on the server; admin impersonation is read-only and logged.
- Input validation on every API route; rate limiting and bot protection on sign-up, login and credential testing (a credential test endpoint is a brute-force target).
- Webhook and callback signature verification; CSRF protection; secure cookies; strict CSP.
- Dependency and secret scanning in CI; pinned Shopify API versions; least-privilege cloud roles.
- An audit log for sign-ins, store connections, credential changes, downloads of sensitive files, schedule changes and admin actions.

---

## 8. Failure scenarios and what happens

| Scenario | Behavior |
|---|---|
| Merchant revokes the Shopify app | Next call fails with auth error; store marked `needs_attention`; schedules pause; merchant emailed; history stays. |
| Shopify throttles or has an outage | Backoff and retry; job shows "waiting on Shopify"; fails after the cap with a clear reason and a retry button. |
| Bulk operation fails or is cancelled | Retry with a new operation up to the cap; reason surfaced. |
| Worker crashes mid-build | Lease expires; reaper requeues; new attempt reattaches to the stored bulk operation; temp file discarded. |
| Whole worker fleet down | Jobs wait in the queue; alert on queue age; no data lost; schedules catch up once on recovery. |
| Database briefly unavailable | Workers retry with backoff; no state is ever only in memory. |
| Destination down | Delivery retries with backoff; file stays available by download; merchant is told. |
| Destination slow or hostile | Connect, read and total timeouts; SSRF and port rules; circuit breaker. |
| Duplicate trigger (double-click, retried request, two schedulers) | Idempotency key returns the same job. |
| Export too large for the plan | Fails early with a size estimate and suggested filters. |
| Disk or memory pressure | Streaming keeps usage flat; per-job caps; worker restarts cleanly under supervision. |
| Daylight saving change | Time-zone-aware schedule computation; documented behavior for skipped or repeated hours. |
| Shopify API version retired | Pinned version with contract tests; upgrade window before the sunset date. |
| Leaked signed URL | Short expiry; revoke by rotating the link; downloads audit-logged. |
| Bug ships to production | Feature flags, staged rollout, golden-file regression tests, quick rollback. |

---

## 9. Observability

- Structured logs on every line with `job_id`, `store_id`, `attempt` and step.
- Metrics: queue depth and oldest job age, claim-to-start latency, duration by resource and size, success rate, retry rate, delivery success per destination type, Shopify throttle rate.
- Alerts: success rate dip, queue age, stuck jobs past lease, schedule dead-man's switch, error spikes by code, storage growth, certificate or key expiry.
- A **job event log** (each state change with a timestamp) shown in the UI, so merchants and support see exactly where a run stalled.
- Error tracking with scrubbed payloads; a public status page.

---

## 10. Testing the failsafes

- **Golden files:** known dev-store data produces an expected file for each built-in template.
- **Chaos tests:** kill the worker mid-download, mid-write and mid-delivery; the job must finish correctly without duplicates.
- **Load tests:** a dev store seeded with 100k+ orders and 50k+ products; verify time, memory and row-count parity with Shopify.
- **Idempotency tests:** replay enqueue, delivery and scheduler ticks; results must not duplicate.
- **Security tests:** cross-tenant reads, expired and tampered signed URLs, SSRF attempts to private ranges, formula injection, secret leakage in logs.
- **Failure injection:** simulated 429s, 5xx, revoked tokens, slow SFTP, full bucket.

---

## 11. Build order

| Step | Deliverable | Done when |
|---|---|---|
| 1. Foundation | Supabase project, schema and RLS, auth, secret encryption module, CI | Cross-tenant tests pass; secrets round-trip and rotate. |
| 2. Connect | Credential form, token mint, scope check, store health, `needs_attention` flow | A real dev store connects; revoking it is detected. |
| 3. First export | Job table, worker, claim and lease, Products via bulk operation to CSV in the bucket, signed download | 10k products export correctly; kill-the-worker test passes. |
| 4. More resources | Orders, customers, inventory, collections; XLSX; layouts; preview query | Golden files match for all templates. |
| 5. History and notifications | Event log, retries, error messages, email alerts | Every failure type shows a clear reason. |
| 6. Schedules and delivery | Scheduler, incremental mode, email link, SFTP, Drive, Dropbox, circuit breaker | A week of scheduled runs on a dev store with no misses or duplicates. |
| 7. Hardening | Load tests, security review, observability, runbooks, backups | Targets in section 5 met; alerts verified by drill. |
| 8. Beta | Real merchants, support process, billing | Success rate above 99% over two weeks. |

---

## 12. Decisions needed

1. **Worker host:** Fly.io, Railway or Render (all fit). I lean Fly.io for regions and cost, but any is fine.
2. **Object storage:** Supabase Storage (simplest) or S3/R2 (cheaper egress, more control).
3. **KMS:** a cloud KMS (AWS or GCP) or a managed secrets service for the master key.
4. **Email provider** for notifications and secure links.
5. **Queue approach:** plain Postgres queue (recommended) or a managed workflow service.
6. **Data residency:** do EU merchants need EU-only storage and processing at launch?
7. **Shopify facts to verify first:** client credentials token lifetime and refresh, concurrent bulk operation limit, result URL lifetime, `read_all_orders` access for paid history, and protected customer data approval for orders and customers.

---

## 13. Free-tier edition (pre-revenue and beta)

Same design, hosted at $0. Free-tier limits change often and most figures below come from third-party roundups, so **confirm each on the provider's pricing page before relying on it.**

| Piece | Free choice | Notes and limits |
|---|---|---|
| Web app | Cloudflare Pages/Workers (or Netlify) | **Not Vercel Hobby:** its terms limit Hobby to non-commercial use, and this is a paid SaaS. |
| Database and auth | Supabase Free | About 500 MB database, 50k monthly active users. **Free projects pause after about 7 days of inactivity**; a scheduled job that touches the database keeps it awake. Job and history rows are small, so 500 MB is plenty at first. |
| File storage | Cloudflare R2 Free | About 10 GB, no egress fees. Supabase's 1 GB storage is too small for export files. Retention (7 days on free plans) keeps usage low. |
| Worker and scheduler (chosen) | **Render free web service** running the worker, woken by a free external cron (for example cron-job.org) calling a signed `POST /tick` every 5 minutes. The request stays open while jobs run, so the idle spin-down cannot kill an export. A tick also touches the database to keep Supabase awake. Cold start can add tens of seconds; the same Dockerfile moves to a paid always-on Render background worker (about $7 a month) with no code change. Confirm on Render's pricing page that free instances are web services only. |
| Worker alternatives | GitHub Actions (cron plus manual trigger), or an Oracle Cloud Always Free VM | Actions: a scheduled workflow every 5 minutes claims and runs queued jobs, then exits. Free minutes are limited for private repos, and scheduled runs can be delayed. The Oracle VM is a real always-on server and free, but sign-up and capacity are hit or miss. |
| Email | A free transactional tier (for example Resend) | Small daily and monthly caps; enough for alerts and secure links at beta scale. |
| Key management | Master key in the host's secret store | Replaces a paid KMS. Keep per-store data keys and AES-GCM exactly as in section 7.1; rotate the master key by re-wrapping data keys. |
| Monitoring | Free tiers of an error tracker and an uptime pinger | Alerts by email. |

**What changes in behavior**
- Schedules run to within about 5 to 15 minutes of their time, not to the second. Hourly, daily and weekly schedules are fine; per-minute schedules are not offered.
- A run starts when the next worker tick fires (cold start of a few seconds to a few minutes), so manual exports show "queued" briefly.
- Long exports must finish within the workflow time limit; very large exports are capped on the free plan.
- Everything else in sections 4 to 10 (state machine, leases, idempotency, retries, encryption, signed links, SSRF rules) is unchanged, because it is code and not hosting.

**When to start paying** (rough order): a paid worker host (about $5 to $10 a month) once schedules need precision or exports get large; Supabase Pro (about $25 a month) before real customer data or when the free pause or limits bite; Cloudflare or storage overage as volume grows. Budget about $30 to $40 a month for a stable launch.
