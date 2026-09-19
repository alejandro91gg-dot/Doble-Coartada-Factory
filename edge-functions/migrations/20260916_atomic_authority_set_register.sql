create table if not exists public.factory_authority_register_sets (
  id uuid primary key default gen_random_uuid(),
  case_code text not null references public.factory_cases(case_code) on update cascade on delete restrict,
  idempotency_key text not null,
  manifest_sha256 text not null check (manifest_sha256 ~ '^[A-F0-9]{64}$'),
  request_members jsonb not null check (jsonb_typeof(request_members) = 'array'),
  request_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(request_metadata) = 'object'),
  authority_record_ids uuid[] not null,
  authority_ids text[] not null,
  registered_by text not null references public.factory_agents(agent_code) on update cascade on delete restrict,
  created_at timestamptz not null default now(),
  unique (case_code, idempotency_key)
);

alter table public.factory_authority_register_sets enable row level security;
revoke all on table public.factory_authority_register_sets from public, anon, authenticated;

create or replace function public.factory_register_authority_set(
  p_case_code text,
  p_idempotency_key text,
  p_manifest_sha256 text,
  p_members jsonb,
  p_actor text,
  p_metadata jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_existing public.factory_authority_register_sets%rowtype;
  v_member jsonb;
  v_record public.factory_authority_records%rowtype;
  v_case_code text := upper(trim(coalesce(p_case_code, '')));
  v_idempotency_key text := trim(coalesce(p_idempotency_key, ''));
  v_manifest_sha256 text := upper(trim(coalesce(p_manifest_sha256, '')));
  v_authority_id text;
  v_authority_type text;
  v_version text;
  v_sha256 text;
  v_source_document_key text;
  v_supporting_gate_id text;
  v_parent_authority_id text;
  v_current_parent text;
  v_member_metadata jsonb;
  v_record_ids uuid[] := array[]::uuid[];
  v_authority_ids text[] := array[]::text[];
  v_inserted int := 0;
  v_fail_after int := 0;
  v_set_id uuid;
  v_records jsonb;
begin
  if v_case_code !~ '^DC-[0-9]{3}$' then
    raise exception 'INVALID_CASE_CODE';
  end if;
  if length(v_idempotency_key) < 8 or length(v_idempotency_key) > 200 then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;
  if v_manifest_sha256 !~ '^[A-F0-9]{64}$' then
    raise exception 'INVALID_MANIFEST_SHA256';
  end if;
  if jsonb_typeof(p_members) is distinct from 'array' or jsonb_array_length(p_members) <> 3 then
    raise exception 'INVALID_AUTHORITY_SET_SIZE';
  end if;
  if jsonb_typeof(coalesce(p_metadata, '{}'::jsonb)) is distinct from 'object' then
    raise exception 'INVALID_SET_METADATA';
  end if;

  perform pg_advisory_xact_lock(hashtext('factory-register-set:' || v_case_code));
  perform 1 from public.factory_cases where case_code = v_case_code for update;
  if not found then raise exception 'CASE_NOT_FOUND'; end if;

  select * into v_existing
  from public.factory_authority_register_sets
  where case_code = v_case_code and idempotency_key = v_idempotency_key
  for update;

  if found then
    if v_existing.manifest_sha256 is distinct from v_manifest_sha256
      or v_existing.request_members is distinct from p_members
      or v_existing.request_metadata is distinct from coalesce(p_metadata, '{}'::jsonb)
      or v_existing.registered_by is distinct from p_actor then
      raise exception 'IDEMPOTENCY_KEY_REUSE_MISMATCH';
    end if;
    select jsonb_agg(to_jsonb(r) order by r.authority_type) into v_records
    from public.factory_authority_records r
    where r.id = any(v_existing.authority_record_ids);
    if coalesce(jsonb_array_length(v_records), 0) <> 3 then
      raise exception 'AUTHORITY_REGISTER_SET_CORRUPT';
    end if;
    return jsonb_build_object(
      'case_code', v_case_code,
      'register_set_id', v_existing.id,
      'idempotency_key', v_idempotency_key,
      'manifest_sha256', v_manifest_sha256,
      'idempotent_replay', true,
      'records', v_records
    );
  end if;

  if (select count(distinct upper(trim(item->>'authority_type'))) from jsonb_array_elements(p_members) item) <> 3
    or (select count(*) from jsonb_array_elements(p_members) item
        where upper(trim(item->>'authority_type')) in ('CASE_CANON','CASE_LOGIC','PRODUCTION_STATE')) <> 3 then
    raise exception 'AUTHORITY_SET_TYPE_MISMATCH';
  end if;
  if (select count(distinct trim(item->>'authority_id')) from jsonb_array_elements(p_members) item) <> 3 then
    raise exception 'DUPLICATE_AUTHORITY_ID';
  end if;

  begin
    v_fail_after := coalesce(nullif(current_setting('factory.test_register_fail_after', true), '')::int, 0);
  exception when others then
    v_fail_after := 0;
  end;

  for v_member in select value from jsonb_array_elements(p_members)
  loop
    v_authority_id := trim(coalesce(v_member->>'authority_id', ''));
    v_authority_type := upper(trim(coalesce(v_member->>'authority_type', '')));
    v_version := trim(coalesce(v_member->>'version', ''));
    v_sha256 := upper(trim(coalesce(v_member->>'sha256', '')));
    v_source_document_key := nullif(trim(coalesce(v_member->>'source_document_key', '')), '');
    v_supporting_gate_id := nullif(trim(coalesce(v_member->>'supporting_gate_id', '')), '');
    v_parent_authority_id := nullif(trim(coalesce(v_member->>'parent_authority_id', '')), '');
    v_member_metadata := coalesce(v_member->'metadata', '{}'::jsonb);

    if v_authority_id = '' or v_version = '' or v_sha256 !~ '^[A-F0-9]{64}$'
      or v_authority_type not in ('CASE_CANON','CASE_LOGIC','PRODUCTION_STATE') then
      raise exception 'INVALID_AUTHORITY_RECORD';
    end if;
    if jsonb_typeof(v_member_metadata) is distinct from 'object' then
      raise exception 'INVALID_AUTHORITY_METADATA';
    end if;
    if exists(select 1 from public.factory_authority_records where authority_id = v_authority_id) then
      raise exception 'AUTHORITY_ID_CONFLICT';
    end if;
    if exists(select 1 from public.factory_authority_records
      where case_code = v_case_code and authority_type = v_authority_type
        and version = v_version and sha256 = v_sha256) then
      raise exception 'AUTHORITY_VERSION_HASH_CONFLICT';
    end if;

    select r.authority_id into v_current_parent
    from public.factory_authority_current c
    join public.factory_authority_records r on r.id = c.authority_record_id
    where c.case_code = v_case_code and c.authority_type = v_authority_type;
    if found then
      if v_parent_authority_id is distinct from v_current_parent then
        raise exception 'PARENT_AUTHORITY_MISMATCH';
      end if;
    elsif v_parent_authority_id is not null then
      raise exception 'PARENT_AUTHORITY_WITHOUT_CURRENT';
    end if;

    if v_source_document_key is not null and not exists(
      select 1 from public.factory_documents d
      where d.document_key = v_source_document_key and d.case_code = v_case_code and d.sha256 = v_sha256
    ) then
      raise exception 'SOURCE_DOCUMENT_MISMATCH';
    end if;
    if v_supporting_gate_id is not null and not exists(
      select 1 from public.factory_gate_records g
      where g.gate_id = v_supporting_gate_id and g.case_code = v_case_code
    ) then
      raise exception 'SUPPORTING_GATE_MISMATCH';
    end if;

    insert into public.factory_authority_records(
      authority_id, case_code, authority_type, version, sha256,
      source_document_key, supporting_gate_id, state, registered_by, metadata
    ) values (
      v_authority_id, v_case_code, v_authority_type, v_version, v_sha256,
      v_source_document_key, v_supporting_gate_id, 'staged', p_actor,
      (v_member_metadata - '_atomic_register') || jsonb_build_object(
        '_atomic_register', jsonb_build_object(
          'idempotency_key', v_idempotency_key,
          'manifest_sha256', v_manifest_sha256,
          'parent_authority_id', v_parent_authority_id
        )
      )
    ) returning * into v_record;

    v_record_ids := array_append(v_record_ids, v_record.id);
    v_authority_ids := array_append(v_authority_ids, v_record.authority_id);
    v_inserted := v_inserted + 1;
    if v_fail_after between 1 and 3 and v_inserted = v_fail_after then
      raise exception 'TEST_INJECTED_FAILURE_MEMBER_%', v_inserted;
    end if;
  end loop;

  insert into public.factory_authority_register_sets(
    case_code, idempotency_key, manifest_sha256, request_members, request_metadata,
    authority_record_ids, authority_ids, registered_by
  ) values (
    v_case_code, v_idempotency_key, v_manifest_sha256, p_members,
    coalesce(p_metadata, '{}'::jsonb), v_record_ids, v_authority_ids, p_actor
  ) returning id into v_set_id;

  insert into public.factory_audit_log(actor, action, entity_type, entity_id, payload)
  values (
    p_actor, 'AUTHORITY_SET_REGISTERED', 'authority_register_set', v_set_id::text,
    jsonb_build_object(
      'case_code', v_case_code,
      'idempotency_key', v_idempotency_key,
      'manifest_sha256', v_manifest_sha256,
      'authority_ids', to_jsonb(v_authority_ids),
      'authority_record_ids', to_jsonb(v_record_ids)
    )
  );

  select jsonb_agg(to_jsonb(r) order by r.authority_type) into v_records
  from public.factory_authority_records r where r.id = any(v_record_ids);
  return jsonb_build_object(
    'case_code', v_case_code,
    'register_set_id', v_set_id,
    'idempotency_key', v_idempotency_key,
    'manifest_sha256', v_manifest_sha256,
    'idempotent_replay', false,
    'records', v_records
  );
end;
$function$;

revoke all on function public.factory_register_authority_set(text,text,text,jsonb,text,jsonb) from public, anon, authenticated;
grant execute on function public.factory_register_authority_set(text,text,text,jsonb,text,jsonb) to service_role;
