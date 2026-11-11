-- Support requests from the public /support form. Server-only: no browser access.
create table public.support_requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null,
  store_url   text,
  product     text not null,
  category    text not null,
  message     text not null,
  status      text not null default 'new' check (status in ('new', 'answered', 'closed')),
  emailed     boolean not null default false
);
create index support_requests_created_idx on public.support_requests (created_at desc);
alter table public.support_requests enable row level security;   -- no policies: service role only
revoke all on public.support_requests from anon, authenticated;

-- Retention: support requests are kept 24 months.
create or replace function public.purge_old_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare scans int; evs int; jevs int; sup int;
begin
  delete from public.qr_scans where at < now() - interval '400 days';
  get diagnostics scans = row_count;
  delete from public.billing_events where received_at < now() - interval '180 days';
  get diagnostics evs = row_count;
  delete from public.export_job_events where at < now() - interval '90 days';
  get diagnostics jevs = row_count;
  delete from public.support_requests where created_at < now() - interval '24 months';
  get diagnostics sup = row_count;
  return jsonb_build_object('qr_scans', scans, 'billing_events', evs, 'export_job_events', jevs, 'support_requests', sup);
end $$;
revoke execute on function public.purge_old_data() from public, anon, authenticated;
grant execute on function public.purge_old_data() to service_role;
