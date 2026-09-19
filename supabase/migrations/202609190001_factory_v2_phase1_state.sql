-- Factory v2.0 Phase 1: additive typed state vocabulary.
-- No authority type, authority record, current pointer, canon, gate result, or release approval is mutated.

create table if not exists public.factory_case_cores (
  id uuid primary key default gen_random_uuid(),
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  core_version text not null,
  case_canon_authority_record_id uuid not null references public.factory_authority_records(id) on update cascade on delete restrict,
  case_logic_authority_record_id uuid not null references public.factory_authority_records(id) on update cascade on delete restrict,
  production_state_authority_record_id uuid not null references public.factory_authority_records(id) on update cascade on delete restrict,
  manifest_sha256 text not null check (manifest_sha256 ~ '^[A-F0-9]{64}$'),
  status text not null default 'active' check (status in ('active','superseded')),
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  superseded_at timestamptz,
  unique (case_code, core_version),
  unique (case_code, idempotency_key),
  unique (case_canon_authority_record_id, case_logic_authority_record_id, production_state_authority_record_id),
  check (length(trim(core_version)) > 0),
  check (length(trim(idempotency_key)) between 8 and 200),
  check ((status = 'superseded') = (superseded_at is not null))
);

create table if not exists public.factory_edition_profiles (
  id uuid primary key default gen_random_uuid(),
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  case_core_id uuid not null references public.factory_case_cores(id) on update cascade on delete restrict,
  edition_code text not null check (edition_code in ('ECONOMICO','ESTANDAR','PREMIUM')),
  profile_version text not null,
  status text not null default 'draft' check (status in ('draft','validated','superseded')),
  audio_included boolean not null,
  audio_optional_for_player boolean not null,
  audio_required_for_solution boolean not null default false check (audio_required_for_solution = false),
  audio_semantic_equivalence_verified boolean not null default false,
  non_audio_solution_path_verified boolean not null default false,
  evidence_manifest jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_manifest) = 'array'),
  physical_manifest jsonb not null default '[]'::jsonb check (jsonb_typeof(physical_manifest) = 'array'),
  visual_manifest jsonb not null default '[]'::jsonb check (jsonb_typeof(visual_manifest) = 'array'),
  audio_manifest jsonb not null default '[]'::jsonb check (jsonb_typeof(audio_manifest) = 'array'),
  packaging_manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(packaging_manifest) = 'object'),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  idempotency_key text not null,
  created_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  superseded_at timestamptz,
  unique (case_code, edition_code, profile_version),
  unique (case_code, idempotency_key),
  check (length(trim(profile_version)) > 0),
  check (length(trim(idempotency_key)) between 8 and 200),
  check (status <> 'validated' or validated_at is not null),
  check (status <> 'superseded' or superseded_at is not null)
);

create table if not exists public.factory_sku_releases (
  id uuid primary key default gen_random_uuid(),
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  edition_profile_id uuid not null references public.factory_edition_profiles(id) on update cascade on delete restrict,
  edition_code text not null check (edition_code in ('ECONOMICO','ESTANDAR','PREMIUM')),
  release_version text not null,
  status text not null default 'draft' check (status in ('draft','candidate','approved','superseded')),
  release_manifest jsonb not null default '{}'::jsonb check (jsonb_typeof(release_manifest) = 'object'),
  manifest_sha256 text check (manifest_sha256 is null or manifest_sha256 ~ '^[A-F0-9]{64}$'),
  package_sha256 text check (package_sha256 is null or package_sha256 ~ '^[A-F0-9]{64}$'),
  idempotency_key text not null,
  created_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  approved_by text references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  superseded_at timestamptz,
  unique (case_code, edition_code, release_version),
  unique (case_code, idempotency_key),
  check (length(trim(release_version)) > 0),
  check (length(trim(idempotency_key)) between 8 and 200),
  check (approved_by is null or approved_by = 'A0'),
  check ((approved_by is null) = (approved_at is null)),
  check (status <> 'approved' or (approved_by = 'A0' and approved_at is not null and manifest_sha256 is not null)),
  check (status <> 'superseded' or superseded_at is not null)
);

create table if not exists public.factory_production_artifacts (
  id uuid primary key default gen_random_uuid(),
  artifact_key text not null unique,
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  case_core_id uuid references public.factory_case_cores(id) on update cascade on delete restrict,
  edition_profile_id uuid references public.factory_edition_profiles(id) on update cascade on delete restrict,
  sku_release_id uuid references public.factory_sku_releases(id) on update cascade on delete restrict,
  artifact_type text not null check (artifact_type in (
    'SOURCE_DOCUMENT','PLAYER_DOCUMENT','VISUAL_RENDER','AUDIO_SOURCE','AUDIO_TTS_TEXT',
    'AUDIO_ASSET','ASR_TRANSCRIPT','QA_REPORT','MANIFEST','PACKAGE','OTHER'
  )),
  artifact_version text not null,
  sha256 text not null check (sha256 ~ '^[A-F0-9]{64}$'),
  size_bytes bigint not null check (size_bytes >= 0),
  media_type text not null,
  document_key text references public.factory_documents(document_key) on update cascade on delete restrict,
  storage_path text,
  source_artifact_id uuid references public.factory_production_artifacts(id) on update cascade on delete restrict,
  status text not null default 'draft' check (status in ('draft','validated','superseded')),
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  superseded_at timestamptz,
  unique (case_code, idempotency_key),
  check (length(trim(artifact_key)) > 0),
  check (length(trim(artifact_version)) > 0),
  check (length(trim(media_type)) > 0),
  check (length(trim(idempotency_key)) between 8 and 200),
  check (status <> 'validated' or validated_at is not null),
  check (status <> 'superseded' or superseded_at is not null),
  check (document_key is not null or storage_path is not null)
);

create table if not exists public.factory_production_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null unique,
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  case_core_id uuid references public.factory_case_cores(id) on update cascade on delete restrict,
  edition_profile_id uuid references public.factory_edition_profiles(id) on update cascade on delete restrict,
  sku_release_id uuid references public.factory_sku_releases(id) on update cascade on delete restrict,
  job_type text not null check (job_type in ('VALIDATION','RENDER','AUDIO_SYNTHESIS','ASR','QA','PACKAGE','EXPORT')),
  status text not null default 'pending' check (status in ('pending','running','succeeded','failed','blocked','cancelled')),
  input_fingerprint_sha256 text not null check (input_fingerprint_sha256 ~ '^[A-F0-9]{64}$'),
  idempotency_key text not null,
  parameters jsonb not null default '{}'::jsonb check (jsonb_typeof(parameters) = 'object'),
  created_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (case_code, idempotency_key),
  check (length(trim(job_key)) > 0),
  check (length(trim(idempotency_key)) between 8 and 200),
  check (status <> 'running' or started_at is not null),
  check (status not in ('succeeded','failed','cancelled') or completed_at is not null)
);

create table if not exists public.factory_production_job_attempts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.factory_production_jobs(id) on update cascade on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status text not null check (status in ('running','succeeded','failed','review_required')),
  output_artifact_id uuid references public.factory_production_artifacts(id) on update cascade on delete restrict,
  error_code text,
  error_detail text,
  metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(metrics) = 'object'),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (job_id, attempt_number),
  check (status = 'running' or completed_at is not null),
  check (status <> 'succeeded' or output_artifact_id is not null)
);

create table if not exists public.factory_scoped_gate_runs (
  id uuid primary key default gen_random_uuid(),
  gate_run_id text not null unique,
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  gate_code text not null check (gate_code ~ '^(G([0-9]|1[0-2])|V[0-4]|AUD[0-4])$'),
  scope_type text not null check (scope_type in ('CASE_CORE','VISUAL_SYSTEM','EDITION','AUDIO','SKU_RELEASE')),
  case_core_id uuid references public.factory_case_cores(id) on update cascade on delete restrict,
  edition_profile_id uuid references public.factory_edition_profiles(id) on update cascade on delete restrict,
  sku_release_id uuid references public.factory_sku_releases(id) on update cascade on delete restrict,
  candidate_sha256 text check (candidate_sha256 is null or candidate_sha256 ~ '^[A-F0-9]{64}$'),
  status text not null default 'pending' check (status in ('pending','pass','blocked','failed')),
  source_return_id uuid references public.factory_agent_returns(id) on update cascade on delete restrict,
  evidence_sha256 text check (evidence_sha256 is null or evidence_sha256 ~ '^[A-F0-9]{64}$'),
  supersedes_gate_run_id uuid references public.factory_scoped_gate_runs(id) on update cascade on delete restrict,
  idempotency_key text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  recorded_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (case_code, idempotency_key),
  check (length(trim(gate_run_id)) > 0),
  check (length(trim(idempotency_key)) between 8 and 200),
  check (recorded_by = 'A0'),
  check (gate_code <> 'G12' or (edition_profile_id is not null and scope_type in ('EDITION','SKU_RELEASE'))),
  check (scope_type <> 'AUDIO' or edition_profile_id is not null)
);

create table if not exists public.factory_dependency_links (
  id uuid primary key default gen_random_uuid(),
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  source_entity_type text not null check (source_entity_type in ('CASE_CORE','EDITION_PROFILE','SKU_RELEASE','ARTIFACT','GATE_RUN','PRODUCTION_JOB','JOB_ATTEMPT')),
  source_entity_id uuid not null,
  target_entity_type text not null check (target_entity_type in ('CASE_CORE','EDITION_PROFILE','SKU_RELEASE','ARTIFACT','GATE_RUN','PRODUCTION_JOB','JOB_ATTEMPT')),
  target_entity_id uuid not null,
  relation_type text not null check (relation_type in ('DERIVES_FROM','DEPENDS_ON','PRODUCES','VALIDATES','SUPERSEDES','PACKAGES')),
  required boolean not null default true,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (source_entity_type, source_entity_id, target_entity_type, target_entity_id, relation_type),
  check (not (source_entity_type = target_entity_type and source_entity_id = target_entity_id))
);

create or replace function public.factory_v2_valid_edition_audio(
  p_edition_code text,
  p_audio_included boolean,
  p_audio_optional_for_player boolean,
  p_audio_required_for_solution boolean
)
returns boolean
language sql
immutable
parallel safe
set search_path = public
as $function$
  select
    p_audio_required_for_solution = false
    and case p_edition_code
      when 'ECONOMICO' then p_audio_included = false and p_audio_optional_for_player = false
      when 'ESTANDAR' then p_audio_included = true and p_audio_optional_for_player = true
      when 'PREMIUM' then p_audio_included = true and p_audio_optional_for_player = true
      else false
    end;
$function$;

create or replace function public.factory_v2_validate_case_core()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_valid_count integer;
  v_current_count integer;
begin
  select count(*) into v_valid_count
  from public.factory_authority_records r
  where
    (r.id = new.case_canon_authority_record_id and r.case_code = new.case_code and r.authority_type = 'CASE_CANON' and r.state in ('authoritative','frozen'))
    or
    (r.id = new.case_logic_authority_record_id and r.case_code = new.case_code and r.authority_type = 'CASE_LOGIC' and r.state in ('authoritative','frozen'))
    or
    (r.id = new.production_state_authority_record_id and r.case_code = new.case_code and r.authority_type = 'PRODUCTION_STATE' and r.state in ('authoritative','frozen'));
  if v_valid_count <> 3 then raise exception 'CASE_CORE_AUTHORITY_SET_INVALID'; end if;

  select count(*) into v_current_count
  from public.factory_authority_current c
  where c.case_code = new.case_code and (
    (c.authority_type = 'CASE_CANON' and c.authority_record_id = new.case_canon_authority_record_id)
    or (c.authority_type = 'CASE_LOGIC' and c.authority_record_id = new.case_logic_authority_record_id)
    or (c.authority_type = 'PRODUCTION_STATE' and c.authority_record_id = new.production_state_authority_record_id)
  );
  if v_current_count <> 3 then raise exception 'CASE_CORE_NOT_CURRENT_AUTHORITY_SET'; end if;
  return new;
end;
$function$;

create or replace function public.factory_v2_validate_edition_profile()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_core_case text;
begin
  select case_code into v_core_case from public.factory_case_cores where id = new.case_core_id;
  if v_core_case is distinct from new.case_code then raise exception 'EDITION_CASE_CORE_MISMATCH'; end if;
  if not public.factory_v2_valid_edition_audio(new.edition_code,new.audio_included,new.audio_optional_for_player,new.audio_required_for_solution) then
    raise exception 'INVALID_EDITION_AUDIO_COMBINATION';
  end if;
  if new.edition_code = 'ECONOMICO' and (new.audio_semantic_equivalence_verified or jsonb_array_length(new.audio_manifest) <> 0) then
    raise exception 'ECONOMICO_AUDIO_FORBIDDEN';
  end if;
  if new.status = 'validated' and not new.non_audio_solution_path_verified then
    raise exception 'NON_AUDIO_SOLUTION_PATH_NOT_VERIFIED';
  end if;
  if new.status = 'validated' and new.edition_code in ('ESTANDAR','PREMIUM') and not new.audio_semantic_equivalence_verified then
    raise exception 'AUDIO_SEMANTIC_EQUIVALENCE_NOT_VERIFIED';
  end if;
  if new.status = 'validated' and new.edition_code in ('ESTANDAR','PREMIUM') and jsonb_array_length(new.audio_manifest) = 0 then
    raise exception 'AUDIO_MANIFEST_REQUIRED_FOR_VALIDATED_EDITION';
  end if;
  return new;
end;
$function$;

create or replace function public.factory_v2_validate_release()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_profile public.factory_edition_profiles%rowtype;
begin
  select * into v_profile from public.factory_edition_profiles where id = new.edition_profile_id;
  if not found or v_profile.case_code is distinct from new.case_code or v_profile.edition_code is distinct from new.edition_code then
    raise exception 'SKU_RELEASE_EDITION_MISMATCH';
  end if;
  if new.status in ('candidate','approved') and v_profile.status <> 'validated' then
    raise exception 'SKU_RELEASE_PROFILE_NOT_VALIDATED';
  end if;
  return new;
end;
$function$;

create or replace function public.factory_v2_validate_artifact()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if new.case_core_id is not null and not exists(select 1 from public.factory_case_cores x where x.id=new.case_core_id and x.case_code=new.case_code) then raise exception 'ARTIFACT_CASE_CORE_MISMATCH'; end if;
  if new.edition_profile_id is not null and not exists(select 1 from public.factory_edition_profiles x where x.id=new.edition_profile_id and x.case_code=new.case_code) then raise exception 'ARTIFACT_EDITION_MISMATCH'; end if;
  if new.sku_release_id is not null and not exists(select 1 from public.factory_sku_releases x where x.id=new.sku_release_id and x.case_code=new.case_code) then raise exception 'ARTIFACT_RELEASE_MISMATCH'; end if;
  if new.source_artifact_id is not null and not exists(select 1 from public.factory_production_artifacts x where x.id=new.source_artifact_id and x.case_code=new.case_code) then raise exception 'ARTIFACT_SOURCE_CASE_MISMATCH'; end if;
  if new.document_key is not null and not exists(select 1 from public.factory_documents x where x.document_key=new.document_key and x.case_code=new.case_code) then raise exception 'ARTIFACT_DOCUMENT_CASE_MISMATCH'; end if;
  return new;
end;
$function$;

create or replace function public.factory_v2_validate_job()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if new.case_core_id is not null and not exists(select 1 from public.factory_case_cores x where x.id=new.case_core_id and x.case_code=new.case_code) then raise exception 'JOB_CASE_CORE_MISMATCH'; end if;
  if new.edition_profile_id is not null and not exists(select 1 from public.factory_edition_profiles x where x.id=new.edition_profile_id and x.case_code=new.case_code) then raise exception 'JOB_EDITION_MISMATCH'; end if;
  if new.sku_release_id is not null and not exists(select 1 from public.factory_sku_releases x where x.id=new.sku_release_id and x.case_code=new.case_code) then raise exception 'JOB_RELEASE_MISMATCH'; end if;
  return new;
end;
$function$;

create or replace function public.factory_v2_validate_job_attempt()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_job_case text;
begin
  select case_code into v_job_case from public.factory_production_jobs where id=new.job_id;
  if new.output_artifact_id is not null and not exists(select 1 from public.factory_production_artifacts x where x.id=new.output_artifact_id and x.case_code=v_job_case) then
    raise exception 'JOB_ATTEMPT_ARTIFACT_CASE_MISMATCH';
  end if;
  return new;
end;
$function$;

create or replace function public.factory_v2_validate_gate_run()
returns trigger
language plpgsql
set search_path = public
as $function$
declare
  v_edition text;
begin
  if new.case_core_id is not null and not exists(select 1 from public.factory_case_cores x where x.id=new.case_core_id and x.case_code=new.case_code) then raise exception 'GATE_CASE_CORE_MISMATCH'; end if;
  if new.edition_profile_id is not null then
    select edition_code into v_edition from public.factory_edition_profiles where id=new.edition_profile_id and case_code=new.case_code;
    if not found then raise exception 'GATE_EDITION_MISMATCH'; end if;
  end if;
  if new.sku_release_id is not null and not exists(select 1 from public.factory_sku_releases x where x.id=new.sku_release_id and x.case_code=new.case_code and (new.edition_profile_id is null or x.edition_profile_id=new.edition_profile_id)) then raise exception 'GATE_RELEASE_MISMATCH'; end if;
  if new.scope_type='CASE_CORE' and (new.case_core_id is null or new.edition_profile_id is not null or new.sku_release_id is not null) then raise exception 'INVALID_CASE_CORE_GATE_SCOPE'; end if;
  if new.scope_type='EDITION' and new.edition_profile_id is null then raise exception 'INVALID_EDITION_GATE_SCOPE'; end if;
  if new.scope_type='SKU_RELEASE' and (new.edition_profile_id is null or new.sku_release_id is null) then raise exception 'INVALID_RELEASE_GATE_SCOPE'; end if;
  if new.scope_type='AUDIO' and v_edition='ECONOMICO' then raise exception 'ECONOMICO_AUDIO_GATE_FORBIDDEN'; end if;
  return new;
end;
$function$;

create or replace function public.factory_v2_entity_case(p_entity_type text, p_entity_id uuid)
returns text
language plpgsql
stable
set search_path = public
as $function$
declare v_case text;
begin
  case p_entity_type
    when 'CASE_CORE' then select case_code into v_case from public.factory_case_cores where id=p_entity_id;
    when 'EDITION_PROFILE' then select case_code into v_case from public.factory_edition_profiles where id=p_entity_id;
    when 'SKU_RELEASE' then select case_code into v_case from public.factory_sku_releases where id=p_entity_id;
    when 'ARTIFACT' then select case_code into v_case from public.factory_production_artifacts where id=p_entity_id;
    when 'GATE_RUN' then select case_code into v_case from public.factory_scoped_gate_runs where id=p_entity_id;
    when 'PRODUCTION_JOB' then select case_code into v_case from public.factory_production_jobs where id=p_entity_id;
    when 'JOB_ATTEMPT' then select j.case_code into v_case from public.factory_production_job_attempts a join public.factory_production_jobs j on j.id=a.job_id where a.id=p_entity_id;
    else raise exception 'INVALID_DEPENDENCY_ENTITY_TYPE';
  end case;
  if v_case is null then raise exception 'DEPENDENCY_ENTITY_NOT_FOUND'; end if;
  return v_case;
end;
$function$;

create or replace function public.factory_v2_validate_dependency_link()
returns trigger
language plpgsql
set search_path = public
as $function$
begin
  if public.factory_v2_entity_case(new.source_entity_type,new.source_entity_id) is distinct from new.case_code
    or public.factory_v2_entity_case(new.target_entity_type,new.target_entity_id) is distinct from new.case_code then
    raise exception 'CROSS_CASE_DEPENDENCY_FORBIDDEN';
  end if;
  return new;
end;
$function$;

drop trigger if exists factory_v2_case_core_guard on public.factory_case_cores;
create trigger factory_v2_case_core_guard before insert or update on public.factory_case_cores for each row execute function public.factory_v2_validate_case_core();
drop trigger if exists factory_v2_edition_profile_guard on public.factory_edition_profiles;
create trigger factory_v2_edition_profile_guard before insert or update on public.factory_edition_profiles for each row execute function public.factory_v2_validate_edition_profile();
drop trigger if exists factory_v2_release_guard on public.factory_sku_releases;
create trigger factory_v2_release_guard before insert or update on public.factory_sku_releases for each row execute function public.factory_v2_validate_release();
drop trigger if exists factory_v2_artifact_guard on public.factory_production_artifacts;
create trigger factory_v2_artifact_guard before insert or update on public.factory_production_artifacts for each row execute function public.factory_v2_validate_artifact();
drop trigger if exists factory_v2_job_guard on public.factory_production_jobs;
create trigger factory_v2_job_guard before insert or update on public.factory_production_jobs for each row execute function public.factory_v2_validate_job();
drop trigger if exists factory_v2_job_attempt_guard on public.factory_production_job_attempts;
create trigger factory_v2_job_attempt_guard before insert or update on public.factory_production_job_attempts for each row execute function public.factory_v2_validate_job_attempt();
drop trigger if exists factory_v2_gate_run_guard on public.factory_scoped_gate_runs;
create trigger factory_v2_gate_run_guard before insert or update on public.factory_scoped_gate_runs for each row execute function public.factory_v2_validate_gate_run();
drop trigger if exists factory_v2_dependency_guard on public.factory_dependency_links;
create trigger factory_v2_dependency_guard before insert or update on public.factory_dependency_links for each row execute function public.factory_v2_validate_dependency_link();

create index if not exists factory_case_cores_case_status_idx on public.factory_case_cores(case_code,status,created_at desc);
create index if not exists factory_case_cores_canon_fk_idx on public.factory_case_cores(case_canon_authority_record_id);
create index if not exists factory_case_cores_logic_fk_idx on public.factory_case_cores(case_logic_authority_record_id);
create index if not exists factory_case_cores_production_fk_idx on public.factory_case_cores(production_state_authority_record_id);
create index if not exists factory_case_cores_created_by_idx on public.factory_case_cores(created_by);
create index if not exists factory_edition_profiles_core_idx on public.factory_edition_profiles(case_core_id);
create index if not exists factory_edition_profiles_case_edition_status_idx on public.factory_edition_profiles(case_code,edition_code,status,created_at desc);
create index if not exists factory_edition_profiles_created_by_idx on public.factory_edition_profiles(created_by);
create index if not exists factory_sku_releases_profile_idx on public.factory_sku_releases(edition_profile_id);
create index if not exists factory_sku_releases_case_edition_status_idx on public.factory_sku_releases(case_code,edition_code,status,created_at desc);
create index if not exists factory_sku_releases_created_by_idx on public.factory_sku_releases(created_by);
create index if not exists factory_sku_releases_approved_by_idx on public.factory_sku_releases(approved_by);
create index if not exists factory_production_artifacts_core_idx on public.factory_production_artifacts(case_core_id);
create index if not exists factory_production_artifacts_profile_idx on public.factory_production_artifacts(edition_profile_id);
create index if not exists factory_production_artifacts_release_idx on public.factory_production_artifacts(sku_release_id);
create index if not exists factory_production_artifacts_source_idx on public.factory_production_artifacts(source_artifact_id);
create index if not exists factory_production_artifacts_document_idx on public.factory_production_artifacts(document_key);
create index if not exists factory_production_artifacts_created_by_idx on public.factory_production_artifacts(created_by);
create index if not exists factory_production_artifacts_case_type_status_idx on public.factory_production_artifacts(case_code,artifact_type,status,created_at desc);
create index if not exists factory_production_jobs_core_idx on public.factory_production_jobs(case_core_id);
create index if not exists factory_production_jobs_profile_idx on public.factory_production_jobs(edition_profile_id);
create index if not exists factory_production_jobs_release_idx on public.factory_production_jobs(sku_release_id);
create index if not exists factory_production_jobs_created_by_idx on public.factory_production_jobs(created_by);
create index if not exists factory_production_jobs_case_type_status_idx on public.factory_production_jobs(case_code,job_type,status,created_at desc);
create index if not exists factory_job_attempts_job_idx on public.factory_production_job_attempts(job_id,attempt_number);
create index if not exists factory_job_attempts_output_idx on public.factory_production_job_attempts(output_artifact_id);
create index if not exists factory_scoped_gate_runs_core_idx on public.factory_scoped_gate_runs(case_core_id);
create index if not exists factory_scoped_gate_runs_profile_idx on public.factory_scoped_gate_runs(edition_profile_id);
create index if not exists factory_scoped_gate_runs_release_idx on public.factory_scoped_gate_runs(sku_release_id);
create index if not exists factory_scoped_gate_runs_source_return_idx on public.factory_scoped_gate_runs(source_return_id);
create index if not exists factory_scoped_gate_runs_supersedes_idx on public.factory_scoped_gate_runs(supersedes_gate_run_id);
create index if not exists factory_scoped_gate_runs_recorded_by_idx on public.factory_scoped_gate_runs(recorded_by);
create index if not exists factory_scoped_gate_runs_case_gate_scope_status_idx on public.factory_scoped_gate_runs(case_code,gate_code,scope_type,status,created_at desc);
create index if not exists factory_dependency_links_case_source_idx on public.factory_dependency_links(case_code,source_entity_type,source_entity_id);
create index if not exists factory_dependency_links_case_target_idx on public.factory_dependency_links(case_code,target_entity_type,target_entity_id);
create index if not exists factory_dependency_links_created_by_idx on public.factory_dependency_links(created_by);

alter table public.factory_case_cores enable row level security;
alter table public.factory_edition_profiles enable row level security;
alter table public.factory_sku_releases enable row level security;
alter table public.factory_production_artifacts enable row level security;
alter table public.factory_production_jobs enable row level security;
alter table public.factory_production_job_attempts enable row level security;
alter table public.factory_scoped_gate_runs enable row level security;
alter table public.factory_dependency_links enable row level security;

revoke all on public.factory_case_cores, public.factory_edition_profiles, public.factory_sku_releases,
  public.factory_production_artifacts, public.factory_production_jobs, public.factory_production_job_attempts,
  public.factory_scoped_gate_runs, public.factory_dependency_links from public, anon, authenticated, service_role;
grant select on public.factory_case_cores, public.factory_edition_profiles, public.factory_sku_releases,
  public.factory_production_artifacts, public.factory_production_jobs, public.factory_production_job_attempts,
  public.factory_scoped_gate_runs, public.factory_dependency_links to service_role;

revoke all on function public.factory_v2_valid_edition_audio(text,boolean,boolean,boolean) from public, anon, authenticated;
grant execute on function public.factory_v2_valid_edition_audio(text,boolean,boolean,boolean) to service_role;
revoke all on function public.factory_v2_entity_case(text,uuid) from public, anon, authenticated;
grant execute on function public.factory_v2_entity_case(text,uuid) to service_role;
revoke all on function public.factory_v2_validate_case_core() from public, anon, authenticated;
revoke all on function public.factory_v2_validate_edition_profile() from public, anon, authenticated;
revoke all on function public.factory_v2_validate_release() from public, anon, authenticated;
revoke all on function public.factory_v2_validate_artifact() from public, anon, authenticated;
revoke all on function public.factory_v2_validate_job() from public, anon, authenticated;
revoke all on function public.factory_v2_validate_job_attempt() from public, anon, authenticated;
revoke all on function public.factory_v2_validate_gate_run() from public, anon, authenticated;
revoke all on function public.factory_v2_validate_dependency_link() from public, anon, authenticated;

create or replace view public.factory_v2_case_state
with (security_invoker = true)
as
select
  c.case_code,
  c.authority_state,
  c.canon_version,
  c.logic_version,
  c.production_state_version,
  cc.id as case_core_id,
  cc.core_version,
  cc.manifest_sha256 as case_core_manifest_sha256,
  cc.status as case_core_status,
  ep.id as edition_profile_id,
  ep.edition_code,
  ep.profile_version,
  ep.status as edition_status,
  ep.audio_included,
  ep.audio_optional_for_player,
  ep.audio_required_for_solution,
  ep.non_audio_solution_path_verified,
  sr.id as sku_release_id,
  sr.release_version,
  sr.status as release_status
from public.factory_cases c
left join public.factory_case_cores cc on cc.case_code=c.case_code and cc.status='active'
left join public.factory_edition_profiles ep on ep.case_core_id=cc.id and ep.status in ('draft','validated')
left join public.factory_sku_releases sr on sr.edition_profile_id=ep.id and sr.status in ('draft','candidate','approved');

revoke all on public.factory_v2_case_state from public, anon, authenticated, service_role;
grant select on public.factory_v2_case_state to service_role;
