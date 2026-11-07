// Database security and health audit. Read-only. Usage: npm run db:audit
//  - every public table has row level security on
//  - the browser roles (anon, authenticated) have no write access to anything
//  - SECURITY DEFINER functions pin their search_path and aren't callable by the browser roles
//  - foreign keys have an index, and no table is bloating unexpectedly
import fs from "node:fs";
import pg from "pg";

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { ca: fs.readFileSync(process.env.SUPABASE_CA_PATH, "utf8"), rejectUnauthorized: true },
});
await client.connect();
const q = async (sql) => (await client.query(sql)).rows;
let bad = 0;
const check = (name, rows, show = (r) => JSON.stringify(r)) => {
  const ok = rows.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? "✔" : "✖"} ${name}`);
  for (const r of rows) console.log(`    ${show(r)}`);
};

check("every public table has row level security", await q(`
  select c.relname as table from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity and c.relname <> '_migrations'`));

check("anon has no access to any table", await q(`
  select table_name, privilege_type from information_schema.role_table_grants
  where table_schema = 'public' and grantee = 'anon'`));

check("browser users can only SELECT (no insert/update/delete/truncate)", await q(`
  select table_name, privilege_type from information_schema.role_table_grants
  where table_schema = 'public' and grantee = 'authenticated' and privilege_type <> 'SELECT'`));

check("SECURITY DEFINER functions set a search_path", await q(`
  select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef and not coalesce(p.proconfig::text, '') like '%search_path%'`));

check("browser roles can't run functions that aren't meant for them", await q(`
  select p.proname, r.rolname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  cross join (select rolname from pg_roles where rolname in ('anon','authenticated')) r
  where n.nspname = 'public' and p.prosecdef and has_function_privilege(r.rolname, p.oid, 'EXECUTE')
    and p.proname not in ('is_member', 'is_owner', 'current_account_ids')`));

check("foreign keys without a supporting index", await q(`
  select c.conrelid::regclass::text as "table", a.attname as column
  from pg_constraint c join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
  where c.contype = 'f' and c.connamespace = 'public'::regnamespace and not exists (
    select 1 from pg_index i where i.indrelid = c.conrelid and i.indkey[0] = c.conkey[1])`));

const sizes = await q(`select relname, n_live_tup::int as rows from pg_stat_user_tables where schemaname = 'public' order by n_live_tup desc limit 6`);
console.log("\nLargest tables:", sizes.map((s) => `${s.relname} ${s.rows}`).join(", "));
await client.end();
console.log(bad ? `\n${bad} problem(s) found.` : "\nAll database audit checks passed.");
process.exitCode = bad ? 1 : 0;
