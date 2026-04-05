# RISE Specification: @mino/inquiry Skill

**Version**: 1.0
**Document ID**: mino-inquiry-skill-v1.0
**Status**: Draft
**Date**: 2026-07-27
**Medicine Wheel Position**: 🌅 EAST (90°) — Inquiry is the first direction
**Lineage**: mino-sdk/rispecs/10-inquiry-overview → mino-sdk/rispecs/11-prompt-decomposition → 00-mino-integration-overview → this spec
**Upstream**: mino-sdk rispecs 10–14 (inquiry package, 11 MCP tools)

---

## 1. Desired Outcome

agent-pi agents **decompose every complex prompt before acting** and **observe structural patterns during every turn**. A new skill (`skills/mino-inquiry/`) wraps @mino/inquiry's 11 MCP tools into a coherent agent-pi skill that integrates with Pi's existing mode system. PDE decompositions are automatically triggered on session start, structural observations run between turns, and pattern detection alerts agents to oscillation before it wastes cycles.

The skill transforms agent-pi from a platform that **reacts to prompts** into one that **inquires into prompts** — understanding not just what the user said, but what they meant, what they assumed, and what they left unspoken.

---

## 2. Current Reality

### What agent-pi Has
- **17 skills** as domain reference packs in `skills/` — Markdown files with SKILL.md + references/
- Skills are auto-scanned from the `skills` key in package.json
- Each skill has a `SKILL.md` defining triggers, usage guidelines, and domain knowledge
- Skills influence agent behavior through system prompt augmentation, not tool registration
- The `mode-prompts.ts` lib injects mode-specific system prompts (PLAN mode already encourages analysis-first)
- No existing decomposition, observation, or pattern detection capability

### What @mino/inquiry Provides (from mino-sdk rispecs 10–14)

**11 MCP Tools in 2 Domains:**

**PDE — Prompt Decomposition Engine (5 tools):**
| Tool | Purpose | Direction |
|------|---------|-----------|
| `pde_decompose` | Build system+user prompts for LLM decomposition | 🌅 East |
| `pde_parse_response` | Parse LLM response → DecompositionResult, auto-save to `.pde/` | 🌅 East |
| `pde_get` | Retrieve stored decomposition by ID | — |
| `pde_list` | List all stored decompositions | — |
| `pde_export_markdown` | Export as Four Directions markdown | — |

**Structural Thinking (6 tools):**
| Tool | Purpose | Direction |
|------|---------|-----------|
| `structural_thinking_observe` | Three-step observation (see → interpret → decide) | 🌅 East |
| `ask_structural_question` | Generate 4 question types (information, clarification, implication, discrepancy) | 🔥 South |
| `detect_reactive_patterns` | Scan for 16 language + 2 structural reactive patterns | 🔥 South |
| `detect_behavioral_pattern` | Classify as oscillation vs. resolving_advancing | 🔥 South |
| `validate_three_universe` | Mia/Miette/Ava consensus scoring | 🔥 South |
| `create_chart_with_pde` | Bridge PDE → STC (creates chart from decomposition) | 🌅+🔥 |

**Key Types:**
```typescript
interface DecompositionResult {
  primary: PrimaryIntent;
  secondary: SecondaryIntent[];
  context: ContextRequirements;
  outputs: ExpectedOutputs;
  directions: DirectionMap;
  actionStack: ActionItem[];
  ambiguities: AmbiguityFlag[];
}

type QuestionType = "information" | "clarification" | "implication" | "discrepancy";
type BehavioralPattern = "oscillation" | "resolving_advancing" | "indeterminate";
type UniverseLens = "mia" | "miette" | "ava";
```

---

## 3. Structural Tension

agent-pi agents jump into execution on the first user message. PLAN mode adds a planning step, but it's prompt-driven — the agent decides what to plan based on its own interpretation of the input. There is no **structural decomposition** that reveals implicit intents, no **pattern detection** that catches oscillation before it wastes 10 turns, and no **three-universe validation** that stress-tests decisions from multiple perspectives. The inquiry skill resolves this by making decomposition and observation **first-class capabilities** that run automatically alongside the agent's natural workflow.

---

## 4. Components

### 4a. Skill Directory Structure

```
skills/
  mino-inquiry/
    SKILL.md              # Skill definition (triggers, guidelines, reference)
    references/
      pde-workflow.md     # PDE step-by-step guide
      structural-obs.md   # Three-step observation protocol
      pattern-catalog.md  # 16 language + 2 structural patterns
```

### 4b. SKILL.md

```markdown
# Mino Inquiry — Prompt Decomposition & Structural Thinking

## When to Use
- **Always on session start**: Decompose the user's initial prompt before any action
- **On complex multi-step requests**: Break down before planning
- **When an agent seems stuck or repeating itself**: Run pattern detection
- **When evaluating a decision with stakes**: Run three-universe validation
- **In PLAN mode**: Structural observation before and after planning
- **In SPEC mode**: Decompose requirements into Four Directions

## Core Workflow

### 1. PDE on Session Start
Every session should begin with prompt decomposition:
1. Call `mino_pde_decompose` with the user's initial message
2. Process the returned system+user prompts through the LLM
3. Call `mino_pde_parse_response` with the LLM output
4. Use the DecompositionResult to guide all subsequent actions

### 2. Structural Observation During Turns
Between major phases of work:
1. Call `mino_structural_observe` with the current state
2. Review the three-step output (see → interpret → decide)
3. Adjust approach based on observations

### 3. Pattern Detection When Stuck
If progress stalls or decisions reverse:
1. Call `mino_detect_reactive_patterns` on recent conversation
2. If patterns found, call `mino_detect_behavioral_pattern`
3. If oscillation detected, use structural observation to find the root tension

## Available Tools
- `mino_pde_decompose` — Decompose a prompt into structured intents
- `mino_pde_parse_response` — Parse and store decomposition result
- `mino_pde_get` — Retrieve stored decomposition
- `mino_pde_list` — List all decompositions
- `mino_pde_export_markdown` — Export as markdown
- `mino_structural_observe` — Three-step structural observation
- `mino_ask_structural_question` — Generate targeted questions
- `mino_detect_reactive_patterns` — Scan for reactive language/structure
- `mino_detect_behavioral_pattern` — Classify oscillation vs. advancing
- `mino_validate_three_universe` — Mia/Miette/Ava consensus check
- `mino_create_chart_with_pde` — Bridge decomposition → STC chart

## References
See `references/` for detailed protocol documentation.
```

### 4c. Tool Registration Extension

The inquiry skill's tools are registered via a companion extension (skills provide domain knowledge; extensions provide tools):

```typescript
// extensions/mino-inquiry.ts
// ABOUTME: Registers @mino/inquiry's 11 MCP tools and auto-triggers PDE on session start
// ABOUTME: Companion to skills/mino-inquiry/ which provides agent guidance

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { PdeEngine } from "@mino/inquiry";
import {
  performStructuralObservation,
  generateStructuralQuestions,
  detectReactivePatterns,
  detectBehavioralPattern,
  validateThreeUniverse,
  createChartWithPDE,
} from "@mino/inquiry";
import { PdeFileStore } from "@mino/store";
import { getSessionStore } from "./lib/mino-bridge";

export default function (pi: ExtensionAPI) {
  let pdeEngine: PdeEngine | null = null;
  let pdeStore: PdeFileStore | null = null;

  pi.on("session_start", async (event, ctx) => {
    const workdir = process.cwd();
    pdeStore = new PdeFileStore(workdir);
    pdeEngine = new PdeEngine();

    // --- PDE Tools (5) ---
    pi.registerTool({
      name: "mino_pde_decompose",
      description:
        "Decompose a complex prompt into structured intents with Four Directions mapping. " +
        "Returns systemPrompt + userMessage for LLM processing. " +
        "Call mino_pde_parse_response with the LLM output to store the result.",
      parameters: {
        type: "object",
        properties: {
          prompt: { type: "string", description: "The prompt to decompose" },
          extractImplicit: {
            type: "boolean",
            description: "Extract implicit intents from hedging language (default: true)",
          },
          mapDependencies: {
            type: "boolean",
            description: "Map dependencies between actions (default: true)",
          },
        },
        required: ["prompt"],
      },
      execute: async (args) => {
        const result = pdeEngine!.buildPrompt(args.prompt as string, {
          extractImplicit: (args.extractImplicit as boolean) ?? true,
          mapDependencies: (args.mapDependencies as boolean) ?? true,
        });
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_pde_parse_response",
      description:
        "Parse an LLM response containing a DecompositionResult JSON and auto-save to .pde/ directory. " +
        "Call this after processing the prompts returned by mino_pde_decompose.",
      parameters: {
        type: "object",
        properties: {
          llmResponse: { type: "string", description: "Raw LLM response text" },
          originalPrompt: { type: "string", description: "The original prompt that was decomposed" },
        },
        required: ["llmResponse", "originalPrompt"],
      },
      execute: async (args) => {
        const result = await pdeEngine!.parseAndStore(
          args.llmResponse as string,
          args.originalPrompt as string,
          pdeStore!
        );
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_pde_get",
      description: "Retrieve a stored PDE decomposition by its UUID",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Decomposition UUID" },
        },
        required: ["id"],
      },
      execute: async (args) => {
        const result = await pdeStore!.get(args.id as string);
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_pde_list",
      description: "List all stored PDE decompositions with metadata",
      parameters: {
        type: "object",
        properties: {
          limit: { type: "number", description: "Max results (default: 10)" },
        },
      },
      execute: async (args) => {
        const result = await pdeStore!.list((args.limit as number) ?? 10);
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_pde_export_markdown",
      description: "Export a decomposition as a git-diffable markdown document with Four Directions headers",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string", description: "Decomposition UUID" },
        },
        required: ["id"],
      },
      execute: async (args) => {
        const result = await pdeStore!.exportMarkdown(args.id as string);
        return { output: result };
      },
    });

    // --- Structural Thinking Tools (6) ---
    pi.registerTool({
      name: "mino_structural_observe",
      description:
        "Perform a three-step structural observation: see (what is), interpret (what it means), decide (what to do). " +
        "Use between major phases of work to maintain structural awareness.",
      parameters: {
        type: "object",
        properties: {
          context: { type: "string", description: "Current situation to observe" },
          focus: { type: "string", description: "Optional focus area for observation" },
        },
        required: ["context"],
      },
      execute: async (args) => {
        const store = getSessionStore(process.cwd());
        const result = await performStructuralObservation(
          args.context as string,
          store,
          args.focus as string | undefined
        );
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_ask_structural_question",
      description:
        "Generate targeted structural questions of 4 types: information (what do we need to know?), " +
        "clarification (what is ambiguous?), implication (what follows from this?), " +
        "discrepancy (what contradicts?)",
      parameters: {
        type: "object",
        properties: {
          context: { type: "string" },
          questionType: {
            type: "string",
            enum: ["information", "clarification", "implication", "discrepancy"],
            description: "Type of question to generate",
          },
        },
        required: ["context"],
      },
      execute: async (args) => {
        const result = await generateStructuralQuestions(
          args.context as string,
          args.questionType as string | undefined
        );
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_detect_reactive_patterns",
      description:
        "Scan text for 16 language patterns and 2 structural patterns that indicate reactive (non-creative) orientation. " +
        "Examples: hedging, blame shifting, problem fixation, oscillation markers.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text to scan for reactive patterns" },
        },
        required: ["text"],
      },
      execute: async (args) => {
        const result = detectReactivePatterns(args.text as string);
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_detect_behavioral_pattern",
      description:
        "Classify behavior as 'oscillation' (action-reaction loops), " +
        "'resolving_advancing' (creative tension driving forward), or 'indeterminate'",
      parameters: {
        type: "object",
        properties: {
          actions: {
            type: "array",
            items: { type: "string" },
            description: "Sequence of recent actions/decisions to analyze",
          },
        },
        required: ["actions"],
      },
      execute: async (args) => {
        const result = detectBehavioralPattern(args.actions as string[]);
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_validate_three_universe",
      description:
        "Score a decision from 3 perspectives — Mia (structural architect), " +
        "Miette (emotional illuminator), Ava (pragmatic executor) — and compute consensus",
      parameters: {
        type: "object",
        properties: {
          decision: { type: "string", description: "The decision to validate" },
          context: { type: "string", description: "Surrounding context" },
        },
        required: ["decision"],
      },
      execute: async (args) => {
        const result = await validateThreeUniverse(
          args.decision as string,
          args.context as string | undefined
        );
        return { output: JSON.stringify(result) };
      },
    });

    pi.registerTool({
      name: "mino_create_chart_with_pde",
      description:
        "Bridge PDE decomposition → structural tension chart. Creates an STC from a decomposition's " +
        "primary intent (desired outcome) and context (current reality).",
      parameters: {
        type: "object",
        properties: {
          pdeId: { type: "string", description: "PDE decomposition UUID to convert" },
        },
        required: ["pdeId"],
      },
      execute: async (args) => {
        const store = getSessionStore(process.cwd());
        const result = await createChartWithPDE(args.pdeId as string, pdeStore!, store);
        return { output: JSON.stringify(result) };
      },
    });
  });

  pi.on("session_shutdown", async () => {
    pdeEngine = null;
    pdeStore = null;
  });
}
```

### 4d. `.pde/` Storage Integration

PDE decompositions are stored alongside the project:

```
.pde/
├── <uuid>.json           # DecompositionResult JSON
├── <uuid>.md             # Four Directions markdown export
└── index.json            # Decomposition index (id, timestamp, primary intent)
```

The `.pde/` directory should be added to `.gitignore` (session-specific data) unless the team decides decompositions are worth versioning.

### 4e. Auto-PDE on Session Start

The extension can optionally trigger PDE on the first user message:

```typescript
// In session_start handler:
let firstMessage = true;

pi.on("before_agent_start", async (event, ctx) => {
  if (firstMessage && ctx.userMessage) {
    firstMessage = false;

    // Only auto-decompose if message is complex (>100 chars, multiple sentences)
    const msg = ctx.userMessage;
    if (msg.length > 100 && (msg.match(/\./g) || []).length > 1) {
      const decomposition = pdeEngine!.buildPrompt(msg);
      // Inject decomposition context into system prompt
      ctx.appendSystemPrompt(
        `\n\n## PDE Decomposition Available\n` +
        `The user's prompt has been decomposed. Use mino_pde_parse_response ` +
        `after reviewing the decomposition prompts to store the structured result.\n` +
        `Primary intent detected in prompt. Consider calling mino_pde_decompose ` +
        `for full structural analysis before proceeding.`
      );
    }
  }
});
```

### 4f. Mode Integration

| Pi Mode | Inquiry Behavior |
|---------|------------------|
| PLAN | Auto-PDE on first message; structural observation after planning |
| SPEC | PDE to decompose requirements; three-universe validation on spec decisions |
| NORMAL | Tools available on demand; no auto-trigger |
| TEAM | Dispatcher runs PDE; passes decomposition to dispatched agents |
| CHAIN | PDE on chain input; observation between chain steps |
| PIPELINE | PDE in UNDERSTAND phase; pattern detection in REVIEW phase |

---

## 5. Anti-Patterns

| Anti-Pattern | Why It Fails | What To Do Instead |
|---|---|---|
| **PDE every single message** | Overhead on simple messages ("fix this typo"); clutters .pde/ | Only auto-PDE complex messages (>100 chars, multi-sentence) |
| **Skip PDE and go straight to coding** | Misses implicit intents, ambiguities, dependency ordering | Decompose first in PLAN/SPEC/PIPELINE modes |
| **Treat pattern detection as an error system** | Oscillation is diagnostic, not punitive — agents resist "correction" | Present patterns as structural observations, not failures |
| **Run three-universe on trivial decisions** | Overhead without value; consensus on "use const vs let" wastes turns | Reserve for architectural or relational decisions |
| **Store PDE results only in memory** | Lost on compaction, unavailable to other agents in team dispatch | Always persist to .pde/ via pde_parse_response |
| **Import @mino/inquiry directly in the skill** | Skills are Markdown reference packs, not code modules | Tools go in the companion extension; skill provides guidance |

---

## 6. Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | All 11 inquiry tools registered and callable | `tool_search("mino_pde")` returns 5; `tool_search("mino_structural")` returns 1; `tool_search("mino_detect")` returns 2; `tool_search("mino_ask")` returns 1; `tool_search("mino_validate")` returns 1; `tool_search("mino_create_chart_with")` returns 1 |
| 2 | PDE round-trip: decompose → parse → get → export | `.pde/<uuid>.json` exists with valid DecompositionResult; `.pde/<uuid>.md` contains Four Directions headers |
| 3 | Structural observation produces three-step output | Result contains `see`, `interpret`, `decide` fields |
| 4 | Reactive pattern detection finds known patterns | Input "we should probably try maybe fixing this" triggers hedging patterns |
| 5 | Behavioral pattern classification works | Alternating [do X, undo X, do X] classified as `oscillation` |
| 6 | Three-universe validation returns 3 scores + consensus | Result has `mia`, `miette`, `ava` scores and `consensus` field |
| 7 | `mino_create_chart_with_pde` creates chart from decomposition | Chart exists in `.coaia/` with desired outcome from PDE primary intent |
| 8 | Skill SKILL.md loaded by Pi's skill scanner | Agent system prompt includes mino-inquiry skill guidance when relevant |
| 9 | PDE auto-trigger fires in PLAN mode on complex input | First message >100 chars gets decomposition context injected |
