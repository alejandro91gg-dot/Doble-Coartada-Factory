---
name: case-production-pipeline
description: Orchestrates any active Doble Coartada case through G0-G12 and V0-V4 to the next validated milestone while preserving A0-A4 authority. Use for NEW CASE, CONTINUE, AUDIT, STATUS, or RELEASE-style case progression.
argument-hint: "<CASE_CODE> [new|continue|audit|status|release|next-milestone]"
---

# Case Production Pipeline


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


## Mission

Turn commands such as:
- `Crea un nuevo caso DC-003 y avanza hasta el primer hito validado.`
- `Continúa DC-004 hasta el siguiente hito validado.`
- `Audita DC-005.`
- `Estado de DC-006.`

into deterministic Factory execution without routine approval prompts.

A validated milestone is the first new main or visual gate that legitimately reaches PASS after invocation begins. Stop there unless the command explicitly requests a broader operation such as RELEASE, or a hard block/user-reserved decision occurs first.

## Startup

1. Resolve exact `CASE_CODE`.
2. Load authoritative `CASE_CANON`, `CASE_LOGIC`, and `PRODUCTION_STATE` if they exist.
3. For a new case, load the Series Registry before concept acceptance.
4. Load `17_VISUAL_SYSTEM_REGISTRY_v1.0.md` for visual-system awareness.
5. Detect conflicts, missing dependencies, and version ambiguity.
6. If initialization is authorized and the case has no files, create only template/proposed shells needed for the current gate.
7. Determine current gate from authoritative state, never from filename assumptions.

## Routing

- G0: A0 — brief and anti-repetition.
- G1-G5: A1 — `case-development` plus applicable specialist auditors.
- G6: A3 — `case-adversarial-qa`, `deduction-chain-auditor`, `investigation-fairness`.
- V0: A4 → A0 — Visual Brief.
- G7: A2/A0 — phase/reveal/document architecture; `document-continuity`.
- V1: A4 → A0 — Visual Architecture.
- G8: A2 — player-facing writing/content preparation; continuity skills.
- V2: A4 — rendered Golden Master candidates.
- V3: User decision, recorded only by A0.
- V4: A4 → A0 — Production Kit/template lock.
- G9: A4 production; `case-visual-continuity`; independent A3 visual/physical audits.
- G10: A3 — integrated final audit/preflight.
- G11: A3 — logic playtest.
- G12: A0 — release only after release checklist.

## Hard prerequisites

Enforce current Factory rules, including:
- new-case G7 requires G6 PASS + V0 PASS;
- G8 requires G7 PASS + V1 PASS;
- G9 requires G8 PASS + V3 PASS + V4 PASS;
- G10 requires A0 G9 PASS + mandatory A3 visual/physical audit PASS;
- G12 requires G11 PASS + complete release checks.

## Automatic cooperation

Activate as required:
- truth/state drift → `canon-guardian`;
- time/order/window → `chronology-auditor`;
- suspect whereabouts/opportunity → `alibi-auditor`;
- evidence/reveal/proof meaning → `evidence-dependency-auditor`;
- final inference → `deduction-chain-auditor`;
- solvability/fairness → `investigation-fairness`;
- document graph → `document-continuity`;
- person facts/knowledge → `character-continuity`;
- regression baseline → `setpoint-manager`;
- visual system/artifact → `case-visual-continuity`;
- hostile audit → `case-adversarial-qa`.

Multi-domain changes must satisfy all applicable procedures before consolidation.

## New-case bootstrap

For `NEW CASE`:
1. establish requested/assigned `CASE_CODE`;
2. create a proposed case shell if no case exists;
3. initialize case brief, canon shell, logic shell, and production-state shell only as needed;
4. run G0 anti-repetition before concept acceptance;
5. do not populate absent factual canon outside authorized proposal scope;
6. after G0 PASS, route to A1/G1 on the next progression step unless the invocation explicitly continues farther.

## Failure behavior

- MINOR: responsible owner repairs; re-test.
- MAJOR: reopen affected proposed layer; repair; re-test.
- CRITICAL on proposed material: redesign within authorized scope.
- CRITICAL requiring locked change: contradiction protocol and stop affected branch.
- Missing authoritative dependency: block; do not substitute.
- V3 required: stop and require explicit user approval of actual rendered V2 Masters.

## Infrastructure separation

When a routing, handoff, authority registry, scoped-gate, backend, Synthetic, or governance issue blocks progress, separate case work from Factory infrastructure work.

- A technical PASS for an artifact or audit is not automatically a PASS for the gate.
- A routing, handoff, or backend issue must not trigger canon, logic, content, or visual repair when those artifacts have already passed their required audit.
- If the only blocker is infrastructure, preserve the current case gate as `PENDING/BLOCKED` and state that the artifact may be technically validated without formal promotion.
- Infrastructure tasks must never be described as a case gate, visual gate, or `PRODUCTION_STATE` advancement.

## Handoffs

All cross-agent transfers must conform to `06_HANDOFF_PROTOCOL_v1.2.md`, including exact authoritative inputs, delivery status, immutable facts, proposal scope, reveal ceiling, expected outputs, acceptance tests, risks, and return destination.

## Milestone return

Return:
- `CASE_CODE`;
- authoritative input versions;
- gate/visual-gate before → after;
- new validated milestone;
- files/IDs changed;
- skill-level audits run and verdicts;
- setpoints activated/staled;
- unresolved issues;
- `CASE NEXT TASK:`;
- `FACTORY INFRASTRUCTURE TASK:`.

`CASE NEXT TASK:` must state the next case-level action required for legitimate advancement. If infrastructure blocks that action, identify the dependency/blocker but keep the actual infrastructure work exclusively under `FACTORY INFRASTRUCTURE TASK:`.

`FACTORY INFRASTRUCTURE TASK:` must state required Synthetic, backend, governance, handoff, gate, scoped-gate, authority registry, or authority-plumbing work. Use `N/A` when no infrastructure work is required. Never let this field imply case-gate advancement or `PRODUCTION_STATE` promotion.

Never claim advancement unless the authoritative production state was legitimately eligible to advance.
