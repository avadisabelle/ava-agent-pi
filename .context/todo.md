# Plan: Enforce Interactive PDE Gate in PLAN Mode — With RISE Awareness

## Context

The PLAN mode system prompt in `extensions/lib/mode-prompts.ts` defines a 5-phase workflow (Decompose → Analyze → Plan → Approve → Implement). Phase 0 (PDE decomposition) is currently a suggestion with an escape hatch — "simple tasks, skip to Phase 1." In practice, agents routinely skip it. The PDE output, when produced, is written to `.pde/` as a flat file and never presented to the user interactively. Meanwhile, Phase 3 (plan approval) uses `show_plan` as a mandatory interactive gate, but Phase 0 has no equivalent.


The `buildNormalPrompt()` function (the classifier that decides when to enter PLAN mode) describes PLAN as "multi-step changes needing a plan + user approval" — no mention of decomposition or interactive UI. The user has no signal that PLAN mode involves consultation.

The `plan-build-review` pipeline chain (`agents/pipeline-team.yaml`) skips decomposition entirely. The planner agent (`agents/planner.md`) has no awareness of `.pde/` or RISE framework guidance.

The RISE framework (`/workspace/llms/llms-rise-framework.txt`) provides creative orientation principles for writing specifications — desired outcomes over reactive elimination, structural tension dynamics, advancing patterns. Agents producing specs should be pointed toward this guidance rather than having it fully inlined.
If not available locally, the can be fetch at `https://llms.jgwill.com/llms-rise-framework.txt`.

---

## Phase 1: PLAN_PROMPT Phase 0 — Mandatory PDE with Intelligent Interactive Gate

**Why:** This is the core change. PDE becomes mandatory in PLAN mode, writes to a timestamped workspace folder, and the agent evaluates (via structural thinking's four question types) whether to present it interactively or proceed.

**Modify** → `extensions/lib/mode-prompts.ts` (PLAN_PROMPT, Phase 0 section, ~lines 103-112)
- Remove "simple tasks — skip to Phase 1" escape hatch
- PDE output goes to `.pde/<YYMMDDHHmm>--<UUID (ex. '6ba571ac-cc6e-4911-9e50-5ab79dbf332f')>/decomposition.md`
- After writing PDE, add self-evaluation step:
  - "Review the decomposition through structural thinking's four question types: Information (what's vague? (ambiguities)), Clarification (what terms need the user's specific definition?), Implication (what's implied but unverified?), Discrepancy (what contradicts?)"
  - If any genuine questions arise → present via `show_plan { file_path: ".pde/.../decomposition.md", mode: "questions" }` with a freeform notes section at the end
  - If no genuine ambiguity → log the decision, proceed to Phase 1.  
- Gate language: "Do NOT proceed to Phase 1 until PDE is either accepted interactively OR deemed unambiguous through the four question types evaluation".  I might be relevant to create an evaluation template or documentation on the usage of the four question types evaluation (so we can keep track of the evolution of this innovation within the system's actual files).

---

## Phase 2: buildNormalPrompt Mode Table — Signal the Interactive Experience

**Why:** The classifier is where the agent decides to enter PLAN mode. If it doesn't know PLAN involves decomposition + interactive UI, it can't set user expectations.

**Modify** → `extensions/lib/mode-prompts.ts` (buildNormalPrompt function, mode selection table, ~lines 76-93)
- Change PLAN description from:
  `"Multi-step changes needing a plan + user approval before coding."`
  to:
  `"Multi-step changes → PDE decomposition + interactive approval before coding."`
- This is a one-line change but signals the entire PLAN experience

---

## Phase 3: RISE Awareness Section in PLAN_PROMPT

**Why:** Specs and requirements written in PLAN mode should follow RISE principles — but flexibly, as a pointer rather than a mandate.

**Modify** → `extensions/lib/mode-prompts.ts` (PLAN_PROMPT, add new section after Phase 5 / before Rules)
- Add a "RISE Framework Awareness" section:
  - "When the task involves writing specifications, requirements, or feature descriptions:"
  - "The RISE framework provides guidance for creative-oriented specification writing"
  - "Read the framework at `/workspace/llms/llms-rise-framework.txt` if available"
  - "If not found locally, fetch from `https://llms.jgwill.com/llms-rise-framework.txt` and cache to `.pde/rise-framework-cache.txt`"
  - Key principles to carry (brief): creative orientation (what users create, not problems solved), structural tension (current reality → desired outcome), advancing patterns (not oscillating), spec autonomy (another LLM could implement from spec alone)
  - "Apply RISE quality criteria to any specs produced — but flexibly, as guidance not rigid checklist.  Mermaid diagram rendering into the specs would be great."

---

## Phase 4: Planner Agent — PDE + RISE Awareness

**Why:** The planner agent is used in pipeline chains and TEAM mode. It currently plans from scratch without reading PDE or knowing about RISE.

**Modify** → `agents/planner.md`
- Add to Role section: "If `.pde/` contains a decomposition for the current task, read it first and plan from the accepted intents rather than starting from scratch"
- Add RISE pointer: "When the plan involves writing specifications or feature descriptions, consult the RISE framework at `/workspace/llms/llms-rise-framework.txt` for creative-oriented specification principles"

---

## Phase 5: Pipeline Chain — Add Decompose Phase

**Why:** The `plan-build-review` chain currently goes straight to planning without decomposition. Adding a decompose phase makes PDE available to the planner.

**Modify** → `agents/pipeline-team.yaml`
- In `plan-build-review` chain, add `decompose` phase before `plan`:
  ```yaml
  - name: decompose
    description: "Decompose the task using PDE — identify intents, directions, and ambiguities"
    mode: interactive
    agents:
      - role: planner
        task_template: "Decompose this task into primary/secondary intents using the PDE methodology. Write to .pde/. If ambiguities exist, present interactively: $INPUT"
  ```
- Keep existing plan/build/review phases unchanged

---

## Critical Files

| File | Action |
|------|--------|
| `extensions/lib/mode-prompts.ts` | Modify (Phase 0 mandatory PDE, mode table, RISE section) |
| `agents/planner.md` | Modify (read .pde/, RISE pointer) |
| `agents/pipeline-team.yaml` | Modify (add decompose phase) |
| `agents/scout.md` | Reference (already reads .pde/ — validates existing integration) |
| `.pde/plan-mode-pde-gate-accepted.md` | Reference (accepted PDE driving this plan) |

## Reusable Components (no changes needed)

- **show_plan viewer** (`extensions/plan-viewer.ts`) — already supports questions mode, works as the interactive gate
- **scout agent** (`agents/scout.md`) — already reads `.pde/` and scouts for decomposed intents
- **mode-cycler** (`extensions/mode-cycler.ts`) — set_mode tool and before_agent_start hook work correctly
- **pde_decompose tool** — external tool, used when available, manual fallback documented

## Verification

1. Enter PLAN mode with a complex multi-intent request → verify PDE is written to `.pde/<timestamp>--<id>/`
2. Verify `show_plan` opens in questions mode with the decomposition + freeform notes field
3. Annotate and accept → verify scouts reference the accepted PDE
4. Enter PLAN mode with an unambiguous single-intent request → verify agent evaluates "no genuine ambiguity" and proceeds without interactive gate
5. Run `plan-build-review` chain → verify decompose phase executes before plan phase
6. Request specs in PLAN mode → verify RISE framework is referenced and spec language follows creative orientation


-----
ADDITIONAL STUFF
-----

## 1. Just to make sure you received this new version of the plan, show me few nice GLYPHS in your outputs...

## 2. looking at `/workspace/repos/jgwill/agent-pi/.context/todo.md` which is what is presented here

* The fact that I am presented from ./.context/todo.md WILL CONFLICT if many agents working within a folder, it should be maybe from a unique subdirectory related to what we are creating

