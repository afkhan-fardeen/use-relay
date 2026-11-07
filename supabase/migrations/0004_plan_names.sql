-- Plans are now Starter / Growth / Scale (was starter / pro / agency).
-- Nothing is on a paid plan yet, but map any existing rows safely before tightening the rule.
alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
update public.subscriptions set plan = 'growth' where plan = 'pro';
update public.subscriptions set plan = 'scale'  where plan = 'agency';
alter table public.subscriptions
  add constraint subscriptions_plan_check check (plan in ('starter', 'growth', 'scale'));
