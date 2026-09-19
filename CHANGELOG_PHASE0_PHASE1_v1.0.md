# Changelog — Phase 0 + Phase 1 v1.0

## Added

- Initialized Git `main` baseline and canonical repository layout.
- Captured deployed Production Edge Function source, schema inventory, release metadata, drift, and SHA-256 hashes.
- Added the additive/idempotent Phase 1 migration and guarded rollback.
- Added typed Case Core, Edition Profile, SKU Release, artifact, gate, job/attempt, and dependency vocabulary.
- Added database validators for authority projection, edition/audio rules, scope, A0-only responsibilities, and cross-case isolation.
- Added GET-only `factory-api-v2-read` and SQL/static regression suites.

## Changed

- Replaced root `AGENTS.md` with the v2.0 repository guide.
- Preserved the prior operator brief under `docs/legacy/`.
- Classified the atomic-register experiment as frozen pending v2.0 redesign.

## Verified

- Migration dry run and two idempotent reapplications: PASS in Synthetic.
- Guarded rollback dry run inside `BEGIN`/`ROLLBACK`: PASS; all eight tables restored.
- SQL contract suite: PASS with all fixtures rolled back.
- API E2E: health 200, unauthenticated 401, authenticated reads 200, POST 405.
- RLS/grants, foreign-key indexes, audio validation, G12 scope, cross-case isolation, and idempotency: PASS.
- Synthetic Phase 1 rows, approved SKU releases, and temporary credentials: all zero after testing.
- DC-001 unchanged; DC-002 still draft; Production Phase 1 objects: zero.

## Not Changed

- No Production schema or Edge Function deployment.
- No authority promotion, freeze, supersession, gate result, lock, or release approval.
- No deletion of legacy material and no runtime change to deployed legacy APIs.
