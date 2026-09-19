# Codex Return to A0 — Reorientation v1.0

## Verdict

Codex now understands Factory v2.0 as a stateful, resumable and auditable production system with this governing chain:

`CASE AUTHORITY → CASE CORE → EDITION PROFILE → SKU RELEASE`

The three authority domains remain distinct and exclusive. ECONÓMICO, ESTÁNDAR and PREMIUM derive from one shared deductive core; they are not independent cases. Every edition must remain fully solvable without audio. ESTÁNDAR and PREMIUM may ship optional, semantically equivalent audio, while ECONÓMICO ships none.

## Biggest architectural changes

1. Releases are edition-specific, not merely case-wide.
2. Visual quality is governed through V0–V4, rendered Golden Masters and reproducible kits; prompts and references are not masters.
3. Audio is an edition-layer production representation with explicit source, TTS-safe, generation, transcript and QA lineage.
4. Handoffs require exact delivered inputs; filenames, memory and summaries do not satisfy delivery.
5. Operational progress, transport sync and authority are separate state layers.

## Current reality

- DC-001 remains authoritative at CASE_CANON/CASE_LOGIC/PRODUCTION_STATE v5.0. It is not frozen or released under Factory v2.0.
- DC-002 remains backend draft with zero authority records, zero current pointers and zero shared documents.
- DC-002 nevertheless has substantial operational history: 54 returns, 15 handoffs and 12 gate records, plus the supplied locked voice/TTS/QA package. This is a synchronization problem, not authorization to promote.
- The backend has no edition profiles, per-SKU release manifests, visual-master registry or audio lineage.
- Local, deployed and release-registry API versions disagree; the workspace is not under Git and has no automated tests.
- The root operator brief still encodes a DC-001/S0 recovery model that conflicts with Constitution v2.0's A0-centered role model and explicit A2 ownership.

## Top five risks

1. Treating DC-002 conversational/return history as authoritative truth.
2. Shipping one SKU with hidden dependencies on another or on audio.
3. Reusing changed or legacy pixels without current master lineage and A3 audit.
4. Continuing pre-reorientation atomic-register work against the wrong target model.
5. Migrating from an unreproducible, version-drifted codebase.

## Recommended next tranche

Start with a non-mutating foundation tranche:

1. designate and version-control the canonical repository;
2. capture deployed source/schema/release baselines;
3. approve the v2.0 typed state vocabulary for artifacts, gate scopes, edition profiles and SKU releases;
4. implement read-only schemas/validators and Synthetic contract tests;
5. prepare a DC-002 artifact-only import plan that leaves authority state draft.

Do not resume Production authority registration until this architecture is approved and the atomic operation is redesigned/tested within it.

## Exact blockers

- A0 must designate the canonical repository and deployed-source baseline.
- A0 must approve edition-profile and gate-scope semantics.
- DC-002 authoritative source documents are not delivered to Factory.
- DC-002 legacy gate/visual/audio history has no approved v2.0 mapping.
- V3/V4 series visual systems do not exist.
- Fresh governance authorization is required for atomic staged registration.
- A0 must resolve S0's v2.0 role and supersede the case-specific root operator brief.

## Compliance statement

During reorientation Codex did **not** promote canon, authority, Production State, any gate, any Golden Master, any voice lock or any SKU release. It did not declare FREEZE, G10, G12 or `[MASTER APPROVED]`, and it did not silently reconcile DC-002 local/conversational state with the backend.

[CODEX REORIENTATION RETURN READY]
