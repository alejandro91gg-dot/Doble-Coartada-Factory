-- Roll back only the additive Factory v2.0 Phase 1 objects.
-- Refuses to proceed when Phase 1 tables contain data.

do $rollback$
declare v_rows bigint;
begin
  select
    (select count(*) from public.factory_dependency_links)
    + (select count(*) from public.factory_scoped_gate_runs)
    + (select count(*) from public.factory_production_job_attempts)
    + (select count(*) from public.factory_production_jobs)
    + (select count(*) from public.factory_production_artifacts)
    + (select count(*) from public.factory_sku_releases)
    + (select count(*) from public.factory_edition_profiles)
    + (select count(*) from public.factory_case_cores)
  into v_rows;
  if v_rows <> 0 then
    raise exception 'PHASE1_ROLLBACK_BLOCKED_NONEMPTY_TABLES';
  end if;
end;
$rollback$;

drop view if exists public.factory_v2_case_state;
drop table if exists public.factory_dependency_links;
drop table if exists public.factory_scoped_gate_runs;
drop table if exists public.factory_production_job_attempts;
drop table if exists public.factory_production_jobs;
drop table if exists public.factory_production_artifacts;
drop table if exists public.factory_sku_releases;
drop table if exists public.factory_edition_profiles;
drop table if exists public.factory_case_cores;
drop function if exists public.factory_v2_validate_dependency_link();
drop function if exists public.factory_v2_entity_case(text,uuid);
drop function if exists public.factory_v2_validate_gate_run();
drop function if exists public.factory_v2_validate_job_attempt();
drop function if exists public.factory_v2_validate_job();
drop function if exists public.factory_v2_validate_artifact();
drop function if exists public.factory_v2_validate_release();
drop function if exists public.factory_v2_validate_edition_profile();
drop function if exists public.factory_v2_validate_case_core();
drop function if exists public.factory_v2_valid_edition_audio(text,boolean,boolean,boolean);
