-- Hardening: tighten function access, add missing indexes, and add data retention.

-- Trigger function: nobody should be able to call it directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create index if not exists export_jobs_template_idx on public.export_jobs (template_id);
create index if not exists export_files_account_idx on public.export_files (account_id);

-- Old rows we no longer need. Scans beyond 400 days (analytics show 30 days), webhook deliveries
-- beyond 180 days, finished job events beyond 90 days. Run by the scheduled tick.
create or replace function public.purge_old_data() returns jsonb
language plpgsql security definer set search_path = public as $$
declare scans int; evs int; jevs int;
begin
  delete from public.qr_scans where at < now() - interval '400 days';
  get diagnostics scans = row_count;
  delete from public.billing_events where received_at < now() - interval '180 days';
  get diagnostics evs = row_count;
  delete from public.export_job_events where at < now() - interval '90 days';
  get diagnostics jevs = row_count;
  return jsonb_build_object('qr_scans', scans, 'billing_events', evs, 'export_job_events', jevs);
end $$;
revoke execute on function public.purge_old_data() from public, anon, authenticated;
grant execute on function public.purge_old_data() to service_role;
