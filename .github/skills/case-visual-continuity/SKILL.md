---
name: case-visual-continuity
description: Protects visual continuity and evidentiary safety for the active case across V0-V4 and G9. Use for visual briefs, architecture, Golden Masters, Production Kit adaptation, rendered evidence, or visual changes.
---

# Case Visual Continuity


## Factory contract

This skill operates under the Doble Coartada Factory. It is a reusable procedure, not an authority layer and not a case-specific source of truth.

### Case resolution

Before substantive work:
1. Resolve exactly one active `CASE_CODE` from the user's instruction, current authoritative case files, or current production state.
2. If more than one case is plausible, do not guess. Report the ambiguity as a package block for the affected work.
3. Treat `CASE_CODE` as a parameter. Never hard-code case facts, names, IDs, dates, locations, culprit information, evidence, or visual facts into this skill.

### Authority intake

Load, when applicable:
- Factory/system instructions;
- `00_FACTORY_CONSTITUTION_v2.0.md`;
- current `06_HANDOFF_PROTOCOL_v1.2.md`;
- active `CASE_CANON` for `CASE_CODE`;
- active `CASE_LOGIC` for `CASE_CODE`;
- active `PRODUCTION_STATE` for `CASE_CODE`;
- current A0 handoff;
- any gate-specific authoritative dependencies explicitly named by those sources.

Use the exact current versions designated by the authoritative production/authority state.

A named authoritative dependency that is missing, inaccessible, contradictory, substituted, or version-ambiguous blocks the affected work. Do not reconstruct, infer, regenerate, or silently substitute it.

### Authority boundaries

- Never promote `CANON PROPOSED` to `CANON LOCKED`.
- Never self-pass a Factory gate.
- Never declare `MASTER APPROVED`.
- Never apply `🔒 VISUAL MASTER LOCKED`.
- Never infer V3 user approval.
- Preserve stable IDs, exact names, timestamps, quantities, distances, mathematical deltas, forensic facts, access rules, evidence meaning, reveal ceilings, and approved player-facing wording unless the authorized scope explicitly permits a proposal-layer change.
- New creative facts are allowed only when the current task/handoff explicitly authorizes proposal in that domain. They remain `CANON PROPOSED`.
- Absence of an authoritative fact is never evidence that the fact has some guessed value.
- Keep `REAL`, `CLAIMED`, and `PROVABLE` timelines separate.
- Never leak internal production labels or solution metadata into player-facing material.
- When acting in an A3 audit context, return findings only; do not repair, redesign, or silently reconcile the audited material.

### Change-impact rule

Before consolidating any change that affects chronology, alibis, evidence, deductions, characters, documents, quantitative constraints, reveal order, or evidentiary visuals:
1. identify every changed fact/ID;
2. enumerate direct dependents;
3. enumerate transitive dependents;
4. list affected files, IDs, constraints, documents, phases, characters, visuals, and setpoints;
5. classify each dependency as `MUST UPDATE`, `MUST RE-TEST`, `VERIFY ONLY`, or `UNAFFECTED`;
6. synchronize every `MUST UPDATE` item;
7. obtain a disposition for every required re-test.

A change is not consolidated while required dependency work remains unresolved.

If a requested change conflicts with locked/user-authoritative material, use the Factory contradiction protocol and stop the affected branch.


## Required visual sources

When applicable load exact current versions of:
- `12_VISUAL_FACTORY_GOVERNANCE_v1.0.md`;
- `13_A4_VISUAL_DIRECTOR_ROLE_v1.0.md`;
- `14_VISUAL_PIPELINE_V0-V4_v1.0.md`;
- `15_VISUAL_PRODUCTION_KIT_SPEC_v1.0.md`;
- `16_GOLDEN_MASTER_POLICY_v1.0.md`;
- `17_VISUAL_SYSTEM_REGISTRY_v1.0.md`;
- `18_VISUAL_EVIDENCE_SAFETY_INTERFACE_v1.0.md`;
- active-case `VISUAL_EVIDENCE_CONSTRAINTS`;
- active-case visual brief/architecture/adaptation;
- exact Golden Master and Production Kit versions named by authority;
- approved G8 content.

Reference images, prompts, moodboards, and Style Bible prose never substitute for required Golden Masters or Production Kits.

## Procedure

1. Determine current V0/V1/V2/V3/V4 status.
2. Block full G9 propagation unless G8 PASS, V3 PASS, V4 PASS, required families have locked systems, Case Visual Adaptation exists, and A1 visual constraints are delivered.
3. Map every document to family, master/template, variable slots, phase, and VR class.
4. For evidence-bearing visuals, map each factual visible element to A1 constraints.
5. Classify visible details A/B/C and risk VR0/VR1/VR2.
6. A4 may add only authorized A details; omit/escalate unsupported factual-looking detail.
7. Preserve source-native identity and approved wording.
8. If VR2 pixels or relevant context change, mark prior pixel PASS stale and require A3 re-audit unless A0 accepts exact-equivalence reuse.
9. A3 audits actual rendered artifacts, not prompts.

## Output

`Asset/DOC | Family | Master/component | V3/V4 status | A/B/C | VR | Facts touched | Drift | A3 audit state | Action`

Conclude with exact visual blockers and continuity status.
