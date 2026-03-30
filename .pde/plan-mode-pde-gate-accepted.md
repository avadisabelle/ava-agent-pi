# PDE: PLAN Mode Interactive Gate — ACCEPTED (with user annotations)

> Decomposed manually. Annotated by user via show_plan questions mode.
> This is the accepted decomposition driving all subsequent work.

---

## Synthesized Intent (post-annotation)

**Core:** Make PDE decomposition mandatory in PLAN mode. Present it interactively via `show_plan` (questions mode) with a freeform notes field at the end. But apply intelligence — if the decomposition has no real ambiguities (evaluated through structural thinking's four question types), the agent may proceed without forcing the interactive gate.

**RISE awareness:** Don't inline the full framework. Instead, make agents *aware* that RISE exists and point them toward it (`/workspace/llms/llms-rise-framework.txt` or fetch from `https://llms.jgwill.com/llms-rise-framework.txt` with local caching). When specs or requirements are being written, the agent gets informed and directed.

**PDE workspace:** Each PDE gets its own folder: `.pde/<YYMMDDHHmm>--<UUID>/` — a workspace where the agent is free to work with files, agent definitions, and whatever else is needed alongside the user.

**Structural thinking for question quality:** Use the four question types (Information, Clarification, Implication, Discrepancy) to evaluate whether the PDE has genuine questions worth presenting. Don't present if everything is obvious. But be careful with bias — LLMs think they're doing structural thinking well when they're often importing frameworks instead of observing.

---

## Action Stack (revised per annotations)

### 1. Edit `PLAN_PROMPT` Phase 0 in `extensions/lib/mode-prompts.ts`
- Make PDE mandatory (no "simple tasks skip" escape)
- PDE output goes to `.pde/<YYMMDDHHmm>--<UUID>/decomposition.md`
- After writing, evaluate: "Does this PDE have genuine ambiguities using the four question types (Information, Clarification, Implication, Discrepancy)? Are there questions that need user input?"
  - If YES: present via `show_plan { mode: "questions" }` with freeform notes field at end
  - If NO (all obvious): proceed, but log the decision
- Gate: Do NOT proceed to Phase 1 until PDE is either accepted interactively or deemed unambiguous

### 2. Edit `buildNormalPrompt()` mode table in `extensions/lib/mode-prompts.ts`
- PLAN description should signal: "Multi-step changes → decomposition + interactive approval before coding"
- User should know entering PLAN means they'll be consulted, not just informed

### 3. Add RISE awareness to `PLAN_PROMPT` in `extensions/lib/mode-prompts.ts`
- NOT the full checklist — a direction pointer
- When the task involves writing specifications, requirements, or feature descriptions:
  - Inform the agent that RISE framework guidance exists
  - Point to local path: `/workspace/llms/llms-rise-framework.txt`
  - Fallback: fetch from `https://llms.jgwill.com/llms-rise-framework.txt` and cache locally
- Key principles to carry: creative orientation (desired outcomes, not problems), structural tension (current reality → desired state), advancing patterns (not oscillating), spec autonomy (another LLM could implement from spec alone)

### 4. Edit `agents/planner.md`
- Add: "If `.pde/` contains a decomposition, read it first and plan from the accepted intents"
- Add RISE awareness: when writing plans that include specs, reference the framework

### 5. Edit `agents/pipeline-team.yaml`
- Add `decompose` phase before `plan` in `plan-build-review` chain
- Use `mode: interactive` so user is in the loop
- The decompose phase agent evaluates whether interactive presentation is needed

### 6. Add freeform notes field pattern
- When presenting PDE via `show_plan` in questions mode, always append:
  ```
  ---
  ## Additional Notes
  Enter any additional context, corrections, or comments for the agent to consider:
  ```

---

## Files to Change

| File | What Changes |
|------|-------------|
| `extensions/lib/mode-prompts.ts` | PLAN_PROMPT Phase 0 (mandatory PDE + interactive gate), buildNormalPrompt mode table, RISE awareness section |
| `agents/planner.md` | Read .pde/, RISE pointer |
| `agents/pipeline-team.yaml` | Add decompose phase to plan-build-review |
| `agents/scout.md` | Already reads .pde/ — no change needed |

---

## What to Preserve (West)
- show_plan viewer works — reuse it
- Scout dispatch pattern (Phase 1) — just driven by accepted PDE
- Structured plan format (Phase 2) — keep as-is
- Completion report flow (Phase 5) — no change
- NORMAL mode simple tasks stay simple — PLAN mode is the gate
