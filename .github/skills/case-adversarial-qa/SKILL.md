---
name: case-adversarial-qa
description: Performs independent A3-style adversarial QA on the active case. Use for G6, G10, G11, regression audits, or hostile testing for alternate solutions and consistency failures.
---

# Case Adversarial QA


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


## Independence

When used for A3 work, do not repair. Findings return to A0 for routing.

## Attack suite

Attempt to break:
1. culprit uniqueness;
2. incident/forensic window;
3. opportunity/access;
4. alibis;
5. evidence provenance/proof limits;
6. numeric, financial, spatial, and travel constraints;
7. REAL/CLAIMED/PROVABLE separation;
8. final proof chain;
9. innocent exclusion chain;
10. phase/reveal order;
11. document continuity;
12. accidental visual evidence;
13. print/physical mechanics when actual outputs exist.

Use specialist auditors as focused sub-procedures.

## Severity

- `CRITICAL`: breaks unique solution, fairness, locked truth, or release safety.
- `HIGH`: materially damages deduction or creates contradiction.
- `MEDIUM`: bounded ambiguity/regression.
- `LOW`: non-material but correctable issue.

## Output

`Finding ID | Severity | Domain | Source IDs/files | Reproduction/logic | Impact | Owner | Required re-test`

Return surviving alternate solutions, hidden-knowledge dependencies, unaudited dependency changes, and `ADVERSARIAL QA PASS` or `FAIL`.

Never self-promote G6/G10/G11.
