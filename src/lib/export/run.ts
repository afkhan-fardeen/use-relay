// Runs one export job end to end:
//   mint token → start (or reattach to) a Shopify bulk operation → wait → stream the result
//   → flatten into rows → write a CSV on disk → upload privately → record the file.
// Every step keeps the job's lease alive; if the lease is lost, another worker owns the job
// and this run stops quietly. Failures are classified as retryable or final.

import { createHash } from "node:crypto";
import { createWriteStream } from "node:fs";
import { readFile, unlink } from "node:fs/promises";
import { once } from "node:events";
import { tmpdir } from "node:os";
import path from "node:path";
import { getEntitlements } from "../billing/entitlements.ts";
import { columnLabel, fileName, getResource, validateConfig, type ExportConfig } from "../export.ts";
import { FRIENDLY, ShopifyError } from "../shopify.ts";
import { supabaseAdmin } from "../supabase/admin.ts";
import { JobError, pollBulk, startBulk, streamJsonl, waitForBulk } from "./bulk.ts";
import { csvLine } from "./csv.ts";
import { LimitError, createProcessor, type Row } from "./processors.ts";
import { buildQuery } from "./queries.ts";
import { loadStoreAccess } from "./store.ts";

export type JobRow = {
  id: string;
  account_id: string;
  store_id: string;
  config: unknown;
  attempt: number;
  max_attempts: number;
  shopify_bulk_op: string | null;
};

export const MAX_ROWS = 250_000;
export const MAX_BYTES = 40 * 1024 * 1024; // keeps us inside the free storage upload limit and 512 MB RAM
export const FILE_TTL_DAYS = 7;

class LeaseLost extends Error {}

const TERMINAL_SHOPIFY = new Set(["invalid_credentials", "app_not_installed", "wrong_organization", "shop_not_found"]);

export async function runJob(job: JobRow, worker: string): Promise<void> {
  const db = supabaseAdmin();
  const tmp = path.join(tmpdir(), `userelay-${job.id}-${job.attempt}.csv`);
  let lastBeat = Date.now();

  const event = async (state: string, detail?: string) => {
    await db.from("export_job_events").insert({ job_id: job.id, state, detail: detail ?? null });
  };
  const beat = async (force = false) => {
    if (!force && Date.now() - lastBeat < 15_000) return;
    lastBeat = Date.now();
    const { data } = await db.rpc("heartbeat_export_job", { p_job: job.id, p_worker: worker, p_lease_seconds: 60 });
    if (data !== true) throw new LeaseLost();
  };
  const setState = async (status: string, patch: Record<string, unknown> = {}, detail?: string) => {
    const { data, error } = await db
      .from("export_jobs")
      .update({ status, ...patch })
      .eq("id", job.id)
      .eq("locked_by", worker)
      .select("id");
    if (error || !data?.length) throw new LeaseLost();
    await event(status, detail);
  };

  try {
    const parsed = validateConfig(job.config);
    if (!parsed.ok) throw new JobError("bad_config", parsed.error);
    const cfg: ExportConfig = parsed.config;
    const resource = getResource(cfg.resource);

    const ent = await getEntitlements(job.account_id);
    const rowCap = Math.min(MAX_ROWS, ent.limits.maxRows);
    const store = await loadStoreAccess(job.store_id, job.account_id);
    if (!store.scopes.includes(resource.scope)) {
      throw new JobError("missing_scope", `This store's app doesn't have the ${resource.scope} permission. Add it in the Dev Dashboard, release a new version, then reconnect the store.`);
    }
    if (cfg.resource === "inventory" && !store.scopes.includes("read_locations")) {
      throw new JobError("missing_scope", "Inventory exports also need the read_locations permission. Add it in the Dev Dashboard, release a new version, then reconnect the store.");
    }
    await beat(true);

    // 1) Start the Shopify bulk operation, or reattach to the one a previous attempt started.
    let opId = job.shopify_bulk_op;
    if (opId) {
      const op = await pollBulk(store.domain, store.token, opId);
      if (!op || ["FAILED", "CANCELED", "CANCELING", "EXPIRED"].includes(op.status)) opId = null;
    }
    if (opId) {
      await setState("shopify_running", {}, "reattached to existing Shopify export");
    } else {
      await setState("shopify_running", {}, "starting Shopify export");
      opId = await startBulk(store.domain, store.token, buildQuery(cfg));
      await setState("shopify_running", { shopify_bulk_op: opId });
    }

    // 2) Wait for Shopify.
    const result = await waitForBulk(store.domain, store.token, opId, async () => beat());

    // 3) Download, flatten, write.
    await setState("downloading", {}, `Shopify prepared ${result.objectCount} records`);
    const delimiter = cfg.format === "tsv" ? "\t" : ",";
    const out = createWriteStream(tmp);
    let rows = 0;
    let bytes = 0;
    let buf = "";
    const header = cfg.columns.map((k) => cfg.renames[k] || columnLabel(resource, k));
    const addText = (t: string) => {
      bytes += t.length; // characters; close enough for a size guard
      if (bytes > MAX_BYTES) throw new LimitError("too_large", "This export is too large for your plan. Narrow it with filters.");
      buf += t;
    };
    const flush = async () => {
      if (!buf) return;
      if (!out.write(buf)) await once(out, "drain");
      buf = "";
    };
    if (cfg.format === "csv-bom") buf += "﻿";
    addText(csvLine(header, delimiter));

    const proc = createProcessor(cfg, (row: Row) => {
      rows++;
      if (rows > rowCap) {
        throw new LimitError(
          "too_many_rows",
          ent.billingOn && rowCap < MAX_ROWS
            ? `Your ${ent.plan} plan allows ${rowCap.toLocaleString("en-US")} rows per export. Narrow it with filters or upgrade in Billing.`
            : `This export has more than ${rowCap.toLocaleString("en-US")} rows. Narrow it with filters.`,
        );
      }
      addText(csvLine(row, delimiter));
    });

    try {
      if (result.url) {
        await streamJsonl(result.url, (line) => proc.push(line), async () => {
          await flush();
          await beat();
        });
      }
      proc.finish();
      await flush();
    } finally {
      out.end();
      await once(out, "close").catch(() => undefined);
    }

    // 4) Upload privately and record the file.
    await setState("publishing", {}, `${rows} rows`);
    const data = await readFile(tmp);
    const filename = fileName(cfg.name, cfg.format);
    const key = `${job.account_id}/${job.id}/${filename}`;
    const up = await db.storage.from("exports").upload(key, data, {
      contentType: cfg.format === "tsv" ? "text/tab-separated-values; charset=utf-8" : "text/csv; charset=utf-8",
      upsert: true,
      cacheControl: "0", // never cache: deleted exports must really be gone
    });
    if (up.error) {
      if (/size|large|exceed/i.test(up.error.message)) throw new LimitError("too_large", "This export is too large for your plan. Narrow it with filters.");
      throw new JobError("storage_failed", "We couldn't save the file. Retrying.", true);
    }
    const { error: fileErr } = await db.from("export_files").insert({
      job_id: job.id,
      account_id: job.account_id,
      storage_key: key,
      format: cfg.format === "tsv" ? "tsv" : "csv",
      size_bytes: data.length,
      row_count: rows,
      sha256: createHash("sha256").update(data).digest("hex"),
      expires_at: new Date(Date.now() + FILE_TTL_DAYS * 86_400_000).toISOString(),
    });
    if (fileErr) throw new JobError("storage_failed", "We couldn't record the file. Retrying.", true);

    const note =
      cfg.resource === "orders" && !store.scopes.includes("read_all_orders")
        ? "Only orders from the last 60 days are included. Add the read_all_orders permission to export older orders."
        : null;
    await setState(
      "succeeded",
      { rows_written: rows, bytes_written: data.length, finished_at: new Date().toISOString(), locked_by: null, lease_until: null, error_code: note ? "note" : null, error_detail: note },
      `${rows} rows`,
    );
  } catch (e) {
    if (e instanceof LeaseLost) return; // another worker owns this job now
    await handleFailure(job, worker, e);
  } finally {
    await unlink(tmp).catch(() => undefined);
  }
}

async function handleFailure(job: JobRow, worker: string, e: unknown): Promise<void> {
  const db = supabaseAdmin();
  let code = "internal_error";
  let message = "Something went wrong on our side. Please try again.";
  let retryable = job.attempt < 2; // unknown errors: one retry
  let authProblem = false;

  if (e instanceof LimitError) {
    code = e.code;
    message = e.message;
    retryable = false;
  } else if (e instanceof JobError) {
    code = e.code;
    message = e.message;
    retryable = e.retryable;
  } else if (e instanceof ShopifyError) {
    code = e.code;
    message = e.message || FRIENDLY[e.code];
    retryable = e.code === "unavailable" || e.code === "unexpected";
    authProblem = TERMINAL_SHOPIFY.has(e.code);
  } else {
    console.error("export job crashed", { job: job.id, attempt: job.attempt, error: e instanceof Error ? e.message : String(e) });
  }

  const now = new Date();
  if (retryable && job.attempt < job.max_attempts) {
    const delaySec = Math.min(300, 10 * 2 ** (job.attempt - 1));
    const { data } = await db
      .from("export_jobs")
      .update({
        status: "queued",
        locked_by: null,
        lease_until: null,
        run_after: new Date(now.getTime() + delaySec * 1000).toISOString(),
        error_code: code,
        error_detail: message,
      })
      .eq("id", job.id)
      .eq("locked_by", worker)
      .select("id");
    if (data?.length) await db.from("export_job_events").insert({ job_id: job.id, state: "queued", detail: `retry in ${delaySec}s: ${code}` });
    return;
  }

  const { data } = await db
    .from("export_jobs")
    .update({ status: "failed", error_code: code, error_detail: message, finished_at: now.toISOString(), locked_by: null, lease_until: null })
    .eq("id", job.id)
    .eq("locked_by", worker)
    .select("id");
  if (data?.length) await db.from("export_job_events").insert({ job_id: job.id, state: "failed", detail: `${code}: ${message}` });
  if (authProblem) {
    await db.from("stores").update({ status: "needs_attention", last_error: message, last_checked_at: now.toISOString() }).eq("id", job.store_id);
  }
}
