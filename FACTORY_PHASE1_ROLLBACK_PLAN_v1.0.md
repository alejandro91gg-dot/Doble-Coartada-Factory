# Factory Phase 1 Rollback Plan v1.0

## Preconditions

Rollback is intended for Synthetic only unless A0 separately authorizes a later Production deployment and rollback. First stop clients of `factory-api-v2-read` and verify the eight Phase 1 tables are empty.

The rollback script intentionally aborts if any Phase 1 row exists. Export or explicitly dispose of those rows before retrying; never bypass the guard silently.

## Procedure

1. Capture table counts, function version, migration list, and advisor output.
2. Disable or remove the Synthetic `factory-api-v2-read` function through the approved deployment interface.
3. Execute `supabase/rollback/202609190001_factory_v2_phase1_state_rollback.sql` as one reviewed migration.
4. Verify the view, eight tables, validators, triggers, and helper functions no longer exist.
5. Verify all legacy Factory tables/functions and the authority triplet are unchanged.
6. Run the DC-001/DC-002 read-only invariant query and archive the result.

## Recovery

Reapply `supabase/migrations/202609190001_factory_v2_phase1_state.sql`, then execute `tests/sql/factory_v2_phase1_contract.sql`. The migration is idempotent and the test fixtures roll back. Redeploy the read-only Edge Function only after the suite returns PASS.

Rollback never updates or deletes `factory_authority_records`, `factory_authority_current`, legacy API releases, case canon, case logic, or production state.
