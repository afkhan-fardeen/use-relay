-- Platform apps: which Klyroo apps each account has switched on (Export, QR Codes, ...).
create table public.account_apps (
  account_id  uuid not null references public.accounts(id) on delete cascade,
  app         text not null check (app in ('export', 'qr')),
  created_at  timestamptz not null default now(),
  primary key (account_id, app)
);
alter table public.account_apps enable row level security;
create policy account_apps_read on public.account_apps
  for select to authenticated using (public.is_member(account_id));
revoke all on public.account_apps from anon, authenticated;
grant select on public.account_apps to authenticated;

-- Everyone who already exists keeps Export.
insert into public.account_apps (account_id, app)
select id, 'export' from public.accounts
on conflict do nothing;

-- Sign-up now collects a company name: use it as the account name.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  acc uuid;
  nm  text;
begin
  nm := nullif(trim(new.raw_user_meta_data ->> 'company'), '');
  if nm is null then nm := nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''); end if;
  if nm is null then nm := coalesce(nullif(split_part(new.email, '@', 1), ''), 'My account'); end if;
  insert into public.accounts (name) values (left(nm, 80)) returning id into acc;
  insert into public.members (account_id, user_id, role) values (acc, new.id, 'owner');
  return new;
end;
$$;
