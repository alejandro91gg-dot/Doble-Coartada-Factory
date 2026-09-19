# Codex Return to A0 — Phase 0 + Phase 1 v1.0

Return status: `PASS / READY_FOR_A0_REVIEW`  
Date: 2026-09-19  
Scope: Phase 0 + Phase 1 only

## Implemented

The repository now has a reproducible Git baseline, preserved deployed source, database/release inventories, explicit drift, a v2.0 `AGENTS.md`, and classified legacy material. Synthetic contains the additive typed state model for Case Core, Edition Profiles, SKU Releases, production artifacts, scoped gates, production jobs/attempts, and dependency links.

The new API is read-only. No writer or authority mutation endpoint was introduced. The prior atomic-register experiment remains frozen.

## Acceptance Evidence

| Acceptance item | Result |
|---|---|
| Reproducible Git/repository baseline | PASS |
| Deployed/local/release drift inventoried | PASS |
| A0–A4, S0 technical roles aligned | PASS |
| Additive/idempotent/reversible schema | PASS |
| Edition and machine-enforced audio model | PASS |
| G12 edition scope | PASS |
| Cross-case isolation | PASS |
| RLS/grants and FK indexes | PASS |
| Read-only API auth/method contract | PASS |
| DC-001 exact v5.0 triplet unchanged | PASS |
| DC-002 remains draft | PASS |
| Authority promotions / release approvals | ZERO / ZERO |

SQL contract coverage: `authority_projection`, `edition_model`, `audio_rules`, `g12_scope`, `cross_case_isolation`, `typed_artifacts`, `jobs_attempts`, `dependency_links`, `idempotency`, `rls_grants`, and `a0_only_gate_release`. The test transaction rolled back; every Phase 1 table remains empty.

The guarded rollback was also executed inside an outer transaction and rolled back successfully; all eight Phase 1 tables remained present afterward.

API E2E returned health `200`, missing credential `401`, authenticated capabilities/state `200`, and POST `405`. The temporary Synthetic credential was removed and verified at count zero.

## Deployment Boundary

Synthetic migration: active (`20260919003525`).  
Synthetic read-only function: active, version 1.  
Production Phase 1 tables/functions: zero.  
Production authority mutations: zero.

## A0 Decision Requested

Review and accept the Phase 0/1 contract before authorizing any Production deployment or Phase 2 writer workflow. Recommended next action is an A0 schema/contract decision; no Production mutation should occur from this return alone.
