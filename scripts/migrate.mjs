// Minimal migration runner: applies supabase/migrations/*.sql in order, once each.
// Usage: npm run db:migrate   (reads DATABASE_URL and SUPABASE_CA_PATH from .env.local)
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
const caPath = process.env.SUPABASE_CA_PATH;
if (!url || !caPath) {
  console.error("DATABASE_URL and SUPABASE_CA_PATH are required.");
  process.exit(1);
}

// TLS is always verified against Supabase's CA. Never disable verification.
const client = new pg.Client({
  connectionString: url,
  ssl: { ca: fs.readFileSync(caPath, "utf8"), rejectUnauthorized: true },
});

const dir = path.resolve("supabase/migrations");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();

await client.connect();
await client.query(`
  create table if not exists public._migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`);
const done = new Set((await client.query("select name from public._migrations")).rows.map((r) => r.name));

for (const f of files) {
  if (done.has(f)) { console.log("skip ", f); continue; }
  const sql = fs.readFileSync(path.join(dir, f), "utf8");
  try {
    await client.query("begin");
    await client.query(sql);
    await client.query("insert into public._migrations(name) values ($1)", [f]);
    await client.query("commit");
    console.log("apply", f);
  } catch (e) {
    await client.query("rollback");
    console.error("FAILED", f, "-", e.message);
    process.exit(1);
  }
}
await client.end();
console.log("done");
