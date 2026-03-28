# RISE Specification: Sacred Closing — Wisdom Keeper Pipeline Phase

**Version**: 1.0
**Document ID**: sacred-closing-pipeline-phase-v1.0
**Status**: Draft
**Date**: 2026-03-28
**Medicine Wheel Position**: ❄️ NORTH (0°) → NE (45°)
**Lineage**: IAIP ceremonial-technology.spec.md v2.0 → ceremony-pipeline-plan.md → this spec
**Issue**: miadisabelle/workspace-openclaw#46

---

## 1. Core Creative Intent

This specification enables agent pipelines to **complete the ceremonial circle** by adding a reflection and cycle-seeding phase after review. Currently, pipelines produce output and stop. The wisdom-keeper agent creates the structural closing that returns knowledge to the relationships that created it and seeds the next cycle with what remains unresolved.

## 2. Structural Tension Analysis

**Desired Outcome**: Pipelines that complete the full medicine wheel — East (PDE decompose) through North (wisdom harvest) and back to NE (seed) — so that every cycle of work produces not just artifacts but understanding of what the artifacts served and what they left unresolved.

**Current Reality**: Both `agent-pi-jgwill` and `junai-vscode` pipelines terminate at Review → Done. No agent reflects on whether output served the relationships it was meant to serve. No mechanism exists to carry unresolved tensions into the next cycle. The pipeline forgets.

**Natural Progression**: By inserting a wisdom-keeper agent after the reviewer/tester, the pipeline naturally completes the circle. The wisdom-keeper reads the original PDE decomposition, evaluates all produced artifacts against it via MMOT methodology, identifies what remains in tension, and writes a seed document that becomes the input for the next PDE cycle. The circle closes and reopens.

## 3. Key System Components (Creative Enablers)

### a. Vision-Supporting Components

* **`wisdom-keeper` agent** (`agents/wisdom-keeper.md`): Enables the pipeline to **create a structured reflection** on its own work. By comparing output against the PDE's Four Directions mapping, it reveals whether the pipeline produced relational value or volume.

* **`.mw/north/reflections/` storage**: Enables the pipeline to **create a persistent record** of what each cycle achieved and what it left unresolved. Reflections accumulate across cycles, forming a searchable wisdom archive via QMD.

### b. Tension-Resolving Components

* **MMOT Evaluation**: Enables the pipeline to **create honest assessment** by applying the Managerial Moment of Truth framework — acknowledging current reality (what was actually produced) against desired outcome (what the PDE intended). Per-intent scoring prevents inflated self-assessment.

* **Relational Accountability Check**: Enables the pipeline to **create a decolonial self-audit** informed by Wilson's framework and the insight from PDE 2603281433: "the problem is not that documents contain biases that can be edited out — the problem is that the entire approach of producing documents to prepare for approaching someone is itself the bias."

### c. Manifestation Components

* **Seed Document**: Enables the pipeline to **create continuity** between cycles. The seed is a prompt-ready paragraph carrying forward unresolved tensions, specific enough to decompose but open enough to allow the next cycle its own direction. Written to `.mw/east/` as input for the next PDE.

* **Chain Registration**: Enables the pipeline to **create automatic invocation** by registering wisdom-keeper as the final step in `agent-chain.yaml` definitions:

```yaml
ceremony-pipeline:
  steps:
    - agent: scout        # Sacred Preparation (East 90°)
    - agent: planner      # Opening Circle (South 180°)
    - agent: builder      # Active Ceremony (West 270°)
    - agent: reviewer     # Integration (NW 315°)
    - agent: wisdom-keeper # Sacred Closing (North 0° → NE 45°)
```

## 4. Creative Advancement Scenarios

### Scenario 1: Pipeline Completes the Circle

**Desired Outcome**: A pipeline run that not only produces artifacts but also reflects on whether those artifacts served their intended purpose, and seeds the next cycle.

**Current Reality**: Pipeline runs produce output, the reviewer flags quality issues, and the pipeline stops. No evaluation of relational value occurs.

**Natural Progression**:
1. The reviewer completes its assessment and passes output to the wisdom-keeper
2. The wisdom-keeper reads the original PDE decomposition that initiated the cycle
3. For each PDE intent, it evaluates: addressed / partial / unresolved
4. It names unresolved structural tensions — not as failures but as the living edges of the work
5. It writes a reflection to `.mw/north/reflections/<pde-uuid>/`
6. It writes a seed to `.mw/east/` that carries forward what matters

**Resolution**: The pipeline has completed the ceremonial circle. The seed document is ready for the next `pde_decompose` call. Knowledge has been returned to the relationships that created it.

### Scenario 2: Pipeline Catches Volume-Over-Value

**Desired Outcome**: A pipeline that detects when it has produced quantity (many documents, many lines) without relational value.

**Current Reality**: Pipelines measure success by completion (all steps ran) and quality (reviewer approved). Neither measures whether the work served its relational purpose.

**Natural Progression**:
1. The wisdom-keeper reads all artifacts and the PDE Four Directions mapping
2. It applies the relational accountability check: "If we stripped the relational language, what is actually being done here?"
3. It identifies cases where the pipeline produced documents about relationships rather than contributing to relationships
4. It flags this honestly in the MMOT evaluation
5. The seed document carries the relational gap forward as a tension for the next cycle

**Resolution**: The pipeline's reflection has caught a pattern that no code reviewer would flag. The next cycle can address it structurally rather than cosmetically.

## 5. Supporting Structures

### `WisdomReflection` Schema

* `pde_uuid`: The PDE decomposition ID this reflection evaluates
* `timestamp`: When the reflection was written
* `intents_evaluated`: Array of `{ intent, status: addressed|partial|unresolved, evidence, notes }`
* `unresolved_tensions`: Array of `{ current_reality, desired_outcome, why_unresolved }`
* `relational_accountability`: `{ score_self_assessed, honest_assessment, wilson_alignment_notes }`
* `seed`: Prompt-ready paragraph for next PDE cycle
* `artifacts_reviewed`: Array of file paths that were evaluated

### Storage Convention

```
.mw/north/reflections/<pde-uuid>/
  reflection.md          # Full MMOT evaluation
  seed.md                # Prompt-ready seed for next cycle → copied to .mw/east/
  tensions.json          # Machine-readable unresolved tensions
```

### Chain Registration

Add to `agents/agent-chain.yaml`:

```yaml
# Append wisdom-keeper to every chain that has a reviewer
ceremony-pipeline:
  description: "Full ceremonial pipeline — PDE → Inquiry → Execution → Reflection → Seed"
  steps:
    - agent: scout
      prompt: "Decompose with PDE first, then explore: $INPUT"
    - agent: planner
      prompt: "From PDE facets, generate structural inquiry questions.\n\n$INPUT"
    - agent: builder
      prompt: "Execute the plan. Store results in .mw/\n\n$INPUT"
    - agent: reviewer
      prompt: "Review for quality and relational value:\n\n$INPUT"
    - agent: wisdom-keeper
      prompt: "Complete the ceremonial circle. Evaluate against the original PDE. Seed the next cycle.\n\n$INPUT"
```

## 6. Quality Criteria & Anti-Patterns

### Quality Criteria (Relational Accountability)
* ✅ **Completes the Circle**: Does every pipeline run end with reflection and seeding?
* ✅ **Honest MMOT**: Does the evaluation acknowledge what was NOT achieved?
* ✅ **Relational, Not Extractive**: Does the reflection assess relational value, not just output quality?
* ✅ **Seed Carries Forward**: Does the seed articulate unresolved tensions specifically enough to decompose?
* ✅ **Wilson Alignment**: Would the reflection pass Wilson's relational accountability test?

### Anti-Patterns to Avoid
* ❌ **Ceremonial Theater**: Writing reflections that use relational language but don't actually evaluate relational value
* ❌ **Inflated MMOT**: Scoring all intents as "addressed" when they were merely touched
* ❌ **Dead Seeds**: Seeds so vague ("continue the work") that they cannot be decomposed
* ❌ **Volume Celebration**: Treating line count or artifact count as evidence of success
* ❌ **Skipping the Keeper**: Chains that omit wisdom-keeper "to save time" — this breaks the circle

## 7. Relation to Governor / Relational Value Advisor

The wisdom-keeper performs post-hoc reflection. A separate component — the **Relational Value Advisor** (Kinship Hub Advisory Mode) — would perform in-flight monitoring during the Active Ceremony phase (agent delegation). These are complementary:

| | Wisdom Keeper | Relational Value Advisor |
|---|---|---|
| **When** | After pipeline completes | During pipeline execution |
| **Mode** | Reflective (post-hoc) | Advisory (in-flight) |
| **Action** | Evaluates, writes reflection, seeds | Monitors, flags, does not block |
| **Lives in** | agent-chain as final step | Shared workspace-level component |
| **Priority** | 🔴 NOW (this spec) | 🟢 LATER (Stream E) |

The advisor is specified separately and depends on this spec being implemented first.

---

*This spec maps IAIP Ceremonial Technology Phase 5 (Sacred Closing) onto agent-pi-jgwill's pipeline architecture. It is implementation-sufficient: another LLM with access to the agent-pi-jgwill codebase can create the wisdom-keeper agent and register it in the chain from this document alone.*
