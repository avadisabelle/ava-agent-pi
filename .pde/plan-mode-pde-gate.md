# PDE: Make PLAN Mode's Decomposition an Interactive Gate

> Manually decomposed — pde_decompose engine unavailable (rate limit).
> This decomposition follows the Four Directions mapping.

---

## Primary Intent

**Make PDE decomposition a mandatory, interactive passage in PLAN mode** — not a skippable text suggestion. When the agent enters PLAN mode with a complex request, it must decompose, present the decomposition for user annotation, and only proceed after acceptance.

## Secondary Intents

1. **Infuse RISE framework awareness** into PLAN mode's output — specs and plans should use creative orientation, structural tension dynamics, and advancing patterns rather than reactive/problem-solving language.

2. **Close the pipeline gap** — the `plan-build-review` chain and planner agent currently bypass PDE entirely. Decomposition should be present across all planning pathways.

3. **Strengthen the NORMAL→PLAN signal** — the classifier prompt should convey that PLAN mode involves interactive decomposition + approval, not just "multi-step changes."

---

## Four Directions Mapping

### 🌅 East — Vision / Intention
**What wants to exist:**
A PLAN mode where the East passage (from raw intention to accepted decomposition) is conscious and interactive. The user sees their request decomposed into intents, annotates them, and accepts before any scouting or implementation begins. This is creative orientation — naming what wants to exist before going looking.

**Structural Tension:**
- **Current Reality:** PDE is mentioned in Phase 0 of the PLAN prompt as a suggestion with an easy escape hatch. Output goes to `.pde/` as a flat file nobody sees. The agent frequently skips it.
- **Desired Outcome:** PDE is the first act of PLAN mode. Its output is presented via `show_plan` (questions mode) for user annotation. Scouts don't run until the user accepts the decomposition.

### 🔥 South — Action / Implementation
**What needs to change (files and locations):**

1. **`extensions/lib/mode-prompts.ts` — `buildNormalPrompt()`** (lines ~76-93)
   - Mode selection table entry for PLAN should mention decomposition + interactive approval
   - Signal that PLAN involves user interaction, not just autonomous planning

2. **`extensions/lib/mode-prompts.ts` — `PLAN_PROMPT` Phase 0** (lines ~103-112)
   - Remove the "simple tasks — skip" escape hatch (if you're in PLAN, you decompose)
   - Add explicit instruction to present PDE output via `show_plan { mode: "questions" }` 
   - Make it a gate: "Do NOT proceed to Phase 1 until the user has reviewed and accepted the decomposition"

3. **`extensions/lib/mode-prompts.ts` — `PLAN_PROMPT` general**
   - Add a RISE awareness section — language patterns, structural tension framing, creative orientation principles
   - Plans and specs produced in PLAN mode should follow RISE quality criteria

4. **`agents/planner.md`**
   - Add instruction to read `.pde/` if it exists and plan from the accepted decomposition
   - Add RISE language awareness

5. **`agents/pipeline-team.yaml`**
   - Add a `decompose` phase before `plan` in the `plan-build-review` chain

### 🌊 West — Reflection / What to Preserve
**What must NOT break:**
- The `show_plan` viewer already works beautifully for plan approval (Phase 3) and questions (Phase 2b) — we reuse it, don't replace it
- Simple tasks in NORMAL mode should still stay in NORMAL — the escape hatch removal is within PLAN mode only
- The scout dispatch pattern (Phase 1) is good — it just needs to be driven by accepted PDE output
- The structured plan format (Phase 2) is solid — keep it, just add RISE awareness to how context is framed
- The completion report flow (Phase 5) stays as-is

### 🏔️ North — Structure / Integration
**How the pieces connect:**

```
User Request → NORMAL mode classifier
  ↓ (complex task detected)
set_mode("PLAN") → PLAN_PROMPT activates
  ↓
Phase 0: MANDATORY Decompose
  → pde_decompose (or manual)
  → Write to .pde/
  → show_plan { file_path: ".pde/...", mode: "questions" }  ← NEW GATE
  → User annotates, accepts
  ↓ (only after acceptance)
Phase 1: Scouts (driven by accepted PDE)
  ↓
Phase 2: Structured Plan (RISE-aware)
  ↓
Phase 3: show_plan for approval ← existing gate
  ↓
Phase 4: Implement
  ↓
Phase 5: Completion Report
```

**Pipeline chain integration:**
```
plan-build-review chain:
  decompose → plan → build → review   (was: plan → build → review)
```

---

## Ambiguity Flags

1. **How deep should RISE awareness go?** Should the PLAN prompt include the full RISE quality checklist, or just the language patterns and structural tension framing? _Default: Language patterns + structural tension + "specs should be autonomous blueprints" — not the full Phase 1-4 methodology._

2. **Should the PDE gate apply to ALL PLAN mode entries or only "multi-intent" tasks?** The current Phase 0 distinguishes simple vs multi-intent. If we remove the escape hatch entirely, even a 2-file refactor gets decomposed. _Default: Always decompose when in PLAN mode, but allow lightweight decomposition (3-5 bullet intents) for smaller tasks rather than requiring full Four Directions._

3. **Should the planner agent in pipeline-team.yaml also present PDE interactively?** The chain runs agents sequentially — adding an interactive gate in a chain phase changes the execution model. _Default: Yes, but the decompose phase uses `mode: interactive` so the user is in the loop._

4. **Where does the RISE framework file live in relation to the prompt?** Should mode-prompts.ts inline RISE principles, or reference `/workspace/llms/llms-rise-framework.txt` as context? _Default: Inline the essential principles (creative orientation, structural tension, language patterns) — don't reference external files that may not exist in all environments._

5. **Should the PDE presentation use `show_plan` in "questions" mode or "plan" mode?** Questions mode lets users answer inline. Plan mode lets users edit/reorder. _Default: Questions mode — each intent becomes a question the user can annotate with context, corrections, or priorities._

---

## Action Stack (Priority Order)

1. **Edit `PLAN_PROMPT` Phase 0** — make PDE mandatory + add `show_plan` interactive gate
2. **Edit `buildNormalPrompt()` mode table** — signal PLAN involves decomposition + interactive UI
3. **Add RISE awareness section** to `PLAN_PROMPT` — language patterns, structural tension, creative orientation
4. **Edit `agents/planner.md`** — read `.pde/`, apply RISE principles
5. **Edit `agents/pipeline-team.yaml`** — add `decompose` phase to `plan-build-review`
6. **Validate** — test the flow end-to-end in a fresh PLAN mode session
