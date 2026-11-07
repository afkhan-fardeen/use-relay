-- Billing moved from Paddle to Dodo Payments. Make the columns provider-neutral.
alter table public.subscriptions rename column paddle_customer_id to provider_customer_id;
alter table public.subscriptions rename column paddle_subscription_id to provider_subscription_id;
alter table public.subscriptions rename column price_id to product_id;
alter table public.paddle_events rename to billing_events;
