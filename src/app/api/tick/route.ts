import { timingSafeEqual } from "node:crypto";
import { reportError } from "@/lib/report";
import { after } from "next/server";
import { cleanupExpiredFiles, drainQueue } from "@/lib/export/queue";
import { supabaseAdmin } from "@/lib/supabase/admin";

// Called every ~5 minutes by an external cron (cron-job.org). It:
//  1. keeps the free Render service awake and the free Supabase project from pausing,
//  2. requeues exports whose worker disappeared (lease expired),
//  3. runs any queued exports (retries, jobs missed while the server restarted),
//  4. deletes export files past their retention date,
//  5. purges old scan, webhook and job-event rows.
// Protected by a shared secret: Authorization: Bearer <TICK_SECRET>.

function authorized(req: Request): boolean {
  const secret = process.env.TICK_SECRET;
  if (!secret) return false;
  const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });

  const db = supabaseAdmin();
  const reaped = await db.rpc("reap_expired_jobs");
  if (reaped.error) {
    reportError("tick reap", reaped.error);
    return Response.json({ ok: false, error: "reap_failed" }, { status: 500 });
  }

  // Do the real work after replying so the cron call returns instantly.
  after(async () => {
    await drainQueue();
    await cleanupExpiredFiles();
    const purged = await db.rpc("purge_old_data"); // old scans, webhook deliveries and job events
    if (purged.error) reportError("tick purge", purged.error);
  });

  return Response.json({ ok: true, requeued: reaped.data, at: new Date().toISOString() });
}
