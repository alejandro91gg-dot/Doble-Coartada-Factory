-- Factory v2.0 Phase 1 contract tests.
-- Synthetic only. Every fixture is rolled back before the PASS row is emitted.

begin;

insert into public.factory_authority_records
  (id, authority_id, case_code, authority_type, version, sha256, state, registered_by, promoted_by, promoted_at)
values
  ('61000000-0000-0000-0000-000000000001','AUTH_TEST_906_CANON','DC-906','CASE_CANON','test-v1',repeat('A',64),'authoritative','A0','A0',now()),
  ('61000000-0000-0000-0000-000000000002','AUTH_TEST_906_LOGIC','DC-906','CASE_LOGIC','test-v1',repeat('B',64),'authoritative','A0','A0',now()),
  ('61000000-0000-0000-0000-000000000003','AUTH_TEST_906_PROD','DC-906','PRODUCTION_STATE','test-v1',repeat('C',64),'authoritative','A0','A0',now()),
  ('61000000-0000-0000-0000-000000000011','AUTH_TEST_907_CANON','DC-907','CASE_CANON','test-v1',repeat('D',64),'authoritative','A0','A0',now()),
  ('61000000-0000-0000-0000-000000000012','AUTH_TEST_907_LOGIC','DC-907','CASE_LOGIC','test-v1',repeat('E',64),'authoritative','A0','A0',now()),
  ('61000000-0000-0000-0000-000000000013','AUTH_TEST_907_PROD','DC-907','PRODUCTION_STATE','test-v1',repeat('F',64),'authoritative','A0','A0',now());

insert into public.factory_authority_current(case_code,authority_type,authority_record_id) values
  ('DC-906','CASE_CANON','61000000-0000-0000-0000-000000000001'),
  ('DC-906','CASE_LOGIC','61000000-0000-0000-0000-000000000002'),
  ('DC-906','PRODUCTION_STATE','61000000-0000-0000-0000-000000000003'),
  ('DC-907','CASE_CANON','61000000-0000-0000-0000-000000000011'),
  ('DC-907','CASE_LOGIC','61000000-0000-0000-0000-000000000012'),
  ('DC-907','PRODUCTION_STATE','61000000-0000-0000-0000-000000000013');

insert into public.factory_case_cores
  (id,case_code,core_version,case_canon_authority_record_id,case_logic_authority_record_id,production_state_authority_record_id,manifest_sha256,idempotency_key,created_by)
values
  ('62000000-0000-0000-0000-000000000001','DC-906','test-v1','61000000-0000-0000-0000-000000000001','61000000-0000-0000-0000-000000000002','61000000-0000-0000-0000-000000000003',repeat('1',64),'phase1-core-906','A0'),
  ('62000000-0000-0000-0000-000000000002','DC-907','test-v1','61000000-0000-0000-0000-000000000011','61000000-0000-0000-0000-000000000012','61000000-0000-0000-0000-000000000013',repeat('2',64),'phase1-core-907','A0');

insert into public.factory_edition_profiles
  (id,case_code,case_core_id,edition_code,profile_version,status,audio_included,audio_optional_for_player,audio_required_for_solution,audio_semantic_equivalence_verified,non_audio_solution_path_verified,audio_manifest,idempotency_key,created_by,validated_at)
values
  ('63000000-0000-0000-0000-000000000001','DC-906','62000000-0000-0000-0000-000000000001','ECONOMICO','test-v1','validated',false,false,false,false,true,'[]','phase1-edition-906-economico','A0',now()),
  ('63000000-0000-0000-0000-000000000002','DC-906','62000000-0000-0000-0000-000000000001','ESTANDAR','test-v1','validated',true,true,false,true,true,'[{"artifact_key":"audio-test-standard"}]','phase1-edition-906-estandar','A0',now()),
  ('63000000-0000-0000-0000-000000000003','DC-906','62000000-0000-0000-0000-000000000001','PREMIUM','test-v1','validated',true,true,false,true,true,'[{"artifact_key":"audio-test-premium"}]','phase1-edition-906-premium','A0',now()),
  ('63000000-0000-0000-0000-000000000011','DC-907','62000000-0000-0000-0000-000000000002','ECONOMICO','test-v1','validated',false,false,false,false,true,'[]','phase1-edition-907-economico','A0',now());

-- Idempotency: the same case-scoped key cannot create a second profile.
insert into public.factory_edition_profiles
  (id,case_code,case_core_id,edition_code,profile_version,status,audio_included,audio_optional_for_player,audio_required_for_solution,audio_semantic_equivalence_verified,non_audio_solution_path_verified,audio_manifest,idempotency_key,created_by,validated_at)
values
  ('63000000-0000-0000-0000-000000000099','DC-906','62000000-0000-0000-0000-000000000001','ECONOMICO','test-v1','validated',false,false,false,false,true,'[]','phase1-edition-906-economico','A0',now())
on conflict (case_code,idempotency_key) do nothing;

do $test$
begin
  if (select count(*) from public.factory_edition_profiles where case_code='DC-906' and idempotency_key='phase1-edition-906-economico') <> 1 then
    raise exception 'IDEMPOTENCY_TEST_FAILED';
  end if;
end;
$test$;

-- Invalid edition/audio combinations must be rejected.
do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_edition_profiles(id,case_code,case_core_id,edition_code,profile_version,audio_included,audio_optional_for_player,audio_required_for_solution,idempotency_key,created_by)
    values ('63000000-0000-0000-0000-000000000021','DC-906','62000000-0000-0000-0000-000000000001','ECONOMICO','invalid-audio',true,false,false,'invalid-economico-audio','A0');
  exception when others then
    rejected := position('INVALID_EDITION_AUDIO_COMBINATION' in sqlerrm) > 0;
    if not rejected then raise; end if;
  end;
  if not rejected then raise exception 'ECONOMICO_AUDIO_WAS_ACCEPTED'; end if;
end;
$test$;

do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_edition_profiles(id,case_code,case_core_id,edition_code,profile_version,audio_included,audio_optional_for_player,audio_required_for_solution,idempotency_key,created_by)
    values ('63000000-0000-0000-0000-000000000022','DC-906','62000000-0000-0000-0000-000000000001','ESTANDAR','invalid-audio',false,true,false,'invalid-standard-audio','A0');
  exception when others then
    rejected := position('INVALID_EDITION_AUDIO_COMBINATION' in sqlerrm) > 0;
    if not rejected then raise; end if;
  end;
  if not rejected then raise exception 'ESTANDAR_WITHOUT_AUDIO_WAS_ACCEPTED'; end if;
end;
$test$;

do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_edition_profiles(id,case_code,case_core_id,edition_code,profile_version,audio_included,audio_optional_for_player,audio_required_for_solution,idempotency_key,created_by)
    values ('63000000-0000-0000-0000-000000000023','DC-906','62000000-0000-0000-0000-000000000001','PREMIUM','invalid-required',true,true,true,'invalid-audio-required','A0');
  exception when others then
    rejected := position('INVALID_EDITION_AUDIO_COMBINATION' in sqlerrm) > 0 or sqlstate = '23514';
    if not rejected then raise; end if;
  end;
  if not rejected then raise exception 'AUDIO_REQUIRED_FOR_SOLUTION_WAS_ACCEPTED'; end if;
end;
$test$;

do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_edition_profiles(id,case_code,case_core_id,edition_code,profile_version,status,audio_included,audio_optional_for_player,audio_required_for_solution,audio_semantic_equivalence_verified,non_audio_solution_path_verified,audio_manifest,idempotency_key,created_by,validated_at)
    values ('63000000-0000-0000-0000-000000000024','DC-906','62000000-0000-0000-0000-000000000001','PREMIUM','invalid-empty-manifest','validated',true,true,false,true,true,'[]','invalid-empty-audio-manifest','A0',now());
  exception when others then
    rejected := position('AUDIO_MANIFEST_REQUIRED_FOR_VALIDATED_EDITION' in sqlerrm) > 0;
    if not rejected then raise; end if;
  end;
  if not rejected then raise exception 'EMPTY_VALIDATED_AUDIO_MANIFEST_WAS_ACCEPTED'; end if;
end;
$test$;

insert into public.factory_sku_releases
  (id,case_code,edition_profile_id,edition_code,release_version,status,idempotency_key,created_by)
values
  ('64000000-0000-0000-0000-000000000001','DC-906','63000000-0000-0000-0000-000000000001','ECONOMICO','test-v1','draft','phase1-release-906-economico','A0');

insert into public.factory_production_artifacts
  (id,artifact_key,case_code,case_core_id,edition_profile_id,artifact_type,artifact_version,sha256,size_bytes,media_type,storage_path,status,idempotency_key,created_by,validated_at)
values
  ('65000000-0000-0000-0000-000000000001','TEST-DC906-MANIFEST','DC-906','62000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001','MANIFEST','test-v1',repeat('3',64),42,'application/json','synthetic/tests/manifest.json','validated','phase1-artifact-906-manifest','A0',now());

insert into public.factory_production_jobs
  (id,job_key,case_code,case_core_id,edition_profile_id,job_type,status,input_fingerprint_sha256,idempotency_key,created_by,started_at,completed_at)
values
  ('66000000-0000-0000-0000-000000000001','TEST-DC906-QA','DC-906','62000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001','QA','succeeded',repeat('4',64),'phase1-job-906-qa','A0',now(),now());

insert into public.factory_production_job_attempts
  (id,job_id,attempt_number,status,output_artifact_id,completed_at)
values
  ('67000000-0000-0000-0000-000000000001','66000000-0000-0000-0000-000000000001',1,'succeeded','65000000-0000-0000-0000-000000000001',now());

insert into public.factory_scoped_gate_runs
  (id,gate_run_id,case_code,gate_code,scope_type,case_core_id,edition_profile_id,status,idempotency_key,recorded_by)
values
  ('68000000-0000-0000-0000-000000000001','TEST-DC906-G12-ECO','DC-906','G12','EDITION','62000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001','pending','phase1-gate-906-g12-eco','A0');

insert into public.factory_dependency_links
  (id,case_code,source_entity_type,source_entity_id,target_entity_type,target_entity_id,relation_type,created_by)
values
  ('69000000-0000-0000-0000-000000000001','DC-906','PRODUCTION_JOB','66000000-0000-0000-0000-000000000001','ARTIFACT','65000000-0000-0000-0000-000000000001','PRODUCES','A0');

-- Cross-case links and references must be rejected.
do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_production_artifacts(id,artifact_key,case_code,edition_profile_id,artifact_type,artifact_version,sha256,size_bytes,media_type,storage_path,idempotency_key,created_by)
    values ('65000000-0000-0000-0000-000000000002','TEST-CROSS-CASE','DC-906','63000000-0000-0000-0000-000000000011','MANIFEST','test-v1',repeat('5',64),1,'application/json','synthetic/tests/cross.json','phase1-cross-case-artifact','A0');
  exception when others then
    rejected := position('ARTIFACT_EDITION_MISMATCH' in sqlerrm) > 0;
    if not rejected then raise; end if;
  end;
  if not rejected then raise exception 'CROSS_CASE_ARTIFACT_WAS_ACCEPTED'; end if;
end;
$test$;

do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_dependency_links(case_code,source_entity_type,source_entity_id,target_entity_type,target_entity_id,relation_type,created_by)
    values ('DC-906','CASE_CORE','62000000-0000-0000-0000-000000000001','EDITION_PROFILE','63000000-0000-0000-0000-000000000011','DEPENDS_ON','A0');
  exception when others then
    rejected := position('CROSS_CASE_DEPENDENCY_FORBIDDEN' in sqlerrm) > 0;
    if not rejected then raise; end if;
  end;
  if not rejected then raise exception 'CROSS_CASE_DEPENDENCY_WAS_ACCEPTED'; end if;
end;
$test$;

-- G12 must be edition-scoped; audio gates are forbidden for ECONOMICO.
do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_scoped_gate_runs(gate_run_id,case_code,gate_code,scope_type,case_core_id,status,idempotency_key,recorded_by)
    values ('TEST-INVALID-G12-CORE','DC-906','G12','CASE_CORE','62000000-0000-0000-0000-000000000001','pending','invalid-g12-core-scope','A0');
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'CASE_SCOPED_G12_WAS_ACCEPTED'; end if;
end;
$test$;

do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_scoped_gate_runs(gate_run_id,case_code,gate_code,scope_type,case_core_id,edition_profile_id,status,idempotency_key,recorded_by)
    values ('TEST-INVALID-AUDIO-ECO','DC-906','AUD0','AUDIO','62000000-0000-0000-0000-000000000001','63000000-0000-0000-0000-000000000001','pending','invalid-audio-gate-eco','A0');
  exception when others then
    rejected := position('ECONOMICO_AUDIO_GATE_FORBIDDEN' in sqlerrm) > 0;
    if not rejected then raise; end if;
  end;
  if not rejected then raise exception 'ECONOMICO_AUDIO_GATE_WAS_ACCEPTED'; end if;
end;
$test$;

-- S0 has no gate or release authority in v2.0.
do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_scoped_gate_runs(gate_run_id,case_code,gate_code,scope_type,case_core_id,status,idempotency_key,recorded_by)
    values ('TEST-INVALID-S0-GATE','DC-906','G1','CASE_CORE','62000000-0000-0000-0000-000000000001','pending','invalid-s0-gate-writer','S0');
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'S0_GATE_WRITE_WAS_ACCEPTED'; end if;
end;
$test$;

do $test$
declare rejected boolean := false;
begin
  begin
    insert into public.factory_sku_releases(case_code,edition_profile_id,edition_code,release_version,status,manifest_sha256,idempotency_key,created_by,approved_by,approved_at)
    values ('DC-906','63000000-0000-0000-0000-000000000001','ECONOMICO','invalid-s0','approved',repeat('6',64),'invalid-s0-release-approval','A0','S0',now());
  exception when check_violation then rejected := true;
  end;
  if not rejected then raise exception 'S0_RELEASE_APPROVAL_WAS_ACCEPTED'; end if;
end;
$test$;

-- Security contract: RLS enabled, no public client grants, service_role read-only.
do $test$
begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
    where n.nspname='public' and c.relname in (
      'factory_case_cores','factory_edition_profiles','factory_sku_releases','factory_production_artifacts',
      'factory_production_jobs','factory_production_job_attempts','factory_scoped_gate_runs','factory_dependency_links'
    ) and not c.relrowsecurity
  ) then raise exception 'RLS_NOT_ENABLED'; end if;

  if exists (
    select 1 from information_schema.role_table_grants
    where table_schema='public'
      and table_name in ('factory_case_cores','factory_edition_profiles','factory_sku_releases','factory_production_artifacts','factory_production_jobs','factory_production_job_attempts','factory_scoped_gate_runs','factory_dependency_links')
      and grantee in ('PUBLIC','anon','authenticated')
  ) then raise exception 'PUBLIC_CLIENT_GRANT_FOUND'; end if;

  if exists (
    select 1 from information_schema.role_table_grants
    where table_schema='public'
      and table_name in ('factory_case_cores','factory_edition_profiles','factory_sku_releases','factory_production_artifacts','factory_production_jobs','factory_production_job_attempts','factory_scoped_gate_runs','factory_dependency_links')
      and grantee='service_role' and privilege_type <> 'SELECT'
  ) then raise exception 'SERVICE_ROLE_WRITE_GRANT_FOUND'; end if;
end;
$test$;

rollback;

select jsonb_build_object(
  'status','PASS',
  'suite','factory_v2_phase1_contract',
  'transaction_rolled_back',true,
  'checks',jsonb_build_array(
    'authority_projection','edition_model','audio_rules','g12_scope','cross_case_isolation',
    'typed_artifacts','jobs_attempts','dependency_links','idempotency','rls_grants','a0_only_gate_release'
  )
) as result;
