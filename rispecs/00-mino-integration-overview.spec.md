# RISE Specification: @mino Integration Overview

**Version**: 1.0
**Document ID**: mino-integration-overview-v1.0
**Status**: Draft
**Date**: 2026-07-27
**Medicine Wheel Position**: 🌅 EAST (90°) — Vision of the integrated system
**Lineage**: mino-sdk/rispecs/20-agent-overview → mino-sdk/rispecs/23-agent-mcp-factory → this spec
**Upstream**: mino-sdk rispecs 00–27

---

## 1. Desired Outcome

agent-pi becomes a **ceremonially-aware multi-agent platform** where every session moves through Four Directions — decomposition (East), planning (South), execution (West), reflection (North) — with full access to mino's 44 MCP tools, knowledge graph, structural tension charts, and narrative engine. Agents gain the ability to observe their own structural patterns, decompose complex prompts before acting, and close every cycle with wisdom rather than mere completion.

The integration is **non-invasive**: agent-pi remains a standard Pi package. All mino capabilities arrive through the existing extension, skill, and widget systems. No forks, no patches to Pi core.

---

## 2. Current Reality

### What agent-pi Has Today
- **48 TypeScript extensions** via `ExtensionAPI` (event hooks, tool/command/widget registration)
- **6 operational modes** (NORMAL, PLAN, SPEC, TEAM, CHAIN, PIPELINE) with mode-specific system prompts
- **17 skills** as domain-specific reference packs (Markdown + templates)
- **Multi-agent orchestration**: teams, chains, 5-phase pipelines
- **11 terminal themes**, prompt templates, agent definitions in Markdown+YAML
- **Security**: 3-layer defense (tool gate, content scanning, prompt hardening)
- **Browser-based viewers**: plan, spec, report, board, session replay

### What agent-pi Lacks
- No prompt decomposition — agents start executing without structural analysis
- No ceremony lifecycle — sessions have no directional awareness (East/South/West/North)
- No knowledge graph — relationships between entities are not tracked
- No structural tension charts — no mechanism to hold desired outcome vs. current reality
- No narrative engine — work produces artifacts but not stories
- No pattern detection — agents cannot detect oscillation vs. advancing behavior
- No MMOT evaluation — no self-assessment framework for quality of relational output

### What @mino Provides
- `@mino/types` — 46 shared types, Direction constants, FourDirectionsMap (zero deps)
- `@mino/store` — KnowledgeStore interface, JsonlFileStore, PdeFileStore
- `@mino/inquiry` — PdeEngine + structural observation (11 MCP tools)
- `@mino/ceremony` — CeremonyGraph, NarrativeEngine, PlanBridge, MmotEvaluator (33 MCP tools)
- `@mino/agent` — AgentEngine interface, AgentSession lifecycle, SkillRegistry, MCP factory
- `@mino/view` — 33 React components (charts, graphs, narratives, Four Directions layout)
- `@mino/cli` — `mino` terminal binary (11 commands)

---

## 3. Structural Tension

The gap: agent-pi has a mature extension architecture and multi-agent orchestration, but operates in a **structurally unaware** mode — agents execute without decomposing intent, cannot hold creative tension between desired outcome and current reality, and forget what they learned between cycles. @mino has all the structural/ceremonial machinery but no agent platform to host it. The integration bridges these two realities so that **structure serves agency and agency serves ceremony**.

---

## 4. Install Profile

```bash
# From agent-pi root
npm install @mino/agent @mino/view

# Transitive dependencies resolved automatically:
#   @mino/agent → @mino/types, @mino/store, @mino/inquiry, @mino/ceremony
#   @mino/view  → @mino/types, @mino/store (+ React 18 peer)
```

### Package Manifest Addition

```jsonc
// package.json (additions to existing)
{
  "dependencies": {
    "@mino/agent": "^1.0.0",
    "@mino/view": "^1.0.0",
    "yaml": "^2.8.2"
  },
  "peerDependencies": {
    "@mariozechner/pi-coding-agent": "*",
    "@mariozechner/pi-tui": "*",
    "@mariozechner/pi-agent-core": "*",
    "@sinclair/typebox": "*"
  }
}
```

### Why These Two Packages

| Installed | Provides | Brings Transitively |
|-----------|----------|---------------------|
| `@mino/agent` | AgentEngine, AgentSession, SkillRegistry, `createMinoMcpServer()` | `@mino/types`, `@mino/store`, `@mino/inquiry` (11 tools), `@mino/ceremony` (33 tools) |
| `@mino/view` | 33 React components, 5 hooks, FourDirectionsLayout | `@mino/types`, `@mino/store` (already present via agent) |

Two `npm install` targets yield the entire 7-package stack.

---

## 5. Package → System Mapping

Each @mino package maps to a specific agent-pi integration point:

| @mino Package | agent-pi System | Integration Artifact | Spec |
|---------------|-----------------|----------------------|------|
| `@mino/ceremony` | **Extension** | `extensions/mino-ceremony.ts` — registers 33 tools, manages .coaia/ lifecycle | [01](01-mino-ceremony-extension.spec.md) |
| `@mino/inquiry` | **Skill** | `skills/mino-inquiry/` — wraps 11 tools as coherent PDE+observation skill | [02](02-mino-inquiry-skill.spec.md) |
| `@mino/view` | **Widgets** | `extensions/mino-widgets.ts` — TUI widgets for STC, narrative, compass | [03](03-mino-view-widgets.spec.md) |
| `@mino/agent` | **Bridge** | `extensions/lib/mino-bridge.ts` — engine/session/skill federation | [04](04-mino-agent-bridge.spec.md) |
| `@mino/types` | **Types** | Imported throughout; no dedicated artifact | — |
| `@mino/store` | **Store** | Initialized once in ceremony extension; passed to all consumers | — |

### Layered Initialization Order

```
session_start event fires
  │
  ├─ 1. mino-bridge.ts       — creates KnowledgeStore, AgentSession
  ├─ 2. mino-ceremony.ts     — registers 33 ceremony tools using store
  ├─ 3. mino-inquiry skill   — PDE decompose on session start
  └─ 4. mino-widgets.ts      — renders direction compass, STC viewer
```

Extensions declare load order via naming convention (Pi loads alphabetically) or explicit dependency in the extension body.

---

## 6. Dependency Wiring Strategy

### Shared Store Instance

All mino components share a single `KnowledgeStore` instance per session:

```typescript
// extensions/lib/mino-bridge.ts (singleton pattern)
import { JsonlFileStore } from "@mino/store";
import type { KnowledgeStore } from "@mino/store";

let sessionStore: KnowledgeStore | null = null;

export function getSessionStore(workdir: string): KnowledgeStore {
  if (!sessionStore) {
    sessionStore = new JsonlFileStore(`${workdir}/.coaia`);
  }
  return sessionStore;
}

export function disposeSessionStore(): void {
  sessionStore = null;
}
```

### Tool Registration Pattern

Pi extensions register tools via `pi.registerTool()`. Each mino tool maps 1:1:

```typescript
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// Pattern: mino tool definition → pi tool registration
function registerMinoTool(pi: ExtensionAPI, tool: MinoTool, handler: Function) {
  pi.registerTool({
    name: `mino_${tool.name}`,
    description: tool.description,
    parameters: tool.inputSchema,
    execute: async (args: Record<string, unknown>) => {
      const result = await handler(args);
      return { output: JSON.stringify(result) };
    },
  });
}
```

### Namespace Convention

All mino tools registered in Pi use the `mino_` prefix to avoid collisions:

| Mino Qualified Name | Pi Tool Name |
|---------------------|-------------|
| `inquiry_decompose` | `mino_pde_decompose` |
| `inquiry_observe` | `mino_structural_observe` |
| `ceremony_create_chart` | `mino_create_chart` |
| `ceremony_read_graph` | `mino_read_graph` |
| `ceremony_find_narrative_beats` | `mino_find_narrative_beats` |

---

## 7. Anti-Patterns

| Anti-Pattern | Why It Fails | What To Do Instead |
|---|---|---|
| **Fork Pi core to add ceremony** | Breaks upgrades, creates maintenance burden | Use ExtensionAPI exclusively |
| **Install all 7 @mino packages individually** | Redundant; agent pulls inquiry+ceremony transitively | Install only `@mino/agent` + `@mino/view` |
| **Create a new store per tool call** | Data isolation, no cross-tool visibility | Single store instance per session via bridge |
| **Register mino tools without prefix** | Name collisions with pi built-in tools (e.g., `read`, `write`) | Always prefix with `mino_` |
| **Eager-load all 44 tools** | Context window bloat, agent confusion | Register tools by mode (PLAN mode → inquiry tools, etc.) |
| **Bypass Pi's security-guard for mino tools** | Security holes; mino tools write to disk | All mino tools go through Pi's existing `tool_call` gate |

---

## 8. Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | `npm install` adds exactly 2 direct deps, resolves full @mino stack | `npm ls @mino/types @mino/store @mino/inquiry @mino/ceremony @mino/agent @mino/view` shows all 6 |
| 2 | Pi loads all mino extensions without errors | `session_start` event completes, no stack traces in stderr |
| 3 | Agent can call `mino_pde_decompose` on first user message | Tool returns DecompositionResult JSON with primary intent |
| 4 | Agent can call `mino_create_chart` and `mino_advance_action` | Chart persisted to `.coaia/`, retrievable via `mino_get_chart` |
| 5 | TUI widgets render STC and direction compass | Visual inspection: compass shows current direction, chart shows completion % |
| 6 | No tool name collisions between mino and Pi built-in tools | `tool_search` returns unique names for all registered tools |
| 7 | Security guard passes all mino tools through its gate | `mino_*` tools appear in security-guard's tool_call hook scope |
| 8 | Single KnowledgeStore instance shared across all mino components | `getSessionStore()` returns same reference on repeated calls |
