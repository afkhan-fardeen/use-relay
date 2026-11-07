-- Klyroo Export: foundation schema
-- Tenancy, stores, secrets, export jobs (queue), events, files, audit.
-- Principles: RLS on every table; clients can only READ their own account's data;
-- all writes go through server routes using the service role; secrets are in a table
-- with RLS enabled and no policies, so only the service role can touch them.

-- ───────────────────────── Tenancy ─────────────────────────
create table public.accounts (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_at  timestamptz not null default now()
);

create table public.members (
  account_id  uuid not null references public.accounts(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null default 'member' check (role in ('owner', 'member')),
  created_at  timestamptz not null default now(),
  primary key (account_id, user_id)
);
create index members_user_idx on public.members(user_id);

-- Membership check used by every policy. SECURITY DEFINER so it can read members
-- without recursing through members' own RLS.
create function public.is_member(acc uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members m
    where m.account_id = acc and m.user_id = auth.uid()
  );
$$;

-- Every new sign-up gets an account and becomes its owner.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acc uuid;
begin
  insert into public.accounts (name)
  values (coalesce(split_part(new.email, '@', 1), 'My account'))
  returning id into acc;
  insert into public.members (account_id, user_id, role) values (acc, new.id, 'owner');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────────────────── Stores and secrets ─────────────────────────
create table public.stores (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references public.accounts(id) on delete cascade,
  shop_domain      text not null unique check (shop_domain ~ '^[a-z0-9][a-z0-9-]*\.myshopify\.com$'),
  client_id        text not null,
  status           text not null default 'connected'
                     check (status in ('connected', 'needs_attention', 'disconnected')),
  granted_scopes   text[] not null default '{}',
  currency_code    text,
  last_checked_at  timestamptz,
  last_error       text,
  created_at       timestamptz not null default now()
);
create index stores_account_idx on public.stores(account_id);

-- Encrypted client secret (envelope encryption done in the app).
-- RLS is enabled with NO policies: only the service role can read or write it.
create table public.store_secrets (
  store_id     uuid primary key references public.stores(id) on delete cascade,
  blob         text not null,           -- versioned envelope: wrapped data key + iv + ciphertext + tag
  key_version  int  not null default 1,
  updated_at   timestamptz not null default now()
);

-- ───────────────────────── Templates ─────────────────────────
create table public.export_templates (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid references public.accounts(id) on delete cascade, -- null = built-in
  slug        text,
  name        text not null,
  resource    text not null check (resource in ('products','orders','customers','inventory','collections')),
  config      jsonb not null,
  created_at  timestamptz not null default now()
);
create index export_templates_account_idx on public.export_templates(account_id);

-- ───────────────────────── Jobs (the queue) ─────────────────────────
create table public.export_jobs (
  id                uuid primary key default gen_random_uuid(),
  account_id        uuid not null references public.accounts(id) on delete cascade,
  store_id          uuid not null references public.stores(id) on delete cascade,
  template_id       uuid references public.export_templates(id) on delete set null,
  trigger           text not null default 'manual' check (trigger in ('manual', 'schedule')),
  resource          text not null,
  config            jsonb not null,                 -- snapshot of what was requested
  status            text not null default 'queued'
                      check (status in ('queued','starting','shopify_running','downloading',
                                        'building','publishing','delivering',
                                        'succeeded','failed','cancelled','expired')),
  idempotency_key   text not null unique,
  attempt           int  not null default 0,
  max_attempts      int  not null default 5,
  run_after         timestamptz not null default now(),   -- backoff: not claimable before this
  locked_by         text,
  lease_until       timestamptz,
  shopify_bulk_op   text,                                 -- stored immediately so retries reattach
  rows_written      bigint not null default 0,
  bytes_written     bigint not null default 0,
  error_code        text,
  error_detail      text,
  created_at        timestamptz not null default now(),
  started_at        timestamptz,
  finished_at       timestamptz
);
-- Fast claim lookup: only open jobs.
create index export_jobs_claim_idx on public.export_jobs (run_after)
  where status = 'queued';
create index export_jobs_lease_idx on public.export_jobs (lease_until)
  where status in ('starting','shopify_running','downloading','building','publishing','delivering');
create index export_jobs_store_idx on public.export_jobs (store_id, created_at desc);
create index export_jobs_account_idx on public.export_jobs (account_id, created_at desc);

create table public.export_job_events (
  id      bigint generated always as identity primary key,
  job_id  uuid not null references public.export_jobs(id) on delete cascade,
  at      timestamptz not null default now(),
  state   text not null,
  detail  text
);
create index export_job_events_job_idx on public.export_job_events(job_id, at);

create table public.export_files (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references public.export_jobs(id) on delete cascade,
  account_id  uuid not null references public.accounts(id) on delete cascade,
  storage_key text not null,
  format      text not null check (format in ('csv','tsv','xlsx')),
  part        int  not null default 1,
  size_bytes  bigint not null default 0,
  row_count   bigint not null default 0,
  sha256      text,
  expires_at  timestamptz not null,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index export_files_job_idx on public.export_files(job_id);
create index export_files_expiry_idx on public.export_files(expires_at) where deleted_at is null;

create table public.audit_log (
  id          bigint generated always as identity primary key,
  account_id  uuid references public.accounts(id) on delete set null,
  actor_id    uuid,
  action      text not null,
  target      text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_log_account_idx on public.audit_log(account_id, created_at desc);

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.accounts          enable row level security;
alter table public.members           enable row level security;
alter table public.stores            enable row level security;
alter table public.store_secrets     enable row level security;  -- no policies on purpose
alter table public.export_templates  enable row level security;
alter table public.export_jobs       enable row level security;
alter table public.export_job_events enable row level security;
alter table public.export_files      enable row level security;
alter table public.audit_log         enable row level security;

-- Read-only access for signed-in members of the owning account.
create policy accounts_read on public.accounts
  for select to authenticated using (public.is_member(id));

create policy members_read on public.members
  for select to authenticated using (public.is_member(account_id));

create policy stores_read on public.stores
  for select to authenticated using (public.is_member(account_id));

create policy templates_read on public.export_templates
  for select to authenticated using (account_id is null or public.is_member(account_id));

create policy jobs_read on public.export_jobs
  for select to authenticated using (public.is_member(account_id));

create policy job_events_read on public.export_job_events
  for select to authenticated using (
    exists (select 1 from public.export_jobs j
            where j.id = export_job_events.job_id and public.is_member(j.account_id))
  );

create policy files_read on public.export_files
  for select to authenticated using (public.is_member(account_id));

create policy audit_read on public.audit_log
  for select to authenticated using (account_id is not null and public.is_member(account_id));

-- Anonymous visitors get nothing. Signed-in users get read-only (grants below);
-- all writes are done server-side with the service role.
revoke all on all tables in schema public from anon;
revoke all on all tables in schema public from authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant select on public.accounts, public.members, public.stores, public.export_templates,
               public.export_jobs, public.export_job_events, public.export_files,
               public.audit_log to authenticated;
-- store_secrets: no grants for anon or authenticated.
revoke all on public.store_secrets from anon, authenticated;

-- ───────────────────────── Queue functions (service role only) ─────────────────────────

-- Claim the next runnable job. FOR UPDATE SKIP LOCKED lets many workers pull safely.
-- Per-store concurrency: skip a store that already has a job in flight.
create function public.claim_export_job(p_worker text, p_lease_seconds int default 60)
returns public.export_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  j public.export_jobs;
begin
  select * into j
  from public.export_jobs q
  where q.status = 'queued'
    and q.run_after <= now()
    and not exists (
      select 1 from public.export_jobs r
      where r.store_id = q.store_id
        and r.status in ('starting','shopify_running','downloading','building','publishing','delivering')
        and r.lease_until > now()
    )
  order by q.created_at
  for update skip locked
  limit 1;

  if not found then
    return null;
  end if;

  update public.export_jobs
     set status      = 'starting',
         attempt     = attempt + 1,
         locked_by   = p_worker,
         lease_until = now() + make_interval(secs => p_lease_seconds),
         started_at  = coalesce(started_at, now())
   where id = j.id
   returning * into j;

  insert into public.export_job_events (job_id, state, detail)
  values (j.id, 'starting', 'claimed by ' || p_worker || ' (attempt ' || j.attempt || ')');

  return j;
end;
$$;

-- Extend the lease while a worker is alive. Returns false if the lease was lost.
create function public.heartbeat_export_job(p_job uuid, p_worker text, p_lease_seconds int default 60)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.export_jobs
     set lease_until = now() + make_interval(secs => p_lease_seconds)
   where id = p_job and locked_by = p_worker
     and status in ('starting','shopify_running','downloading','building','publishing','delivering');
  return found;
end;
$$;

-- Return jobs whose worker vanished to the queue (with exponential backoff), or fail them
-- once attempts are exhausted. Run every minute from /api/tick.
create function public.reap_expired_jobs()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  n int := 0;
  r record;
begin
  for r in
    select id, attempt, max_attempts from public.export_jobs
    where status in ('starting','shopify_running','downloading','building','publishing','delivering')
      and lease_until < now()
    for update skip locked
  loop
    if r.attempt >= r.max_attempts then
      update public.export_jobs
         set status = 'failed', error_code = 'worker_lost',
             error_detail = 'The export stopped responding too many times.',
             finished_at = now(), locked_by = null, lease_until = null
       where id = r.id;
      insert into public.export_job_events (job_id, state, detail)
      values (r.id, 'failed', 'lease expired; attempts exhausted');
    else
      update public.export_jobs
         set status = 'queued', locked_by = null, lease_until = null,
             run_after = now() + make_interval(secs => least(300, 5 * power(2, r.attempt)::int))
       where id = r.id;
      insert into public.export_job_events (job_id, state, detail)
      values (r.id, 'queued', 'lease expired; requeued with backoff');
    end if;
    n := n + 1;
  end loop;
  return n;
end;
$$;

revoke all on function public.claim_export_job(text, int)             from public, anon, authenticated;
revoke all on function public.heartbeat_export_job(uuid, text, int)   from public, anon, authenticated;
revoke all on function public.reap_expired_jobs()                     from public, anon, authenticated;
grant execute on function public.claim_export_job(text, int)           to service_role;
grant execute on function public.heartbeat_export_job(uuid, text, int) to service_role;
grant execute on function public.reap_expired_jobs()                   to service_role;

-- ───────────────────────── Storage bucket (private) ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('exports', 'exports', false, 524288000)
on conflict (id) do nothing;
-- No storage policies: nothing is readable by anon/authenticated.
-- Downloads use short-lived signed URLs created by the server.
