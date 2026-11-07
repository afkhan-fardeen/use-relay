-- Klyroo QR: saved codes, dynamic short links, and privacy-friendly scan counting.
-- Members read their own codes; every write goes through server actions (service role).
-- Scan rows hold NO IP address and no cookie ID: a visitor is a daily-rotating hash.

create table public.qr_codes (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  kind        text not null check (kind in ('url', 'text', 'wifi', 'vcard', 'email', 'sms', 'phone')),
  mode        text not null default 'static' check (mode in ('static', 'dynamic')),
  fields      jsonb not null default '{}'::jsonb,   -- what the person typed
  content     text not null,                         -- static: the encoded content. dynamic: the destination URL
  slug        text unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  style       jsonb not null default '{}'::jsonb,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint qr_dynamic_needs_url_and_slug check (mode = 'static' or (kind = 'url' and slug is not null))
);
create index qr_codes_account_idx on public.qr_codes (account_id, created_at desc);

create table public.qr_scans (
  id        bigint generated always as identity primary key,
  code_id   uuid not null references public.qr_codes(id) on delete cascade,
  at        timestamptz not null default now(),
  country   text,
  device    text,
  referrer  text,
  visitor   text
);
create index qr_scans_code_at_idx on public.qr_scans (code_id, at desc);

alter table public.qr_codes enable row level security;
alter table public.qr_scans enable row level security;  -- no policies: read only through the stats function

create policy qr_codes_read on public.qr_codes
  for select to authenticated using (public.is_member(account_id));

revoke all on public.qr_codes from anon, authenticated;
revoke all on public.qr_scans from anon, authenticated;
grant select on public.qr_codes to authenticated;

-- The redirect: ONE round trip. Finds the destination and records the scan (unless it is a bot).
create function public.qr_resolve_and_log(
  p_slug text, p_log boolean, p_country text, p_device text, p_referrer text, p_visitor text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  dest text;
begin
  select id, content into cid, dest
  from public.qr_codes
  where slug = p_slug and active and mode = 'dynamic';
  if not found then
    return null;
  end if;
  if p_log then
    insert into public.qr_scans (code_id, country, device, referrer, visitor)
    values (cid, left(p_country, 2), left(p_device, 20), left(p_referrer, 120), left(p_visitor, 32));
  end if;
  return dest;
end;
$$;

-- Scans this calendar month across all of an account's codes (for plan limits).
create function public.qr_month_scans(p_account uuid) returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)
  from public.qr_scans s
  join public.qr_codes c on c.id = s.code_id
  where c.account_id = p_account
    and s.at >= date_trunc('month', now());
$$;

-- Aggregated analytics for one code over the last N days.
create function public.qr_stats(p_code uuid, p_days int) returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with w as (
    select * from public.qr_scans
    where code_id = p_code and at >= date_trunc('day', now()) - make_interval(days => greatest(p_days, 1) - 1)
  )
  select jsonb_build_object(
    'total',    (select count(*) from public.qr_scans where code_id = p_code),
    'window',   (select count(*) from w),
    'unique',   (select count(distinct visitor) from w where visitor is not null),
    'by_day',   coalesce((select jsonb_agg(jsonb_build_object('day', d, 'n', n) order by d)
                          from (select (at at time zone 'utc')::date as d, count(*) as n from w group by 1) x), '[]'::jsonb),
    'devices',  coalesce((select jsonb_agg(jsonb_build_object('name', k, 'n', n) order by n desc)
                          from (select coalesce(device, 'other') as k, count(*) as n from w group by 1 order by 2 desc limit 6) x), '[]'::jsonb),
    'countries',coalesce((select jsonb_agg(jsonb_build_object('name', k, 'n', n) order by n desc)
                          from (select country as k, count(*) as n from w where country is not null group by 1 order by 2 desc limit 8) x), '[]'::jsonb),
    'referrers',coalesce((select jsonb_agg(jsonb_build_object('name', k, 'n', n) order by n desc)
                          from (select referrer as k, count(*) as n from w where referrer is not null group by 1 order by 2 desc limit 8) x), '[]'::jsonb)
  );
$$;

revoke all on function public.qr_resolve_and_log(text, boolean, text, text, text, text) from public, anon, authenticated;
revoke all on function public.qr_month_scans(uuid) from public, anon, authenticated;
revoke all on function public.qr_stats(uuid, int) from public, anon, authenticated;
grant execute on function public.qr_resolve_and_log(text, boolean, text, text, text, text) to service_role;
grant execute on function public.qr_month_scans(uuid) to service_role;
grant execute on function public.qr_stats(uuid, int) to service_role;
