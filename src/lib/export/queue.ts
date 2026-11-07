// Queue worker: claims queued jobs (one per store at a time) and runs them.
// Runs inside the web server process (Render keeps it alive); started after enqueue and by /api/tick.

import { hostname } from "node:os";
import { reportError } from "../report.ts";
import { supabaseAdmin } from "../supabase/admin.ts";
import { runJob, type JobRow } from "./run.ts";

const WORKER = `${hostname()}-${process.pid}`;
let draining = false;

/** Process queued jobs until none are runnable. Safe to call often; only one drain runs per process. */
export async function drainQueue(maxJobs = 25): Promise<number> {
  if (draining) return 0;
  draining = true;
  let done = 0;
  try {
    const db = supabaseAdmin();
    for (let i = 0; i < maxJobs; i++) {
      const { data, error } = await db.rpc("claim_export_job", { p_worker: WORKER, p_lease_seconds: 60 });
      if (error) {
        console.error("queue: claim failed", error.message);
        break;
      }
      const job = (data as JobRow[] | null)?.[0];
      if (!job) break;
      await runJob(job, WORKER);
      done++;
    }
  } catch (e) {
    reportError("queue drain", e);
  } finally {
    draining = false;
  }
  return done;
}

/** Delete export files past their expiry (storage object and record). */
export async function cleanupExpiredFiles(limit = 50): Promise<number> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("export_files")
    .select("id, storage_key")
    .is("deleted_at", null)
    .lt("expires_at", new Date().toISOString())
    .limit(limit);
  if (!data?.length) return 0;
  const rm = await db.storage.from("exports").remove(data.map((f) => f.storage_key));
  if (rm.error) {
    console.error("cleanup: storage remove failed", rm.error.message);
    return 0;
  }
  await db.from("export_files").update({ deleted_at: new Date().toISOString() }).in("id", data.map((f) => f.id));
  return data.length;
}
