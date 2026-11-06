// Live checks of the security and queue guarantees against the real Supabase project.
// Creates two throwaway users, runs checks, then deletes everything it created.
// Usage: npm run db:verify
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(url, anonKey, { auth: { persistSession: false } });

const tag = randomUUID().slice(0, 8);
const users = [];
let pass = 0;
const ok = (name) => { pass++; console.log("ok  ", name); };

async function makeUser(label) {
  const email = `verify-${tag}-${label}@example.com`;
  const password = randomUUID();
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  const client = anon();
  const s = await client.auth.signInWithPassword({ email, password });
  assert.ifError(s.error);
  const { data: m } = await admin.from("members").select("account_id,role").eq("user_id", data.user.id).single();
  users.push(data.user.id);
  return { id: data.user.id, client, accountId: m.account_id, role: m.role };
}

try {
  const a = await makeUser("a");
  const b = await makeUser("b");

  assert.equal(a.role, "owner");
  assert.notEqual(a.accountId, b.accountId);
  ok("sign-up creates a separate account and owner membership per user");

  // Stores for each account (server-side insert), plus a secret row.
  const mkStore = async (u, name) => {
    const { data, error } = await admin.from("stores")
      .insert({ account_id: u.accountId, shop_domain: `${name}-${tag}.myshopify.com`, client_id: "cid" })
      .select().single();
    assert.ifError(error);
    const sec = await admin.from("store_secrets").insert({ store_id: data.id, blob: "v1.fake" });
    assert.ifError(sec.error);
    return data;
  };
  const sa = await mkStore(a, "alpha");
  const sb = await mkStore(b, "beta");

  // 1. Anonymous visitors see nothing.
  const an = anon();
  for (const t of ["accounts", "members", "stores", "export_jobs", "export_files", "store_secrets"]) {
    const r = await an.from(t).select("*");
    assert.ok(r.error || (r.data ?? []).length === 0, `anon read ${t}`);
  }
  ok("anonymous users cannot read any table");

  // 2. Users see only their own account's rows.
  const ra = await a.client.from("stores").select("id");
  assert.deepEqual(ra.data.map((x) => x.id), [sa.id]);
  const rb = await b.client.from("stores").select("id");
  assert.deepEqual(rb.data.map((x) => x.id), [sb.id]);
  ok("users only see their own stores (cross-tenant read blocked)");

  // 3. Secrets are unreadable and unwritable by users.
  const sec = await a.client.from("store_secrets").select("*");
  assert.ok(sec.error || sec.data.length === 0);
  const w = await a.client.from("store_secrets").update({ blob: "hacked" }).eq("store_id", sa.id);
  assert.ok(w.error || (w.data ?? []).length === 0);
  const { data: still } = await admin.from("store_secrets").select("blob").eq("store_id", sa.id).single();
  assert.equal(still.blob, "v1.fake");
  ok("store secrets cannot be read or changed by users");

  // 4. Users cannot write at all (no insert/update/delete grants).
  const ins = await a.client.from("stores").insert({ account_id: a.accountId, shop_domain: `x-${tag}.myshopify.com`, client_id: "c" });
  assert.ok(ins.error);
  const upd = await a.client.from("stores").update({ status: "disconnected" }).eq("id", sa.id);
  assert.ok(upd.error);
  const inj = await a.client.from("export_jobs").insert({ account_id: a.accountId, store_id: sa.id, resource: "orders", config: {}, idempotency_key: `k-${tag}` });
  assert.ok(inj.error);
  ok("users cannot write to tenant tables directly");

  // 5. Users cannot call queue functions.
  const c1 = await a.client.rpc("claim_export_job", { p_worker: "evil" });
  assert.ok(c1.error);
  const c2 = await an.rpc("reap_expired_jobs");
  assert.ok(c2.error);
  ok("queue functions are service-role only");

  // 6. Domain validation.
  const bad = await admin.from("stores").insert({ account_id: a.accountId, shop_domain: "evil.com", client_id: "c" });
  assert.ok(bad.error);
  ok("only *.myshopify.com domains are accepted");

  // 7. Queue: claim, per-store concurrency, idempotency, reap with backoff.
  const job = (n, store, user) => admin.from("export_jobs").insert({
    account_id: user.accountId, store_id: store.id, resource: "orders", config: {}, idempotency_key: `${tag}-${n}`,
  }).select().single();
  const j1 = (await job(1, sa, a)).data;
  const j2 = (await job(2, sa, a)).data;
  const dup = await admin.from("export_jobs").insert({ account_id: a.accountId, store_id: sa.id, resource: "orders", config: {}, idempotency_key: `${tag}-1` });
  assert.ok(dup.error, "duplicate idempotency key rejected");
  ok("duplicate idempotency keys are rejected");

  const c = await admin.rpc("claim_export_job", { p_worker: "w1", p_lease_seconds: 60 });
  assert.equal(c.data[0].id, j1.id);
  assert.equal(c.data[0].status, "starting");
  assert.equal(c.data[0].attempt, 1);
  const c3 = await admin.rpc("claim_export_job", { p_worker: "w2", p_lease_seconds: 60 });
  assert.equal(c3.data.length, 0, "second job of same store must wait");
  ok("claim takes the oldest job and enforces one running job per store");

  // A different store can run in parallel.
  const j3 = (await job(3, sb, b)).data;
  const c4 = await admin.rpc("claim_export_job", { p_worker: "w2", p_lease_seconds: 60 });
  assert.equal(c4.data[0].id, j3.id);
  ok("jobs for other stores run in parallel");

  // Heartbeat only works for the lock owner.
  const hb1 = await admin.rpc("heartbeat_export_job", { p_job: j1.id, p_worker: "w1", p_lease_seconds: 60 });
  const hb2 = await admin.rpc("heartbeat_export_job", { p_job: j1.id, p_worker: "someone-else", p_lease_seconds: 60 });
  assert.equal(hb1.data, true);
  assert.equal(hb2.data, false);
  ok("heartbeat extends the lease only for the worker that owns it");

  // Simulate a crashed worker: expire the lease, reap, expect requeue with backoff.
  await admin.from("export_jobs").update({ lease_until: new Date(Date.now() - 1000).toISOString() }).eq("id", j1.id);
  const reaped = await admin.rpc("reap_expired_jobs");
  assert.ok(reaped.data >= 1);
  const { data: after } = await admin.from("export_jobs").select("status,locked_by,run_after,attempt").eq("id", j1.id).single();
  assert.equal(after.status, "queued");
  assert.equal(after.locked_by, null);
  assert.ok(new Date(after.run_after) > new Date(), "backoff pushes run_after into the future");
  ok("crashed worker's job is requeued with backoff");

  // Attempts exhausted -> failed with a clear code.
  await admin.from("export_jobs").update({ status: "starting", attempt: 5, lease_until: new Date(Date.now() - 1000).toISOString() }).eq("id", j1.id);
  await admin.rpc("reap_expired_jobs");
  const { data: dead } = await admin.from("export_jobs").select("status,error_code").eq("id", j1.id).single();
  assert.equal(dead.status, "failed");
  assert.equal(dead.error_code, "worker_lost");
  ok("jobs that keep dying end as failed with a reason");

  // Users can read their job events but not others'.
  const evA = await a.client.from("export_job_events").select("job_id");
  assert.ok(evA.data.every((e) => [j1.id, j2.id].includes(e.job_id)));
  ok("job events are visible only to the owning account");

  // Storage bucket is private.
  const bucket = await admin.storage.getBucket("exports");
  assert.equal(bucket.data.public, false);
  const list = await an.storage.from("exports").list();
  assert.ok(list.error || (list.data ?? []).length === 0);
  ok("exports bucket is private");

  console.log(`\nAll ${pass} checks passed.`);
} catch (e) {
  console.error("\nFAILED:", e.message);
  process.exitCode = 1;
} finally {
  for (const id of users) await admin.auth.admin.deleteUser(id); // cascades accounts' children
  // Accounts created by the trigger are not tied to auth.users by FK; clean them up.
  const { data: accs } = await admin.from("accounts").select("id,name").like("name", `verify-${tag}-%`);
  for (const a of accs ?? []) await admin.from("accounts").delete().eq("id", a.id);
  console.log("cleaned up test data");
}
