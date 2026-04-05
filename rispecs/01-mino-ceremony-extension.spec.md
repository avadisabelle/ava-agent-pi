# RISE Specification: @mino/ceremony Extension

**Version**: 1.0
**Document ID**: mino-ceremony-extension-v1.0
**Status**: Draft
**Date**: 2026-07-27
**Medicine Wheel Position**: 🌊 WEST (270°) — The ceremony lives in the doing
**Lineage**: mino-sdk/rispecs/15-ceremony-overview → mino-sdk/rispecs/16-ceremony-graph → 00-mino-integration-overview → this spec
**Upstream**: mino-sdk rispecs 15–19 (ceremony package, 33 MCP tools)

---

## 1. Desired Outcome

agent-pi gains a single Pi extension (`extensions/mino-ceremony.ts`) that bootstraps the full @mino/ceremony surface — 33 tools across 5 domains (STC, knowledge graph, narrative, plan bridge, MMOT) — into Pi's tool system. The extension owns the `.coaia/` directory lifecycle, maps Pi session events to ceremony direction transitions, and enables every operational mode to work with structural tension charts, knowledge graphs, and narrative arcs natively.

The extension is **the single entry point** for all ceremony state in agent-pi. Other extensions and skills access ceremony through it, never by importing @mino/ceremony directly.

---

## 2. Current Reality

### What Exists in agent-pi
- Extensions register tools via `pi.registerTool()` and listen to events via `pi.on()`
- `session_start` and `session_shutdown` events bracket every session
- `tool_call` event allows pre-execution gating (used by security-guard)
- `after_agent_response` event fires after each agent turn
- Extensions share state via module-level singletons and the `lib/` shared directory
- The sacred-closing spec (rispecs/sacred-closing.spec.md) already envisions `.mw/north/reflections/` storage

### What @mino/ceremony Provides (from mino-sdk rispecs 15–19)

**5 Domain Classes:**

| Class | Tools | Domain |
|-------|-------|--------|
| `CeremonyGraph` | 14 STC + 9 KG = 23 | Structural tension charts + knowledge graph |
| `NarrativeEngine` | 3 | Beat discovery, 3-act arc, markdown export |
| `PlanBridge` | 6 | Plan parsing, bidirectional sync, PDE bridge |
| `MmotEvaluator` | 1 | Four-phase self-evaluation loop |

**33 MCP Tools (complete list):**

STC (14): `create_chart`, `get_chart`, `list_charts`, `update_desired_outcome`, `update_current_reality`, `add_action`, `advance_action`, `complete_action`, `telescope`, `get_action`, `get_chart_progress`, `manage_action`, `mark_action_complete`, `init_guidance`

KG (9): `create_entities`, `create_relations`, `add_observations`, `delete_entities`, `delete_relations`, `delete_observations`, `read_graph`, `search_nodes`, `open_nodes`

Narrative (3): `find_narrative_beats`, `create_narrative_arc`, `export_narrative_markdown`

Plan Bridge (6): `parse_plan_structural`, `plan_to_stc`, `sync_plan_to_chart`, `sync_chart_to_plan`, `create_plan_trace`, `pde_to_plan`

MMOT (1): `evaluate_mmot`

---

## 3. Structural Tension

agent-pi can orchestrate multiple agents across modes, chains, and pipelines — but those agents operate in a **structurally flat** space. They cannot create, track, or reflect on structural tension charts. They cannot build knowledge graphs of the entities they discover. They cannot find narrative beats in their own work. The ceremony extension resolves this by wiring @mino/ceremony's 33 tools into Pi's existing tool dispatch, making ceremony a **native capability** of every agent in every mode.

---

## 4. Components

### 4a. Extension File Structure

```
extensions/
  mino-ceremony.ts          # Main extension (registers tools, manages lifecycle)
  lib/
    mino-bridge.ts          # Shared store + session (see spec 04)
    mino-ceremony-tools.ts  # Tool registration helpers
```

### 4b. Extension Entry Point

```typescript
// extensions/mino-ceremony.ts
// ABOUTME: Bootstraps @mino/ceremony — 33 MCP tools for STC, KG, narrative, planning, MMOT
// ABOUTME: Manages .coaia/ lifecycle and direction-aware tool gating

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { CeremonyGraph, NarrativeEngine, PlanBridge, MmotEvaluator } from "@mino/ceremony";
import type { KnowledgeStore } from "@mino/store";
import { getSessionStore, disposeSessionStore } from "./lib/mino-bridge";

export default function (pi: ExtensionAPI) {
  let graph: CeremonyGraph | null = null;
  let narrative: NarrativeEngine | null = null;
  let planBridge: PlanBridge | null = null;
  let mmot: MmotEvaluator | null = null;

  pi.on("session_start", async (event, ctx) => {
    const workdir = process.cwd();
    const store: KnowledgeStore = getSessionStore(workdir);

    graph = new CeremonyGraph(store);
    narrative = new NarrativeEngine(store);
    planBridge = new PlanBridge(store);
    mmot = new MmotEvaluator(store);

    registerStcTools(pi, graph);
    registerKgTools(pi, graph);
    registerNarrativeTools(pi, narrative);
    registerPlanTools(pi, planBridge);
    registerMmotTools(pi, mmot);
  });

  pi.on("session_shutdown", async () => {
    graph = null;
    narrative = null;
    planBridge = null;
    mmot = null;
    disposeSessionStore();
  });
}
```

### 4c. Tool Registration Helpers

```typescript
// extensions/lib/mino-ceremony-tools.ts

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { CeremonyGraph, NarrativeEngine, PlanBridge, MmotEvaluator } from "@mino/ceremony";

// --- STC Tools (14) ---
export function registerStcTools(pi: ExtensionAPI, graph: CeremonyGraph) {
  pi.registerTool({
    name: "mino_create_chart",
    description: "Create a new structural tension chart with desired outcome, current reality, and action steps",
    parameters: {
      type: "object",
      properties: {
        desiredOutcome: { type: "string", description: "What we want to create" },
        currentReality: { type: "string", description: "What exists right now" },
        actions: {
          type: "array",
          items: { type: "string" },
          description: "Concrete action steps to advance from reality toward outcome",
        },
      },
      required: ["desiredOutcome", "currentReality"],
    },
    execute: async (args) => {
      const result = await graph.createChart(args);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_get_chart",
    description: "Retrieve a structural tension chart by ID with full state and completion metrics",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string", description: "Chart UUID" },
      },
      required: ["chartId"],
    },
    execute: async (args) => {
      const result = await graph.getChart(args.chartId as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_list_charts",
    description: "List all structural tension charts with completion percentages",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const result = await graph.listCharts();
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_update_desired_outcome",
    description: "Modify a chart's desired outcome (the vision)",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
        desiredOutcome: { type: "string" },
      },
      required: ["chartId", "desiredOutcome"],
    },
    execute: async (args) => {
      const result = await graph.updateDesiredOutcome(args.chartId as string, args.desiredOutcome as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_update_current_reality",
    description: "Add observations to a chart's current reality assessment",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
        observations: { type: "array", items: { type: "string" } },
      },
      required: ["chartId", "observations"],
    },
    execute: async (args) => {
      const result = await graph.updateCurrentReality(args.chartId as string, args.observations as string[]);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_add_action",
    description: "Add an action step to a structural tension chart",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
        action: { type: "string", description: "Concrete action to advance toward desired outcome" },
      },
      required: ["chartId", "action"],
    },
    execute: async (args) => {
      const result = await graph.addAction(args.chartId as string, args.action as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_advance_action",
    description: "Mark an action as in-progress (advancing)",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
        actionId: { type: "string" },
      },
      required: ["chartId", "actionId"],
    },
    execute: async (args) => {
      const result = await graph.advanceAction(args.chartId as string, args.actionId as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_complete_action",
    description: "Complete an action; its observation flows into current reality",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
        actionId: { type: "string" },
        observation: { type: "string", description: "What was learned/achieved by completing this action" },
      },
      required: ["chartId", "actionId"],
    },
    execute: async (args) => {
      const result = await graph.completeAction(
        args.chartId as string,
        args.actionId as string,
        args.observation as string
      );
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_telescope",
    description: "Create a sub-chart from an action (recursive structural tension)",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
        actionId: { type: "string" },
      },
      required: ["chartId", "actionId"],
    },
    execute: async (args) => {
      const result = await graph.telescope(args.chartId as string, args.actionId as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_get_chart_progress",
    description: "Get completion percentage, next action, and action counts for a chart",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
      },
      required: ["chartId"],
    },
    execute: async (args) => {
      const result = await graph.getChartProgress(args.chartId as string);
      return { output: JSON.stringify(result) };
    },
  });

  // Remaining STC tools: get_action, manage_action, mark_action_complete, init_guidance
  // Follow the same pattern. Omitted for brevity — implementor registers all 14.
}

// --- Knowledge Graph Tools (9) ---
export function registerKgTools(pi: ExtensionAPI, graph: CeremonyGraph) {
  pi.registerTool({
    name: "mino_create_entities",
    description: "Create entities in the knowledge graph with types and observations",
    parameters: {
      type: "object",
      properties: {
        entities: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              entityType: { type: "string" },
              observations: { type: "array", items: { type: "string" } },
            },
            required: ["name", "entityType"],
          },
        },
      },
      required: ["entities"],
    },
    execute: async (args) => {
      const result = await graph.createEntities(args.entities as any[]);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_create_relations",
    description: "Create relations between entities in the knowledge graph",
    parameters: {
      type: "object",
      properties: {
        relations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              relationType: { type: "string" },
            },
            required: ["from", "to", "relationType"],
          },
        },
      },
      required: ["relations"],
    },
    execute: async (args) => {
      const result = await graph.createRelations(args.relations as any[]);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_read_graph",
    description: "Load the full knowledge graph from the store",
    parameters: { type: "object", properties: {} },
    execute: async () => {
      const result = await graph.readGraph();
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_search_nodes",
    description: "Search the knowledge graph by name or entity type pattern",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term (matches name and type)" },
      },
      required: ["query"],
    },
    execute: async (args) => {
      const result = await graph.searchNodes(args.query as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_open_nodes",
    description: "Retrieve specific entities by name",
    parameters: {
      type: "object",
      properties: {
        names: { type: "array", items: { type: "string" } },
      },
      required: ["names"],
    },
    execute: async (args) => {
      const result = await graph.openNodes(args.names as string[]);
      return { output: JSON.stringify(result) };
    },
  });

  // Remaining KG tools: add_observations, delete_entities, delete_relations, delete_observations
  // Follow the same pattern. Implementor registers all 9.
}

// --- Narrative Tools (3) ---
export function registerNarrativeTools(pi: ExtensionAPI, narrative: NarrativeEngine) {
  pi.registerTool({
    name: "mino_find_narrative_beats",
    description: "Discover story moments in a structural tension chart",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
      },
      required: ["chartId"],
    },
    execute: async (args) => {
      const result = await narrative.findNarrativeBeats(args.chartId as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_create_narrative_arc",
    description: "Generate a 3-act narrative arc from a chart's history",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
      },
      required: ["chartId"],
    },
    execute: async (args) => {
      const result = await narrative.createNarrativeArc(args.chartId as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_export_narrative_markdown",
    description: "Export a chart's story as markdown",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string" },
      },
      required: ["chartId"],
    },
    execute: async (args) => {
      const result = await narrative.exportNarrativeMarkdown(args.chartId as string);
      return { output: JSON.stringify(result) };
    },
  });
}

// --- Plan Bridge Tools (6) ---
export function registerPlanTools(pi: ExtensionAPI, planBridge: PlanBridge) {
  pi.registerTool({
    name: "mino_plan_to_stc",
    description: "Convert a markdown plan into a structural tension chart",
    parameters: {
      type: "object",
      properties: {
        planMarkdown: { type: "string", description: "Plan in markdown format" },
      },
      required: ["planMarkdown"],
    },
    execute: async (args) => {
      const result = await planBridge.planToStc(args.planMarkdown as string);
      return { output: JSON.stringify(result) };
    },
  });

  pi.registerTool({
    name: "mino_pde_to_plan",
    description: "Bridge a PDE decomposition into a structural plan",
    parameters: {
      type: "object",
      properties: {
        pdeId: { type: "string", description: "PDE decomposition UUID" },
      },
      required: ["pdeId"],
    },
    execute: async (args) => {
      const result = await planBridge.pdeToPlan(args.pdeId as string);
      return { output: JSON.stringify(result) };
    },
  });

  // Remaining plan tools: parse_plan_structural, sync_plan_to_chart,
  // sync_chart_to_plan, create_plan_trace
  // Follow the same pattern. Implementor registers all 6.
}

// --- MMOT Tool (1) ---
export function registerMmotTools(pi: ExtensionAPI, mmot: MmotEvaluator) {
  pi.registerTool({
    name: "mino_evaluate_mmot",
    description: "Run a four-phase Managerial Moment of Truth evaluation (acknowledge → analyze → update → recommit)",
    parameters: {
      type: "object",
      properties: {
        chartId: { type: "string", description: "Chart to evaluate" },
        context: { type: "string", description: "What triggered this evaluation" },
      },
      required: ["chartId"],
    },
    execute: async (args) => {
      const result = await mmot.evaluate(args.chartId as string, args.context as string);
      return { output: JSON.stringify(result) };
    },
  });
}
```

### 4d. `.coaia/` Directory Lifecycle

The extension manages the `.coaia/` directory in the project root:

```
.coaia/
├── memory.jsonl      # Knowledge graph (entities + relations)
├── charts/           # Structural tension charts (one JSONL per chart)
│   ├── <uuid>.jsonl
│   └── ...
└── narratives/       # Exported narrative arcs
    └── ...
```

**Creation**: `JsonlFileStore` auto-creates `.coaia/` on first write.
**Gitignore**: The extension appends `.coaia/` to `.gitignore` if not already present.
**Cleanup**: On `session_shutdown`, the store reference is released but files persist on disk.

### 4e. Session Events → Direction Transitions

The extension observes Pi session events and maps them to @mino/agent's Four Directions:

```typescript
// In session_start handler:
pi.on("before_agent_start", async (event, ctx) => {
  // When mode changes, update ceremony direction
  const mode = ctx.mode; // NORMAL, PLAN, SPEC, TEAM, CHAIN, PIPELINE

  // Mode → Direction mapping
  const modeDirectionMap: Record<string, string> = {
    PLAN: "east",      // Decomposition, inquiry
    SPEC: "south",     // Analysis, protocol
    NORMAL: "west",    // Execution, coding
    TEAM: "west",      // Execution via delegation
    CHAIN: "west",     // Sequential execution
    PIPELINE: "west",  // Phased execution
  };

  const direction = modeDirectionMap[mode] ?? "west";
  // Update session direction for context-aware tool behavior
});
```

### 4f. Mode-Aware Tool Availability

Not all 33 tools need to be available in all modes. The extension can filter based on operational mode:

| Mode | Tools Available | Rationale |
|------|----------------|-----------|
| PLAN | All 33 | Planning needs full access to decompose, chart, and plan |
| SPEC | STC (14) + Plan (6) + MMOT (1) | Specs define structure and evaluate quality |
| NORMAL | STC (14) + KG (9) + Narrative (3) | Coding with structural awareness |
| TEAM | All 33 | Dispatcher needs full visibility |
| CHAIN | STC (14) + Plan (6) | Chain steps advance through actions |
| PIPELINE | All 33 | Pipeline phases map to directions |

Implementation: Tools are always registered but the extension can inject a `tool_call` pre-hook that returns guidance when a tool is called outside its natural mode.

---

## 5. Anti-Patterns

| Anti-Pattern | Why It Fails | What To Do Instead |
|---|---|---|
| **Instantiate CeremonyGraph per tool call** | Creates separate graph instances with no shared state | Single instance per session, stored in extension closure |
| **Store .coaia/ inside Pi's .pi/ directory** | Couples ceremony data to Pi config; breaks portability | Store in project root alongside source code |
| **Re-implement ceremony tools as custom Pi tools** | Duplicates logic, drifts from upstream @mino/ceremony | Delegate to @mino/ceremony classes; thin Pi wrappers only |
| **Register tools in bulk without descriptions** | Agents cannot reason about tool selection | Each tool gets a clear, specific description |
| **Skip session_shutdown cleanup** | Memory leaks across sessions if store holds file handles | Always call disposeSessionStore() |
| **Expose raw JSONL to agents** | Agents generate malformed JSONL, corrupt the store | Always go through CeremonyGraph/NarrativeEngine API |

---

## 6. Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | All 33 ceremony tools registered in Pi on session_start | `tool_search("mino_")` returns 33+ results |
| 2 | `.coaia/` created on first tool invocation, persists after session end | `ls .coaia/memory.jsonl` succeeds after chart creation |
| 3 | `mino_create_chart` + `mino_add_action` + `mino_complete_action` round-trip works | Chart progress shows updated completion % |
| 4 | `mino_create_entities` + `mino_create_relations` + `mino_search_nodes` round-trip works | Search returns created entities with relations |
| 5 | `mino_find_narrative_beats` returns beats for a chart with ≥3 completed actions | Beats array non-empty with timestamps and descriptions |
| 6 | `mino_evaluate_mmot` produces four-phase evaluation output | Result contains acknowledge, analyze, update, recommit fields |
| 7 | Security guard intercepts mino tools through normal `tool_call` gate | `security-guard.ts` logs show mino tool calls in audit trail |
| 8 | Store instance shared between ceremony extension and inquiry skill | Both use `getSessionStore()` from lib/mino-bridge.ts |
