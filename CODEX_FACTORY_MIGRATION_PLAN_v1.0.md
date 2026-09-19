# Codex Factory Migration Plan v1.0

## Principles

Migration is additive, evidence-preserving and reversible. DC-001 authority remains untouched. DC-002 stays draft until A0 explicitly authorizes an authority action. The local atomic-register experiment is quarantined until the new model and tests are accepted.

## Phase 0 — Establish a reproducible baseline

**Work:** initialize version control; inventory deployed source; record database schema and API hashes; classify `recovery-delivery/` and `tmp/` as legacy/recovery inputs; reconcile `factory_api_releases` with actual deployments without changing runtime behavior.

**Tests:** clean checkout inventory, source/deployment hash report, read-only Production snapshot.

**Rollback:** documentation-only; no runtime mutation.

**A0 approval:** required to designate the canonical repository and retire any deployed-only source.

Also replace the case-specific root `AGENTS.md` with a repository-level operator guide after A0 resolves the S0/A0 boundary. Preserve the old brief as dated history rather than active routing law.

## Phase 1 — Add the v2.0 state vocabulary

**DB additions:** edition profiles, immutable artifacts, production jobs/attempts, scoped gate runs, release manifests and dependency links. Use enums/check constraints for edition and scope; do not add authority types.

**Code:** typed validators and read-only endpoints first. Preserve existing tables/routes.

**Tests:** schema constraints, RLS/grants, invalid edition/audio combinations, idempotent inserts, cross-case isolation.

**Rollback:** additive tables can be disabled from the gateway; no destructive data conversion.

**A0 approval:** required for field semantics and gate-scope model.

## Phase 2 — Enforce Handoff Protocol 1.2

**Work:** normalize authoritative input manifests, delivery status, reveal ceilings, expected outputs and acceptance tests; add a package-readiness validator. Link returns to one handoff and close/supersede stale handoffs explicitly.

**Risk:** old free-form payloads may be incomplete.

**Compatibility:** treat them as `LEGACY_UNVALIDATED`, never fabricate missing fields.

**Tests:** missing-input BLOCKED cases, version ambiguity, exact-hash delivery, role/capability matrix.

## Phase 3 — Gate projections and edition scoping

**Work:** derive one current gate status per scope/candidate; encode prerequisites; separate historical findings from active blockers. Implement shared G0–G6, visual V0–V4, edition G7–G12 and audio AUD0–AUD4 projections.

**Risk:** current DC-002 G6 history mixes logic, pixel and preflight work.

**Rollback:** retain original gate rows and rebuild projections from events.

**A0 approval:** required for mapping legacy gate history to v2.0 scopes.

## Phase 4 — Visual-system registry

**Work:** add family, Golden Master, component, V3 lock, V4 kit, case adaptation and visual-audit records. Seed the registry as empty/not-started from the supplied v1.0 registry. Import legacy renders only as `LEGACY` or `[VISUAL DRAFT — UNVERIFIED]`.

**Tests:** G9 blocked without V3/V4; changed-hash audit invalidation; VR2 constraint/audit completeness; deterministic reproduction manifest.

**A0/user approval:** required for every V3 and A0 lock; no recovered image receives an inferred lock.

## Phase 5 — Edition profiles and releases

**Work:** create three profiles per eligible case from one case core. Build inclusion/transformation maps and per-edition asset manifests. Make G12 edition-scoped.

**Tests:** independent solvability, no cross-SKU missing dependency, exact manifests, package reconstruction, Economic with zero audio, Standard/Premium with optional audio only.

**Rollback:** profiles/releases are versioned; supersede a candidate rather than overwrite it.

**A0 approval:** required for each profile baseline and each release.

## Phase 6 — Audio lineage and QA v1.1+

**Work:** register canonical segments, TTS-safe transformations, critical-phrase ledger, voice-lock references, generated attempts, transcripts, objective findings and human review separately. Implement reuse-first reanalysis of existing DC-002 attempts before generation.

**Tests:** reject non-`TTS_` synthesis inputs; local detection of the Marcos `23:20` defect; benign ASR variance does not retry; retry only on localized hard failure; semantic equivalence; locked voice immutability.

**Rollback:** generated attempts are immutable; selection pointers can move to a prior passing attempt.

**A0 approval:** required before importing the voice lock as governed state and before any new generation.

## Phase 7 — Controlled DC-002 synchronization

**Safe first import:** package manifest, voice-lock documents, TTS mapping, QA policy/specification, existing asset inventory and hashes as non-authoritative artifacts.

**Do not import as authority:** conversational summaries, inferred canon, unsourced player packages or gate interpretations.

**Required reconciliation:** A0 identifies the exact current CASE_CANON/CASE_LOGIC/PRODUCTION_STATE candidates and their source documents; A3/A0 determine which historical gate results remain applicable. Only a later explicit A0 action may register/validate/promote an authority set.

**Tests:** backend remains draft after artifact import; zero current pointers; full provenance; repeat import idempotent.

## Phase 8 — API consolidation and rollout

**Work:** select one canonical gateway; version OpenAPI from source; retain compatibility adapters for v13/v14/Premium; deploy Synthetic, run regression/failure tests, then deploy Production additively. Run security/performance advisors before release.

**Risks:** custom-key gateways use `verify_jwt=false`; correctness depends on internal credential auth and service-role isolation. Upcoming Data API exposure changes require explicit grants rather than assumptions.

**Rollback:** keep the previous function version and route aliases; schema changes remain additive; use feature flags for new writes.

## Immediate blockers

- No canonical Git repository or automated test harness.
- No authoritative DC-002 source documents in Factory.
- No approved mapping of DC-002 legacy G6/visual/audio history into v2.0 scopes.
- No V3/V4 series visual system.
- Local and deployed API/release versions disagree.
- Fresh governance decision required before resuming atomic staged registration.
- Constitution v2.0 and the current root operator brief do not agree on S0's authority boundary.
