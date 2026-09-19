# Repository Guidelines

## Project Structure

- `edge-functions/`: maintained Supabase Edge Function sources. Preserve deployed compatibility layers until a reviewed migration retires them.
- `supabase/migrations/`: ordered, additive database migrations for Factory v2.0.
- `tests/`: schema contract and regression tests. Tests target Synthetic by default.
- `baselines/`: immutable snapshots of deployed code, database structure, hashes, and drift reports.
- `docs/`: architecture, runbooks, rollback plans, and historical operator instructions.
- `recovery-delivery/` and `tmp/`: legacy/recovery evidence. Treat as non-authoritative and never delete or promote implicitly.

## Factory v2.0 Model

The governing chain is:

`CASE AUTHORITY → CASE CORE → EDITION PROFILE → SKU RELEASE`

The only authority domains are `CASE_CANON`, `CASE_LOGIC`, and `PRODUCTION_STATE`. Case Core is a projection referencing one exact authority triplet. Editions are `ECONOMICO`, `ESTANDAR`, and `PREMIUM`; all must set `audio_required_for_solution=false`.

## Roles

- A0: sole authority for canon promotion, gates, locks, and release.
- A1: canon, logic, evidence architecture, and constraints.
- A2: player-facing content preparation.
- A3: independent audit only; does not repair.
- A4: visual systems, V0–V4, and G9 production.
- S0: technical/infrastructure supervision only; no narrative, gate, lock, or release authority.
- Codex: technical operator, automation, testing, transport, and diagnostics.

## Development and Verification

Use PowerShell from the repository root:

- `git status --short`: inspect local changes.
- `pwsh -File tests/static/run-phase0-phase1.ps1`: run local artifact and read-only API checks.
- Execute `tests/sql/factory_v2_phase1_contract.sql` against Synthetic through the approved Supabase SQL runner; it wraps fixtures in `BEGIN`/`ROLLBACK`.
- Synthetic project: `dzsuprknwgwjymeiiwzz`.
- Production project: `hquaviunbwghkxojndgj`; keep read-only until an implementation return is approved.

Use lowercase snake_case for SQL objects, TypeScript with two-space indentation, explicit input validation, SHA-256 identifiers, and idempotency keys for mutations. Enable RLS on every public table; revoke access from `PUBLIC`, `anon`, and `authenticated` unless a reviewed policy requires it.

## Change and Review Rules

Migrations must be additive, idempotent, reversible, and tested in Synthetic first. Never infer authority from sync, documents, handoffs, local files, or conversation history. Do not mutate DC-001 v5.0 or promote DC-002 while Phase 0/1 is active.

Commits should use imperative Conventional Commit subjects, for example `feat(schema): add edition profiles`. Pull requests must describe schema impact, rollback, Synthetic evidence, authority invariants, and any deployment drift.

The prior DC-001 operator brief is preserved at `docs/legacy/AGENTS_DC001_OPERATOR_2026-09-16.md`.
