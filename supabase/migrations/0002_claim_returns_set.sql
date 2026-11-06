-- claim_export_job returned a composite; PostgREST turns "no job" into a row of NULLs.
-- Return a set instead so "nothing to do" is an empty array.
drop function public.claim_export_job(text, int);

create function public.claim_export_job(p_worker text, p_lease_seconds int default 60)
returns setof public.export_jobs
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
    return;
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

  return next j;
end;
$$;

revoke all on function public.claim_export_job(text, int) from public, anon, authenticated;
grant execute on function public.claim_export_job(text, int) to service_role;
