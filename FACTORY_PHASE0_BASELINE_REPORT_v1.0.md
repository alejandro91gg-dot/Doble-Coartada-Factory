# Factory Phase 0 Baseline Report v1.0

Date: 2026-09-19  
Operator: Codex  
Production: `hquaviunbwghkxojndgj` (read-only)  
Synthetic: `dzsuprknwgwjymeiiwzz`

## Result

PASS. A Git repository was initialized on branch `main`, the deployed Production state was captured without changing runtime behavior, and legacy material was classified rather than deleted. The canonical repository layout is `edge-functions/`, `supabase/migrations/`, `supabase/rollback/`, `tests/`, `baselines/`, and `docs/`.

The root `AGENTS.md` now defines the v2.0 operating model and roles A0–A4, S0, and Codex. The prior instructions remain at `docs/legacy/AGENTS_DC001_OPERATOR_2026-09-16.md`. The old atomic-register experiment is frozen and documented in `docs/legacy/ATOMIC_REGISTER_EXPERIMENT_FROZEN.md`.

## Reproducible Inventory

The immutable Production snapshot is under `baselines/production/2026-09-19/`:

- `database/schema_inventory.json`: 13 legacy Factory tables, 14 functions, constraints, indexes, RLS state, API releases, and authority summaries.
- `edge_functions_inventory.json`: deployed function IDs, versions, and bundle hashes.
- `edge-functions/`: exact deployed source for `factory-api`, `factory-api-v13`, `factory-api-v14`, and `factory-api-premium`.
- `source_drift.json`: byte-level SHA-256 comparison.

The local snapshot is under `baselines/local/2026-09-19/`. `workspace_inventory.json` hashes canonical local inputs; `legacy_inventory.json` hashes 237 preserved files in `tmp/` and `recovery-delivery/` as `LEGACY_OR_RECOVERY_NOT_AUTHORITY`.

## Drift Findings

| Function | Release record | Local vs deployed |
|---|---:|---|
| `factory-api` | 1.1.0 | deployed-only; now captured |
| `factory-api-v13` | 1.3.0 | mismatch |
| `factory-api-v14` | 1.4.0 | mismatch |
| `factory-api-premium` | 2.0.0 | mismatch |

Deployed runtime metadata reported v13 `1.3.1`, v14 `1.4.1`, and Premium `2.0.2`; local sources contained later undeployed variants including the frozen atomic-register route. No drift was silently reconciled.

## Authority Invariants

Production verification at `2026-09-19T00:41:11Z`:

- DC-001 remains `authoritative` with the exact v5.0 `CASE_CANON`, `CASE_LOGIC`, and `PRODUCTION_STATE` pointers.
- DC-002 remains `draft`, with zero authority records and zero current pointers.
- Production contains zero Phase 1 tables; no migration or function was deployed there.

Supabase CLI was unavailable, so Management API/MCP reads were used for the baseline. Captured source and hashes make the state independently reviewable.
