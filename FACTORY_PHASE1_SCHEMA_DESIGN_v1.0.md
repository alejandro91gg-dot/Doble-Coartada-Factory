# Factory Phase 1 Schema Design v1.0

## Approved Model

`CASE AUTHORITY → CASE CORE → EDITION PROFILE → SKU RELEASE`

The only authority domains remain `CASE_CANON`, `CASE_LOGIC`, and `PRODUCTION_STATE`. Phase 1 does not add authority types or mutate authority records. A Case Core is an immutable projection reference to one current authoritative/frozen triplet.

## Additive Objects

| Object | Purpose |
|---|---|
| `factory_case_cores` | Versioned projection of the exact authority triplet |
| `factory_edition_profiles` | Edition-specific physical, visual, evidence, packaging, and audio manifests |
| `factory_sku_releases` | Release vocabulary; no Phase 1 approvals are created |
| `factory_production_artifacts` | Typed, hashed production outputs and provenance |
| `factory_scoped_gate_runs` | Case/visual/edition/audio/SKU-scoped gate evidence |
| `factory_production_jobs` | Idempotent production work definitions |
| `factory_production_job_attempts` | Retry history and output linkage |
| `factory_dependency_links` | Typed, case-isolated dependency graph |
| `factory_v2_case_state` | Security-invoker read projection |

## Enforced Contracts

- Edition codes are exactly `ECONOMICO`, `ESTANDAR`, and `PREMIUM`.
- ECONOMICO has no audio. ESTANDAR and PREMIUM include optional player audio. All editions enforce `audio_required_for_solution=false`.
- Validated editions require a verified non-audio solution path. Validated ESTANDAR/PREMIUM profiles also require semantic-equivalence evidence and a non-empty audio manifest.
- G12 requires an Edition Profile and `EDITION` or `SKU_RELEASE` scope. ECONOMICO rejects audio-scoped gates.
- Case Core, profiles, releases, artifacts, jobs, attempts, gates, and dependency links reject cross-case references.
- Gate writes and release approval fields accept A0 only; S0 remains technical/infrastructure.
- Case-scoped idempotency keys, uniqueness constraints, typed checks, foreign keys, and covering indexes make retries deterministic.

## Security and API

All eight tables have RLS enabled and no client policies: browser access is deny-by-default. Grants for `PUBLIC`, `anon`, and `authenticated` are revoked. `service_role` has `SELECT` only; Phase 1 deliberately exposes no database writer.

`edge-functions/factory-api-v2-read` is a custom-key-authenticated GET-only service. It provides capability discovery, case state, cores, profiles, releases, artifacts, gates, and jobs. It rejects unauthenticated access and every non-GET method.

## Deployment State

Migration `factory_v2_phase1_state` (`20260919003525`) and Edge Function version 1 are active only in Synthetic. All new tables are empty after tests. Production authority mutations and Production deployment remain blocked pending A0 review.
