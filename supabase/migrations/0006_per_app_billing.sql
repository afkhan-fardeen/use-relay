-- Each Klyroo app has its own subscription. An account can hold one per app.
alter table public.subscriptions add column if not exists app text not null default 'export';
alter table public.subscriptions drop constraint if exists subscriptions_account_id_key;
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions drop constraint if exists subscriptions_app_check;
alter table public.subscriptions add constraint subscriptions_app_check check (app in ('export', 'qr'));
create unique index if not exists subscriptions_account_app_key on public.subscriptions (account_id, app);
