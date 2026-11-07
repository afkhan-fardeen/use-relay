-- Billing (Paddle). One subscription row per account, kept in sync by signed webhooks.
-- Clients can only READ their own subscription; all writes come from the webhook (service role).

create table public.subscriptions (
  id                      uuid primary key default gen_random_uuid(),
  account_id              uuid not null unique references public.accounts(id) on delete cascade,
  paddle_customer_id      text,
  paddle_subscription_id  text unique,
  price_id                text,
  plan                    text not null check (plan in ('starter', 'pro', 'agency')),
  status                  text not null check (status in ('trialing', 'active', 'past_due', 'paused', 'canceled')),
  current_period_end      timestamptz,
  cancel_at_period_end    boolean not null default false,
  last_event_at           timestamptz,           -- ignore older, out-of-order events
  updated_at              timestamptz not null default now()
);

-- Every webhook delivery is recorded once (idempotency) and can be audited.
create table public.paddle_events (
  event_id     text primary key,
  event_type   text not null,
  occurred_at  timestamptz,
  received_at  timestamptz not null default now(),
  processed_at timestamptz,
  status       text not null default 'received',   -- received | processed | ignored | error
  detail       text
);

alter table public.subscriptions  enable row level security;
alter table public.paddle_events  enable row level security;   -- no policies: service role only

create policy subscriptions_read on public.subscriptions
  for select to authenticated using (public.is_member(account_id));

revoke all on public.subscriptions from anon, authenticated;
revoke all on public.paddle_events from anon, authenticated;
grant select on public.subscriptions to authenticated;
