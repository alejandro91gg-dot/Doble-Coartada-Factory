---
name: case-development
description: Develops the active case through G1-G5 proposal stages: concept, canon proposal, reconstruction, claims, evidence architecture, and constraints. Use for new-case development, logic repair, or continuing a case before early Red Team.
---

# Case Development


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


## Additional required sources

Load:
- the current Series Registry before new-case concept acceptance;
- the active case brief when present;
- current case canon, logic, and production state;
- relevant Factory templates;
- current A0 handoff.

If the case has no canon/logic files yet, template-based `CANON PROPOSED` shells may be created only when initialization is part of the authorized task. Do not populate missing facts outside proposal scope.

## Procedure

1. Determine the current G-stage from authoritative production state.
2. At G1, build the case concept within the brief and run the Series Registry anti-repetition comparison.
3. At G2, structure master canon with stable IDs and explicit fact states.
4. At G3, construct the REAL reconstruction independently from testimony.
5. At G4, construct CLAIMED and PROVABLE timelines, suspect matrix, and exclusion logic without merging them into REAL.
6. At G5, construct evidence registry, deductive constraints, dependency graph, quantitative/spatial constraints, and `VISUAL_EVIDENCE_CONSTRAINTS` where applicable.
7. For modified temporal facts, use `chronology-auditor`.
8. For modified suspect location/opportunity, use `alibi-auditor`.
9. For evidence additions/removals/meaning changes, use `evidence-dependency-auditor`.
10. Before proposing G5 ready-for-audit status, use `deduction-chain-auditor` and `investigation-fairness`.
11. Run `canon-guardian` before returning to A0.

## Output

Return:
- case code and input versions;
- changed files and stable IDs;
- proposed facts added/changed;
- dependency-impact report;
- unresolved canon questions;
- gate-readiness assessment;
- required next owner/auditor;
- hard blocks.

Document completeness is never itself a gate PASS.
