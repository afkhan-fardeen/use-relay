"use server";

import { createHash } from "node:crypto";
import { after } from "next/server";
import { getSession } from "@/lib/dal";
import { columnLabel, getResource, validateConfig, type ExportConfig } from "@/lib/export";
import { allow } from "@/lib/ratelimit";
import { FRIENDLY, ShopifyError } from "@/lib/shopify";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { JobError, gql } from "@/lib/export/bulk";
import { createProcessor, toBulkLines, type Row } from "@/lib/export/processors";
import { ROOT_FIELD, buildQuery } from "@/lib/export/queries";
import { drainQueue } from "@/lib/export/queue";
import { forgetStoreAccess, loadStoreAccessCached } from "@/lib/export/store";

export type PreviewResult =
  | { ok: true; headers: string[]; rows: string[][]; empty: boolean }
  | { ok: false; error: string };

export type StartResult = { ok: true; jobId: string } | { ok: false; error: string };

export type JobStatus = {
  status: string;
  rows: number;
  errorCode: string | null;
  errorDetail: string | null;
  fileId: string | null;
  fileName: string | null;
};

function needs(cfg: ExportConfig, scopes: string[]): string | null {
  const r = getResource(cfg.resource);
  if (!scopes.includes(r.scope)) return `This store's app doesn't have the ${r.scope} permission. Add it in the Dev Dashboard, release a new version, then reconnect the store.`;
  if (cfg.resource === "inventory" && !scopes.includes("read_locations")) return "Inventory exports also need the read_locations permission. Add it in the Dev Dashboard, release a new version, then reconnect the store.";
  return null;
}

/** First few rows straight from Shopify, shaped exactly like the final file. */
export async function previewExport(input: unknown): Promise<PreviewResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Log in again." };
  const parsed = validateConfig(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const cfg = parsed.config;
  if (!allow(`preview:${session.userId}`, 40, 60_000)) return { ok: false, error: "Slow down a little. Try the preview again in a few seconds." };

  try {
    const store = await loadStoreAccessCached(cfg.storeId, session.accountId);
    const missing = needs(cfg, store.scopes);
    if (missing) return { ok: false, error: missing };

    const data = await gql(store.domain, store.token, buildQuery(cfg, 10, 5));
    const edges = data?.[ROOT_FIELD[cfg.resource]]?.edges ?? [];
    const rows: Row[] = [];
    const proc = createProcessor(cfg, (r) => {
      if (rows.length < 12) rows.push(r);
    });
    for (const line of toBulkLines(edges)) proc.push(line);
    proc.finish();

    const resource = getResource(cfg.resource);
    return {
      ok: true,
      headers: cfg.columns.map((k) => cfg.renames[k] || columnLabel(resource, k)),
      rows: rows.map((r) => r.map((c) => String(c))),
      empty: rows.length === 0,
    };
  } catch (e) {
    if (e instanceof ShopifyError) {
      if (e.code === "invalid_credentials" || e.code === "app_not_installed") forgetStoreAccess(cfg.storeId);
      return { ok: false, error: e.message || FRIENDLY[e.code] };
    }
    if (e instanceof JobError) return { ok: false, error: e.message };
    console.error("preview failed", e instanceof Error ? e.message : String(e));
    return { ok: false, error: "We couldn't load a preview. Try again." };
  }
}

/** Queue an export and start working on it right away. */
export async function startExport(input: unknown): Promise<StartResult> {
  const session = await getSession();
  if (!session) return { ok: false, error: "Your session ended. Log in again." };
  const parsed = validateConfig(input);
  if (!parsed.ok) return { ok: false, error: parsed.error };
  const cfg = parsed.config;

  const db = supabaseAdmin();
  const { data: store } = await db
    .from("stores")
    .select("id, account_id, status, granted_scopes")
    .eq("id", cfg.storeId)
    .maybeSingle();
  if (!store || store.account_id !== session.accountId) return { ok: false, error: "Store not found." };
  if (store.status !== "connected") return { ok: false, error: "This store needs attention. Reconnect it in Stores first." };
  const missing = needs(cfg, store.granted_scopes ?? []);
  if (missing) return { ok: false, error: missing };

  // Limits: a few at once, and a sane hourly cap per account.
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
  const [{ count: active }, { count: recent }] = await Promise.all([
    db.from("export_jobs").select("id", { count: "exact", head: true }).eq("account_id", session.accountId).in("status", ["queued", "starting", "shopify_running", "downloading", "building", "publishing", "delivering"]),
    db.from("export_jobs").select("id", { count: "exact", head: true }).eq("account_id", session.accountId).gte("created_at", hourAgo),
  ]);
  if ((active ?? 0) >= 3) return { ok: false, error: "You already have 3 exports running. Wait for one to finish." };
  if ((recent ?? 0) >= 30) return { ok: false, error: "You've reached the hourly export limit. Try again later." };

  // An identical request within 20 seconds (double click, retry) returns the same job.
  const twentyAgo = new Date(Date.now() - 20_000).toISOString();
  const dup = await db
    .from("export_jobs")
    .select("id")
    .eq("account_id", session.accountId)
    .eq("store_id", cfg.storeId)
    .gte("created_at", twentyAgo)
    .contains("config", cfg)
    .order("created_at", { ascending: false })
    .limit(1);
  if (dup.data?.[0]) return { ok: true, jobId: dup.data[0].id };

  // Backstop for two requests arriving at the same instant: the unique key lets only one insert win.
  const key = createHash("sha1")
    .update(`${session.accountId}:${JSON.stringify(cfg)}:${Math.floor(Date.now() / 15_000)}`)
    .digest("hex");
  const existing = await db.from("export_jobs").select("id").eq("idempotency_key", key).maybeSingle();
  if (existing.data) return { ok: true, jobId: existing.data.id };

  const ins = await db
    .from("export_jobs")
    .insert({ account_id: session.accountId, store_id: cfg.storeId, resource: cfg.resource, config: cfg, idempotency_key: key })
    .select("id")
    .single();
  if (ins.error || !ins.data) return { ok: false, error: "We couldn't start the export. Try again." };

  await db.from("export_job_events").insert({ job_id: ins.data.id, state: "queued", detail: `requested by ${session.userId}` });
  after(() => drainQueue());
  return { ok: true, jobId: ins.data.id };
}

/** Polled by the builder while an export runs. Reads as the signed-in user (RLS applies). */
export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const session = await getSession();
  if (!session || !/^[0-9a-f-]{36}$/i.test(jobId)) return null;
  const supabase = await supabaseServer();
  const { data: job } = await supabase
    .from("export_jobs")
    .select("status, rows_written, error_code, error_detail, export_files(id, storage_key, deleted_at)")
    .eq("id", jobId)
    .maybeSingle();
  if (!job) return null;
  const file = (job.export_files as { id: string; storage_key: string; deleted_at: string | null }[] | null)?.find((f) => !f.deleted_at);
  return {
    status: job.status,
    rows: Number(job.rows_written ?? 0),
    errorCode: job.error_code,
    errorDetail: job.error_detail,
    fileId: file?.id ?? null,
    fileName: file ? file.storage_key.split("/").pop() ?? null : null,
  };
}
