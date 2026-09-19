# Codex Factory Current State Audit v1.0

**Observed:** 2026-09-19  
**Scope:** local workspace, Production `hquaviunbwghkxojndgj`, Synthetic `dzsuprknwgwjymeiiwzz`, and the verified reorientation package v2.0.

## Executive verdict

Factory has a working operational spine for agents, handoffs, returns, documents, gates, audit logs and the three authority domains. It does **not** yet implement the v2.0 product model `CASE AUTHORITY → CASE CORE → EDITION PROFILE → SKU RELEASE`. Visual masters, edition profiles, audio lineage and per-SKU releases are documents or conversational state rather than first-class, validated backend objects.

No authority, canon, locked voice or release state was changed during this audit.

## Repository and runtime

The workspace is not a Git repository and has no automated test suite or reproducible deployment configuration. Its durable code is limited to:

- `edge-functions/factory-api-v13`: document delivery, own-return access and handoff completion; proxies the base API.
- `edge-functions/factory-api-v14`: authority and gate endpoints; proxies v13.
- `edge-functions/factory-api-premium`: binary delivery and atomic promote/freeze/replace; proxies v14.
- `edge-functions/migrations/20260916_atomic_authority_set_register.sql`: unfinished pre-reorientation work for atomic staged registration.
- `recovery-delivery/` and `tmp/`: recovered DC-001 packages, historical syncs and inspection material, not a canonical source tree.

Production also runs a base `factory-api` whose source is deployed but absent from the maintained workspace. Deployed versions are v1.1.0, v1.3.1, v1.4.1 and Premium v2.0.2. Local v14/Premium report v1.4.2/v2.0.3 and contain an undeployed atomic-register route. The release registry still records v1.4.0 and Premium v2.0.0, so source, deployment and release metadata are not synchronized.

The root `AGENTS.md` is a DC-001 recovery brief, not a v2.0 repository guide. It makes S0 the supervisor, omits A2 from its primary role list and points to a historical next action already overtaken by later records. Factory Constitution v2.0 instead makes A0 the gate/authority governor and defines A2 explicitly. S0's continuing v2.0 role is therefore a governance ambiguity that must be resolved, not inferred.

Synthetic contains the atomic-register table/function and seven empty test cases (`DC-901`–`DC-907`), but zero authority records/register sets. Its E2E credential was removed. This work is a quarantined technical experiment, not an approved Production capability.

## Agent, handoff and gate model

`factory_agents` and capability checks encode S0/A0/A1–A4/LOCAL_SYNC access. A0 alone has authority mutation capabilities; specialist APIs are appropriately narrower. Handoffs and returns are durable and auditable, but their payloads are generic JSON: Protocol 1.2 delivery manifests, reveal ceilings, V0–V4 baselines and acceptance tests are not structurally enforced.

`factory_gate_records` is append-only evidence, not a dependency engine. It lacks an explicit current-gate projection, shared-versus-edition scope and prerequisite validation. DC-002 demonstrates drift: 12 gate records, 15 handoffs and 54 returns exist, while several issued/accepted handoffs remain uncompleted after related returns. The latest G6 record is pending; later audio work is present as returns, not synchronized production state.

## Authority and synchronization

The implemented authority model correctly recognizes exactly:

- `CASE_CANON`
- `CASE_LOGIC`
- `PRODUCTION_STATE`

Atomic promote/freeze/replace RPCs use per-case transaction locks. Individual transitions are blocked where an atomic set operation is required. RLS is enabled on all `factory_*` tables, and existing `SECURITY DEFINER` functions are not executable by `PUBLIC`, `anon` or `authenticated`.

Transport sync is separate from authority, which is correct. However, document sync has no typed layer for case core, edition manifests, production assets or release artifacts. Generic metadata currently carries too much semantic responsibility.

## Case state

### DC-001

Production is authoritative at v5.0 for all three domains, with three current pointers. It is not frozen. Its recovered visual material is legacy pre-v2.0 and must not become a v2.0 series master automatically. The previous atomic staged-register work remains blocked and must not resume without a fresh governance decision.

### DC-002

Production remains `draft`, sync revision 1, with zero authority records, zero current pointers and zero shared documents. Separately, the backend holds extensive handoff/gate/return history, while the reorientation package contains a locked voice registry v1.1, TTS-safe mapping and revised QA rules. These are valid production-history inputs, but they are neither authority nor synchronized shared documents.

Safe migration may register immutable source documents, manifests and QA evidence as non-authoritative artifacts. It may not promote DC-002 canon/logic/state or infer that operational progress equals authority.

## Visual system status

Factory v2.0 governance is documented, but not implemented as backend state. There is no authoritative `VISUAL_SYSTEM_REGISTRY` object, Golden Master registry, V3 user-lock record type, V4 kit lineage, family/component manifest or changed-pixel audit linkage. The supplied registry deliberately reports every family as not started. Existing DC-001/DC-002 render history must therefore remain legacy or unverified until explicitly migrated.

## Audio status

The target distinction among canonical text, TTS-safe text, generated audio, ASR transcript, objective QA and human performance review is not represented in code or schema. No DC-002 audio documents are in Factory Storage/Documents. The old v1.0 global similarity/global number-count approach is obsolete; v1.1 requires segmented critical-phrase checks, reuse-first analysis and retries only after a localized hard defect.

## Edition and release status

ECONÓMICO, ESTÁNDAR and PREMIUM are not modeled as profiles, folders, database rows, manifests or release scopes. The current Premium API name describes transport capability, not a commercial SKU. G12 is case-wide rather than edition-scoped. The invariant `audio_required_for_solution = false` is not machine-enforced.

## Retired assumptions

- One case equals one undifferentiated product package.
- Premium audio may be treated as unique solution evidence.
- A prompt, reference or recovered render can serve as a visual master.
- G9 may proceed without V3/V4.
- Sync or conversational progress implies authority.
- A single case-level G12 releases all formats.
- A2 may substitute for A4 visual-system ownership.
- Similarity thresholds or global number counts alone can fail audio QA.

## Highest risks

1. DC-002 operational history can be mistaken for authoritative state.
2. No SKU boundary prevents accidental cross-edition dependencies.
3. Visual evidence lacks master lineage and fresh-pixel audit enforcement.
4. Local, deployed and release-registry API versions disagree.
5. No Git/test baseline makes migrations and rollback non-reproducible.
6. The S0/A0 governance boundary is inconsistent between the workspace brief and Constitution v2.0.
