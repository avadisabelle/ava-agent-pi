# RISE Specification: @mino/agent Bridge

**Version**: 1.0
**Document ID**: mino-agent-bridge-v1.0
**Status**: Draft
**Date**: 2026-07-27
**Medicine Wheel Position**: 🔥 SOUTH (180°) — The bridge between two systems, the protocol of alignment
**Lineage**: mino-sdk/rispecs/20-agent-overview → mino-sdk/rispecs/21-agent-engine → mino-sdk/rispecs/22-agent-session → mino-sdk/rispecs/23-agent-mcp-factory → 00-mino-integration-overview → this spec
**Upstream**: mino-sdk rispecs 20–23 (agent package: engine, session, MCP factory, SkillRegistry)

---

## 1. Desired Outcome

agent-pi's native agent system (AgentDef markdown files, teams, chains, pipelines) and @mino/agent's ceremonial system (AgentEngine, AgentSession, SkillRegistry) **coexist as peers** — each system's strengths serve the other. Pi's orchestration dispatches agents; mino's session lifecycle ensures each dispatch moves through Four Directions. Pi's skills provide domain expertise; mino's SkillRegistry provides structural/ceremonial tools. The bridge is a shared library that makes both systems legible to each other without either absorbing the other.

The bridge enables a **ceremony-aware pipeline** where:
- East (PLAN mode) → agent decomposes the prompt via @mino/inquiry
- South (SPEC mode) → agent plans via structural tension charts
- West (TEAM/CHAIN mode) → agents execute via Pi's dispatch
- North (PIPELINE REVIEW phase) → agent reflects via MMOT evaluation

---

## 2. Current Reality

### agent-pi's Agent System

**Engine Model**: Pi uses external CLI/API providers as execution engines. Each agent definition (`.md` file) specifies a `provider/model` pair (e.g., `anthropic/claude-opus-4-6`). The `ExtensionAPI` manages sessions — agents don't own their sessions, Pi does.

```typescript
// From agents/models.json — Pi's engine model
interface AgentModelEntry {
  provider: string;  // "anthropic", "openai-codex", "x-ai"
  model: string;     // "claude-haiku-4-5", "gpt-5.4", "grok-4.1-fast"
}

// From agent-defs.ts — Pi's agent definition
interface AgentDef {
  name: string;          // "planner", "builder", "reviewer"
  description: string;
  tools: string;         // Comma-separated tool names
  model: string;         // Resolved "provider/model"
  systemPrompt: string;  // Markdown content
  file: string;          // Source .md file path
}
```

**Session Model**: Pi manages sessions at the platform level. Extensions hook into session events but don't own session state. There is no concept of "session direction" or "session phase" — all turns are equivalent.

**Orchestration**: Teams dispatch to agents in parallel; chains pipe output sequentially; pipelines run 5 phases (UNDERSTAND → GATHER → PLAN → EXECUTE → REVIEW). These are coordination patterns, not lifecycle phases.

### @mino/agent's Agent System (from mino-sdk rispecs 20–23)

**Engine Abstraction**:
```typescript
interface AgentEngine {
  readonly provider: string;   // "gemini", "claude", "copilot"
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  generateStream(prompt: string, options?: GenerateOptions): AsyncIterable<StreamChunk>;
  listModels(): Promise<ModelInfo[]>;
}

// 3 implementations: GeminiEngine, ClaudeEngine, CopilotEngine
```

**Session Lifecycle** (Four Directions state machine):
```typescript
interface AgentSession {
  readonly id: string;
  readonly direction: Direction;  // "east" | "south" | "west" | "north"
  readonly store: KnowledgeStore;

  decompose(): Promise<DecompositionResult>;  // East
  plan(): Promise<StructuralTensionPlan>;     // South
  execute(): Promise<ExecutionResult>;         // West
  reflect(): Promise<ReflectionResult>;        // North

  transition(to: Direction): void;  // Must follow east→south→west→north order
}
```

**SkillRegistry**:
```typescript
interface MinoSkill {
  name: string;              // Namespace prefix (e.g., "viz")
  description: string;
  tools: MinoTool[];
  handlers: Record<string, (args: any) => Promise<MinoToolResult>>;
  init?(context: SkillContext): Promise<void>;
  dispose?(): Promise<void>;
}

class SkillRegistry {
  register(skill: MinoSkill): void;
  unregister(name: string): void;
  getTools(): MinoTool[];               // All tools across all skills
  handleToolCall(qualifiedName: string, args: any): Promise<MinoToolResult>;
  listSkills(): MinoSkill[];
}
```

**MCP Factory**:
```typescript
function createMinoMcpServer(options: {
  store: KnowledgeStore;
  skills?: MinoSkill[];
  enableInquiry?: boolean;
  enableCeremony?: boolean;
}): McpServer;
```

---

## 3. Structural Tension

Two agent systems exist that are complementary but speak different protocols:

| Dimension | Pi's System | Mino's System |
|-----------|------------|---------------|
| **Engine** | Provider/model string in JSON config | AgentEngine interface with generate/stream |
| **Session** | Platform-managed, stateless turns | Four Directions state machine |
| **Tools** | `pi.registerTool()` flat namespace | `SkillRegistry` with namespaced skills |
| **Orchestration** | Teams/chains/pipelines (coordination) | Four Directions lifecycle (ceremony) |
| **Agent Def** | Markdown + YAML frontmatter | Programmatic `createAgent()` |

The bridge doesn't merge them — it creates **bidirectional legibility** so each system can invoke the other's strengths.

---

## 4. Components

### 4a. Bridge File Structure

```
extensions/
  lib/
    mino-bridge.ts          # Core bridge: store, session, direction state
    mino-engine-adapter.ts  # Pi engine → AgentEngine adapter
    mino-skill-federation.ts # Pi tools ↔ mino skills coexistence
```

### 4b. Core Bridge — Store & Session Singleton

```typescript
// extensions/lib/mino-bridge.ts
// ABOUTME: Central bridge between agent-pi and @mino/agent
// ABOUTME: Manages shared KnowledgeStore, session direction, and lifecycle

import { JsonlFileStore, PdeFileStore } from "@mino/store";
import type { KnowledgeStore } from "@mino/store";
import type { Direction } from "@mino/types";

// --- Singleton Store ---
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

// --- Direction State Machine ---
const DIRECTION_ORDER: Direction[] = ["east", "south", "west", "north"];
let currentDirection: Direction = "east";
let directionHistory: Array<{ direction: Direction; timestamp: number }> = [];
let sessionStartTime: number = Date.now();

export function getSessionDirection(): Direction {
  return currentDirection;
}

export function transitionDirection(to: Direction): boolean {
  const currentIdx = DIRECTION_ORDER.indexOf(currentDirection);
  const targetIdx = DIRECTION_ORDER.indexOf(to);

  // Allow forward transitions and full-circle (north → east)
  const isForward = targetIdx > currentIdx;
  const isFullCircle = currentDirection === "north" && to === "east";

  if (!isForward && !isFullCircle) {
    return false; // Reject backward transitions
  }

  directionHistory.push({ direction: currentDirection, timestamp: Date.now() });
  currentDirection = to;
  return true;
}

export function getDirectionHistory() {
  return [...directionHistory];
}

export function resetSession(): void {
  currentDirection = "east";
  directionHistory = [];
  sessionStartTime = Date.now();
}

export function getSessionDuration(): number {
  return Math.floor((Date.now() - sessionStartTime) / 1000);
}

// --- Mode → Direction Mapping ---
const MODE_DIRECTION_MAP: Record<string, Direction> = {
  PLAN: "east",
  SPEC: "south",
  NORMAL: "west",
  TEAM: "west",
  CHAIN: "west",
  PIPELINE: "west",
};

export function directionForMode(mode: string): Direction {
  return MODE_DIRECTION_MAP[mode] ?? "west";
}
```

### 4c. Engine Adapter — Pi Engine → AgentEngine

This adapter wraps Pi's provider/model dispatch as an @mino/agent `AgentEngine`, enabling mino's session lifecycle to invoke Pi's models:

```typescript
// extensions/lib/mino-engine-adapter.ts
// ABOUTME: Adapts Pi's provider/model execution to @mino/agent's AgentEngine interface
// ABOUTME: Enables mino's AgentSession to use Pi's configured models

import type { AgentEngine, GenerateOptions, GenerateResult, StreamChunk, ModelInfo } from "@mino/agent";
import type { AgentModelEntry } from "./agent-defs";

export class PiEngineAdapter implements AgentEngine {
  readonly provider: string;
  private modelEntry: AgentModelEntry;
  private piContext: any; // Pi's internal execution context

  constructor(modelEntry: AgentModelEntry, piContext: any) {
    this.provider = modelEntry.provider;
    this.modelEntry = modelEntry;
    this.piContext = piContext;
  }

  async generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult> {
    // Delegate to Pi's model execution pipeline
    // Pi handles provider routing (anthropic, openai-codex, x-ai, etc.)
    const response = await this.piContext.runModel({
      provider: this.modelEntry.provider,
      model: this.modelEntry.model,
      prompt,
      ...options,
    });

    return {
      content: response.text,
      usage: {
        inputTokens: response.inputTokens ?? 0,
        outputTokens: response.outputTokens ?? 0,
      },
      model: `${this.modelEntry.provider}/${this.modelEntry.model}`,
    };
  }

  async *generateStream(prompt: string, options?: GenerateOptions): AsyncIterable<StreamChunk> {
    const stream = this.piContext.runModelStream({
      provider: this.modelEntry.provider,
      model: this.modelEntry.model,
      prompt,
      ...options,
    });

    for await (const chunk of stream) {
      yield { type: "text", content: chunk.text };
    }
  }

  async listModels(): Promise<ModelInfo[]> {
    // Return models from Pi's models.json config
    return [{
      id: `${this.modelEntry.provider}/${this.modelEntry.model}`,
      provider: this.modelEntry.provider,
      name: this.modelEntry.model,
    }];
  }
}

// Factory: create adapter from Pi's agent definition
export function createPiEngine(agentDef: { model: string }, piContext: any): PiEngineAdapter {
  const [provider, ...modelParts] = agentDef.model.split("/");
  const model = modelParts.join("/");
  return new PiEngineAdapter({ provider, model }, piContext);
}
```

### 4d. Skill Federation — Pi Tools ↔ Mino Skills

Both systems register tools that agents can call. Federation ensures they coexist without collision:

```typescript
// extensions/lib/mino-skill-federation.ts
// ABOUTME: Bridges Pi's flat tool namespace with @mino/agent's SkillRegistry
// ABOUTME: Enables agents to use tools from both systems seamlessly

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { SkillRegistry, createInquirySkill, createCeremonySkill } from "@mino/agent";
import type { MinoSkill, MinoTool, MinoToolResult } from "@mino/agent";
import type { KnowledgeStore } from "@mino/store";

export class SkillFederator {
  private registry: SkillRegistry;
  private pi: ExtensionAPI;

  constructor(pi: ExtensionAPI, store: KnowledgeStore) {
    this.pi = pi;
    this.registry = new SkillRegistry();

    // Register mino's built-in skills
    this.registry.register(createInquirySkill(store));
    this.registry.register(createCeremonySkill(store));
  }

  /**
   * Register a custom mino skill and expose its tools in Pi
   */
  registerSkill(skill: MinoSkill): void {
    this.registry.register(skill);

    // Mirror each mino skill tool into Pi's tool system
    for (const tool of skill.tools) {
      const qualifiedName = `${skill.name}_${tool.name}`;
      this.pi.registerTool({
        name: `mino_${qualifiedName}`,
        description: tool.description,
        parameters: tool.inputSchema,
        execute: async (args: Record<string, unknown>) => {
          const result = await this.registry.handleToolCall(qualifiedName, args);
          return { output: JSON.stringify(result) };
        },
      });
    }
  }

  /**
   * Create a mino skill from an existing set of Pi tools.
   * This lets mino's session lifecycle access Pi's native tools.
   */
  wrapPiToolsAsSkill(
    name: string,
    description: string,
    piToolNames: string[]
  ): MinoSkill {
    const tools: MinoTool[] = piToolNames.map((tn) => ({
      name: tn,
      description: `Pi tool: ${tn}`,
      inputSchema: { type: "object" as const, properties: {} },
    }));

    const handlers: Record<string, (args: any) => Promise<MinoToolResult>> = {};
    for (const tn of piToolNames) {
      handlers[tn] = async (args) => {
        // Invoke Pi tool through the registered tool system
        // This is a bridge call — Pi tools are not directly callable,
        // so this uses the tool_caller meta-tool pattern
        return { content: [{ type: "text", text: `Pi tool ${tn} invoked` }] };
      };
    }

    return { name, description, tools, handlers };
  }

  getRegistry(): SkillRegistry {
    return this.registry;
  }

  async dispose(): Promise<void> {
    for (const skill of this.registry.listSkills()) {
      if (skill.dispose) await skill.dispose();
    }
  }
}
```

### 4e. Session Lifecycle Bridge

Maps Pi session events to @mino's Four Directions lifecycle:

```typescript
// In extensions/mino-bridge-extension.ts (uses lib/mino-bridge.ts)
// ABOUTME: Bridges Pi session events to @mino Four Directions lifecycle
// ABOUTME: Transitions directions based on mode changes and pipeline phases

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import {
  getSessionStore,
  disposeSessionStore,
  resetSession,
  transitionDirection,
  directionForMode,
  getSessionDirection,
} from "./lib/mino-bridge";
import { SkillFederator } from "./lib/mino-skill-federation";

export default function (pi: ExtensionAPI) {
  let federator: SkillFederator | null = null;

  pi.on("session_start", async (event, ctx) => {
    resetSession();
    const store = getSessionStore(process.cwd());
    federator = new SkillFederator(pi, store);

    // Register direction management tools
    pi.registerTool({
      name: "mino_get_direction",
      description: "Get the current ceremony direction (east/south/west/north)",
      parameters: { type: "object", properties: {} },
      execute: async () => ({
        output: JSON.stringify({ direction: getSessionDirection() }),
      }),
    });

    pi.registerTool({
      name: "mino_transition_direction",
      description:
        "Advance the ceremony to the next direction. Must follow order: east → south → west → north → east.",
      parameters: {
        type: "object",
        properties: {
          to: {
            type: "string",
            enum: ["east", "south", "west", "north"],
            description: "Target direction",
          },
        },
        required: ["to"],
      },
      execute: async (args) => {
        const success = transitionDirection(args.to as any);
        return {
          output: JSON.stringify({
            success,
            direction: getSessionDirection(),
            message: success
              ? `Transitioned to ${args.to}`
              : `Cannot transition from ${getSessionDirection()} to ${args.to} (must follow east→south→west→north order)`,
          }),
        };
      },
    });

    // Register custom mino skill for Pi's dev tools
    const devSkill = federator.wrapPiToolsAsSkill(
      "pi_dev",
      "Pi development tools (read, write, grep, ls, bash)",
      ["read", "write", "grep", "find", "ls", "bash"]
    );
    federator.getRegistry().register(devSkill);
  });

  // Mode changes → direction transitions
  pi.on("before_agent_start", async (event, ctx) => {
    if (ctx.mode) {
      const targetDirection = directionForMode(ctx.mode);
      transitionDirection(targetDirection);
    }
  });

  // Pipeline phase mapping
  // UNDERSTAND/GATHER → East, PLAN → South, EXECUTE → West, REVIEW → North
  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName === "pipeline_phase_change") {
      const phaseDirectionMap: Record<string, string> = {
        UNDERSTAND: "east",
        GATHER: "east",
        PLAN: "south",
        EXECUTE: "west",
        REVIEW: "north",
      };
      const targetDir = phaseDirectionMap[event.args?.phase];
      if (targetDir) transitionDirection(targetDir as any);
    }
  });

  pi.on("session_shutdown", async () => {
    if (federator) {
      await federator.dispose();
      federator = null;
    }
    disposeSessionStore();
    resetSession();
  });
}
```

### 4f. Agent Definition Enhancement

Existing agent `.md` definitions can opt into ceremony awareness via YAML frontmatter:

```yaml
---
name: planner
description: Architecture and implementation planning
tools: read,grep,find,ls,mino_pde_decompose,mino_create_chart,mino_structural_observe
model: openai-codex/gpt-5.4
ceremony:
  direction: south           # Primary direction this agent operates in
  autoDecompose: true        # Auto-run PDE on dispatch
  reflectOnComplete: true    # Auto-run MMOT on completion
---
```

The bridge extension reads this `ceremony` frontmatter and applies it:

```typescript
// Read ceremony config from agent definition
function getCeremonyConfig(agentDef: AgentDef): CeremonyConfig | null {
  // Parse YAML frontmatter for ceremony key
  const match = agentDef.systemPrompt.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const frontmatter = yaml.parse(match[1]);
  return frontmatter.ceremony ?? null;
}

interface CeremonyConfig {
  direction?: Direction;
  autoDecompose?: boolean;
  reflectOnComplete?: boolean;
}
```

---

## 5. Anti-Patterns

| Anti-Pattern | Why It Fails | What To Do Instead |
|---|---|---|
| **Replace Pi's agent system with @mino/agent** | Breaks existing teams/chains/pipelines, enormous migration | Bridge them; both systems coexist |
| **Create an AgentSession per Pi agent** | Each agent in a team dispatch gets its own session — state fragments | One AgentSession per Pi session; agents share ceremony state |
| **Force strict direction ordering on all modes** | NORMAL mode users don't want ceremony constraints | Direction transitions are advisory in NORMAL, enforced only in PIPELINE |
| **Mirror all Pi tools into mino SkillRegistry** | Pi has 100+ tools; registry bloat, naming conflicts | Only wrap dev tools that mino's session lifecycle actually needs |
| **Backward direction transitions** | Violates medicine wheel protocol; creates ceremony confusion | Always advance forward; north → east starts a new cycle |
| **Dual registration (Pi + mino both register same tool)** | Agents see duplicates, tool dispatch ambiguity | Ceremony/inquiry tools register in Pi only; federation handles routing |
| **Tight coupling to specific Pi version** | Pi evolves independently; breaking changes on upgrade | Use only documented ExtensionAPI; avoid internal Pi APIs |

---

## 6. Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | `getSessionStore()` returns same instance across ceremony extension, inquiry skill, and bridge | Object identity check: `getSessionStore(cwd) === getSessionStore(cwd)` |
| 2 | Direction transitions follow east→south→west→north order | `transitionDirection("west")` from "east" returns false; from "south" returns true |
| 3 | Mode change to PLAN auto-transitions to East direction | After Shift+Tab to PLAN: `getSessionDirection()` returns "east" |
| 4 | Pipeline phases map to Four Directions | UNDERSTAND→east, PLAN→south, EXECUTE→west, REVIEW→north |
| 5 | `PiEngineAdapter` implements full AgentEngine interface | TypeScript compilation succeeds with no type errors |
| 6 | `SkillFederator` exposes mino skills as Pi tools | `tool_search("mino_inquiry")` returns inquiry skill tools |
| 7 | Agent definitions with `ceremony` frontmatter are parsed correctly | `getCeremonyConfig(planner)` returns `{ direction: "south", autoDecompose: true }` |
| 8 | Full circle possible: east → south → west → north → east (new cycle) | After north → east transition: session enters new cycle, compass resets |
| 9 | Existing Pi functionality unaffected | All 48 original extensions load; teams/chains/pipelines work without mino |
| 10 | Clean shutdown releases all mino resources | After session_shutdown: store disposed, federator disposed, direction reset |
