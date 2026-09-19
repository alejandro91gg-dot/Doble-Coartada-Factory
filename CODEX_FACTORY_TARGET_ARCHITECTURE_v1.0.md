# Codex Factory Target Architecture v1.0

## Governing model

```text
CASE AUTHORITY
  └─ CASE CORE
      ├─ EDITION PROFILE: ECONÓMICO
      ├─ EDITION PROFILE: ESTÁNDAR
      └─ EDITION PROFILE: PREMIUM
           └─ SKU RELEASE (versioned per edition)
```

The three authority domains remain the only authority types. Everything below them is a governed projection, artifact, manifest or release record—not a fourth authority domain.

## 1. Authority and case core

`CASE_CANON`, `CASE_LOGIC` and `PRODUCTION_STATE` remain an atomic set with immutable hashes, current pointers and explicit A0 transitions. `CASE CORE` is the complete non-audio deductive truth projected from that set: timelines, suspects, evidence architecture, constraints, reveal logic and fair-play path.

Every case-core version records its three source authority IDs. It must be reproducible without consulting edition assets or conversation history.

## 2. Edition profiles

Add non-authoritative, versioned edition profiles keyed by `(case_code, edition_code, version)` where `edition_code` is `ECONOMICO`, `ESTANDAR` or `PREMIUM`. Each profile declares included, omitted and transformed evidence; physical components; visual/audio assets; packaging; accessibility; and edition-specific QA.

Required audio invariants:

| Edition | Included | Optional to player | Required for solution |
|---|---:|---:|---:|
| ECONÓMICO | false | false | false |
| ESTÁNDAR | true | true | false |
| PREMIUM | true | true | false |

Validation must prove a complete non-audio solution path for every profile. Removal or transformation of solution-critical evidence creates a mechanically distinct edition and requires a separate logic/fair-play audit.

## 3. SKU releases

Release records are edition-scoped and immutable. A release manifest references the case-core version, edition profile, exact asset hashes, print/package mapping, QA results and gate results. A0 alone may mark a SKU release approved. Approval of one edition never releases another.

## 4. Gates and handoffs

Gate runs need explicit scope: `CASE_CORE`, `VISUAL_SYSTEM`, `EDITION`, `AUDIO` or `SKU_RELEASE`. Store prerequisites, candidate hash, verdict, source return and supersession. Derive current status rather than treating the latest arbitrary row as truth.

- G0–G6: shared case-core gates.
- V0–V4: series/case visual-system gates.
- G7–G8: shared content baseline plus edition-delta validation.
- G9–G11: repeated per edition when assets, physical behavior or deduction paths differ.
- G12: always per edition.
- AUD0–AUD4: per edition that ships audio; N/A for ECONÓMICO.

Handoff Protocol 1.2 fields become validated data: exact input IDs/hashes, delivery status, scope, reveal ceiling, outputs, acceptance tests and return destination. Missing named inputs force `BLOCKED`.

The role registry must identify A0 as the sole case authority/gate/release governor and preserve A1/A2/A3/A4 responsibilities from Constitution v2.0. S0 must not be assigned overlapping authority by implication: A0 must explicitly define it as a technical oversight role or retire it from the v2.0 workflow.

## 5. Production artifacts

Use immutable artifact rows plus storage objects. Each artifact records case, edition (nullable for shared), semantic role, source artifact, version, SHA-256, media type, generation job and authority lineage. Documents, renders, audio, transcripts and reports must not be conflated.

Production jobs are idempotent and resumable. Inputs and tool/model settings are hashed; retries append attempts without overwriting prior evidence.

## 6. Visual master layer

Model `VISUAL_SYSTEM_REGISTRY`, families, Golden Masters, components, V3 approvals, V4 kits and case adaptations. A Golden Master requires rendered bytes plus a deterministic recipe/source. References remain non-canon. VR2 outputs link to A1 constraints and an A3 audit over the actual hash. Changed pixels invalidate affected audit scope.

## 7. Audio layer

Represent separately:

```text
canonical segment
  → TTS-safe segment + transformation ledger
  → locked voice assignment
  → generation attempt
  → ASR transcript
  → objective segment/local-phrase QA
  → human performance review
  → edition audio asset manifest
```

Global similarity is diagnostic only. Retry requires a localized hard audio defect. Voice substitution and semantic mutation require explicit authority; neither can be automatic.

## 8. Synchronization and compatibility

Sync packages transport bytes and metadata only. Authority transitions, visual locks, voice locks and releases use dedicated operations. All mutations carry an idempotency key, expected parent/current version and audit event.

Existing v1.x API routes remain read-compatible behind one canonical gateway while deprecated proxies are measured and retired. Release metadata must match deployed source. Synthetic validates migrations and failure behavior before Production receives additive schema changes.

## 9. Core invariants

- Exactly three authority domains.
- No edition may depend on audio to solve the case.
- No G9 without V3 and V4.
- No G12 without edition-specific G10/G11 and required AUD4.
- No named input without exact delivery/hash.
- No visual PASS inheritance after material pixel change.
- No local/conversational state silently becomes backend authority.
