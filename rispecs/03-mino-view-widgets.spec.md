# RISE Specification: @mino/view TUI Widgets

**Version**: 1.0
**Document ID**: mino-view-widgets-v1.0
**Status**: Draft
**Date**: 2026-07-27
**Medicine Wheel Position**: ❄️ NORTH (0°) — Reflection and visualization of the work
**Lineage**: mino-sdk/rispecs/24-view-overview → mino-sdk/rispecs/25-view-components → 00-mino-integration-overview → this spec
**Upstream**: mino-sdk rispecs 24–26 (view package, 33 React components, 5 hooks)

---

## 1. Desired Outcome

agent-pi's TUI displays **live structural awareness** — a direction compass showing the current ceremony phase, a chart viewer showing structural tension progress, a narrative beat timeline showing the story of the work, and a decomposition summary showing PDE results. These widgets use data models from @mino/view but render through Pi's terminal widget system, giving agents and users a visual understanding of where the session is in its ceremonial journey.

The widgets transform agent-pi's terminal from a **conversation log** into a **ceremony dashboard**.

---

## 2. Current Reality

### What agent-pi Has
- **Widget system** via `pi.registerWidget()` — extensions register named widgets that Pi renders in the TUI
- **Existing widgets**: agent-banner (ASCII art), footer (status bar), agent-nav (F1-F4), agent-team grid, subagent widget, task-list, pipeline phases
- **Rendering helpers** in `extensions/lib/`: `ui-helpers.ts` (text wrapping, padding, side-by-side), `subagent-render.ts`, `task-list-render.ts`, `pipeline-render.ts`
- **Theme system**: 11 themes with CSS-style color tokens, applied via `themeMap.ts`
- **Browser-based viewers**: plan-viewer, board-viewer, spec-viewer with full HTML rendering
- **Shortcut system**: F-keys and Ctrl/Alt combos for widget toggling (e.g., Alt+G for agent grid)

### What @mino/view Provides (from mino-sdk rispecs 24–26)

**33 React Components (not directly usable in terminal):**

| Category | Components |
|----------|-----------|
| **App Components (16)** | ChartViewer, EntityCard, ActionList, NarrativeBeatTimeline, RelationGraph, ProgressIndicator, FourDirectionsLayout, DirectionBadge, ChartList, DataStats, ChartEditor, CreateChartForm, NarrativeBeats, FileUpload, LiveIndicator, ThemeToggle |
| **UI Primitives (12)** | Button, Card, Badge, Input, Label, Dialog, Tabs, Separator, Popover, ScrollArea, Calendar, Toast |
| **Hooks (5)** | useChart, useGraph, useDecomposition, useLivePolling, useToast |

**Key Insight**: @mino/view components are **React 18** — they cannot render directly in Pi's terminal. The integration extracts **data models and display logic** from the hooks and applies them to terminal-native rendering using Pi's existing `ui-helpers.ts` patterns.

---

## 3. Structural Tension

agent-pi has rich TUI widget infrastructure (grids, status bars, navigation) and @mino/view has rich visualization components (charts, graphs, timelines). But they speak different rendering languages — Pi uses ANSI escape codes and box-drawing characters; @mino/view uses React JSX and CSS. The widgets spec bridges this by extracting @mino/view's **data layer** (hooks, types, computed values) and rendering through Pi's **terminal layer** (box characters, ANSI colors, theme tokens).

---

## 4. Components

### 4a. Widget Extension File Structure

```
extensions/
  mino-widgets.ts            # Main widget extension
  lib/
    mino-widget-render.ts    # Terminal rendering functions
    mino-widget-data.ts      # Data extraction from @mino stores
```

### 4b. Direction Compass Widget

Displays the current ceremony direction as a medicine wheel compass:

```
┌─ Ceremony Direction ──────────┐
│                                │
│           🌅 EAST              │
│          (Inquiry)             │
│                                │
│   ❄️ NORTH    ◆    🔥 SOUTH    │
│  (Reflect)       (Plan)       │
│                                │
│           🌊 WEST              │
│          (Execute)             │
│                                │
│  ► Current: 🌅 EAST           │
│    Phase: Decomposition        │
│    Session: 12m active         │
└────────────────────────────────┘
```

```typescript
// extensions/lib/mino-widget-render.ts

import type { Direction } from "@mino/types";

interface CompassState {
  currentDirection: Direction;
  phaseName: string;
  sessionDuration: string;
  transitionHistory: Direction[];
}

const DIRECTION_DISPLAY: Record<Direction, { emoji: string; label: string; position: string }> = {
  east: { emoji: "🌅", label: "Inquiry", position: "top" },
  south: { emoji: "🔥", label: "Plan", position: "right" },
  west: { emoji: "🌊", label: "Execute", position: "bottom" },
  north: { emoji: "❄️", label: "Reflect", position: "left" },
};

export function renderCompassWidget(state: CompassState, width: number): string[] {
  const lines: string[] = [];
  const active = DIRECTION_DISPLAY[state.currentDirection];

  lines.push(`┌─ Ceremony Direction ${"─".repeat(Math.max(0, width - 24))}┐`);
  lines.push(`│${centerPad(`${DIRECTION_DISPLAY.east.emoji} EAST`, width - 2)}│`);
  lines.push(`│${centerPad("(Inquiry)", width - 2)}│`);
  lines.push(`│${" ".repeat(width - 2)}│`);

  const midLine =
    `${DIRECTION_DISPLAY.north.emoji} NORTH    ◆    ${DIRECTION_DISPLAY.south.emoji} SOUTH`;
  lines.push(`│${centerPad(midLine, width - 2)}│`);

  const subMidLine = "(Reflect)       (Plan)";
  lines.push(`│${centerPad(subMidLine, width - 2)}│`);
  lines.push(`│${" ".repeat(width - 2)}│`);
  lines.push(`│${centerPad(`${DIRECTION_DISPLAY.west.emoji} WEST`, width - 2)}│`);
  lines.push(`│${centerPad("(Execute)", width - 2)}│`);
  lines.push(`│${" ".repeat(width - 2)}│`);

  // Active direction indicator — highlighted with theme accent color
  const activeStr = `► Current: ${active.emoji} ${state.currentDirection.toUpperCase()}`;
  lines.push(`│ ${activeStr}${" ".repeat(Math.max(0, width - activeStr.length - 3))}│`);

  const phaseStr = `  Phase: ${state.phaseName}`;
  lines.push(`│ ${phaseStr}${" ".repeat(Math.max(0, width - phaseStr.length - 3))}│`);

  const durationStr = `  Session: ${state.sessionDuration}`;
  lines.push(`│ ${durationStr}${" ".repeat(Math.max(0, width - durationStr.length - 3))}│`);

  lines.push(`└${"─".repeat(width - 2)}┘`);
  return lines;
}

function centerPad(text: string, width: number): string {
  const padding = Math.max(0, width - text.length);
  const left = Math.floor(padding / 2);
  const right = padding - left;
  return " ".repeat(left) + text + " ".repeat(right);
}
```

### 4c. Chart Viewer Widget

Displays structural tension chart progress as a compact TUI panel:

```
┌─ STC: Build Mino Integration ─────────────┐
│                                             │
│  Desired: agent-pi gains ceremonial aware…  │
│  Reality: 48 extensions, no ceremony        │
│                                             │
│  Progress: ████████░░░░░░░░░░░░  40%       │
│                                             │
│  Actions:                                   │
│   ✓ Install @mino/agent + @mino/view        │
│   ► Create ceremony extension               │
│   ○ Create inquiry skill                    │
│   ○ Create view widgets                     │
│   ○ Create agent bridge                     │
│                                             │
│  Tension: 60% unresolved                    │
└─────────────────────────────────────────────┘
```

```typescript
interface ChartViewState {
  chartId: string;
  title: string;
  desiredOutcome: string;
  currentReality: string;
  completionPercent: number;
  actions: Array<{
    id: string;
    text: string;
    status: "pending" | "advancing" | "complete";
  }>;
}

const STATUS_ICONS: Record<string, string> = {
  complete: "✓",
  advancing: "►",
  pending: "○",
};

export function renderChartWidget(state: ChartViewState, width: number): string[] {
  const lines: string[] = [];
  const title = `STC: ${truncate(state.title, width - 8)}`;
  lines.push(`┌─ ${title} ${"─".repeat(Math.max(0, width - title.length - 5))}┐`);
  lines.push(`│${" ".repeat(width - 2)}│`);

  // Desired outcome (truncated)
  const desired = `Desired: ${truncate(state.desiredOutcome, width - 14)}`;
  lines.push(`│  ${desired}${" ".repeat(Math.max(0, width - desired.length - 4))}│`);

  // Current reality (truncated)
  const reality = `Reality: ${truncate(state.currentReality, width - 14)}`;
  lines.push(`│  ${reality}${" ".repeat(Math.max(0, width - reality.length - 4))}│`);

  lines.push(`│${" ".repeat(width - 2)}│`);

  // Progress bar
  const barWidth = width - 22;
  const filled = Math.round((state.completionPercent / 100) * barWidth);
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);
  const progressLine = `Progress: ${bar}  ${state.completionPercent}%`;
  lines.push(`│  ${progressLine}${" ".repeat(Math.max(0, width - progressLine.length - 4))}│`);

  lines.push(`│${" ".repeat(width - 2)}│`);
  lines.push(`│  Actions:${" ".repeat(Math.max(0, width - 12))}│`);

  // Action list (max 8 visible, scrollable)
  const visibleActions = state.actions.slice(0, 8);
  for (const action of visibleActions) {
    const icon = STATUS_ICONS[action.status];
    const actionLine = ` ${icon} ${truncate(action.text, width - 10)}`;
    lines.push(`│  ${actionLine}${" ".repeat(Math.max(0, width - actionLine.length - 4))}│`);
  }
  if (state.actions.length > 8) {
    const moreStr = `  ... +${state.actions.length - 8} more`;
    lines.push(`│  ${moreStr}${" ".repeat(Math.max(0, width - moreStr.length - 4))}│`);
  }

  lines.push(`│${" ".repeat(width - 2)}│`);
  const tensionPct = 100 - state.completionPercent;
  const tensionStr = `Tension: ${tensionPct}% unresolved`;
  lines.push(`│  ${tensionStr}${" ".repeat(Math.max(0, width - tensionStr.length - 4))}│`);
  lines.push(`└${"─".repeat(width - 2)}┘`);

  return lines;
}

function truncate(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text;
}
```

### 4d. Narrative Beat Widget

Displays story beats from the narrative engine as a timeline:

```
┌─ Narrative Beats ──────────────────────────┐
│                                             │
│  Act I — Setup                              │
│   ● 14:23  Chart created with 5 actions     │
│   ● 14:25  First entity discovered          │
│                                             │
│  Act II — Confrontation                     │
│   ● 14:31  Oscillation detected in cycle    │
│   ● 14:35  Pattern resolved via observation │
│                                             │
│  Act III — Resolution                       │
│   ● 14:42  All actions complete             │
│   ● 14:44  MMOT evaluation: advancing       │
│                                             │
│  Story: 6 beats across 21 minutes           │
└─────────────────────────────────────────────┘
```

```typescript
interface NarrativeBeatState {
  acts: Array<{
    name: string;
    beats: Array<{
      time: string;
      description: string;
    }>;
  }>;
  totalBeats: number;
  duration: string;
}

export function renderNarrativeWidget(state: NarrativeBeatState, width: number): string[] {
  const lines: string[] = [];
  lines.push(`┌─ Narrative Beats ${"─".repeat(Math.max(0, width - 20))}┐`);

  for (const act of state.acts) {
    lines.push(`│${" ".repeat(width - 2)}│`);
    const actHeader = `${act.name}`;
    lines.push(`│  ${actHeader}${" ".repeat(Math.max(0, width - actHeader.length - 4))}│`);

    for (const beat of act.beats.slice(0, 4)) {
      const beatLine = `● ${beat.time}  ${truncate(beat.description, width - 16)}`;
      lines.push(`│   ${beatLine}${" ".repeat(Math.max(0, width - beatLine.length - 5))}│`);
    }
  }

  lines.push(`│${" ".repeat(width - 2)}│`);
  const summary = `Story: ${state.totalBeats} beats across ${state.duration}`;
  lines.push(`│  ${summary}${" ".repeat(Math.max(0, width - summary.length - 4))}│`);
  lines.push(`└${"─".repeat(width - 2)}┘`);

  return lines;
}
```

### 4e. Decomposition Widget

Shows PDE decomposition results in a compact panel:

```
┌─ PDE Decomposition ───────────────────────┐
│                                            │
│  Primary: Integrate @mino packages into…   │
│                                            │
│  Directions:                               │
│   🌅 East:  Explore both repo structures   │
│   🔥 South: Map package→system alignment   │
│   🌊 West:  Write 5 rispec files           │
│   ❄️ North: Verify implementation-ready     │
│                                            │
│  Secondary: 3 implicit intents found       │
│  Ambiguities: 1 flagged                    │
│  Actions: 7 in dependency order            │
│                                            │
│  ID: 2607271430 │ .pde/abc123.json         │
└────────────────────────────────────────────┘
```

```typescript
interface DecompositionViewState {
  id: string;
  primaryIntent: string;
  directions: Record<string, string>; // east/south/west/north → summary
  secondaryCount: number;
  ambiguityCount: number;
  actionCount: number;
  timestamp: string;
}

export function renderDecompositionWidget(state: DecompositionViewState, width: number): string[] {
  const lines: string[] = [];
  lines.push(`┌─ PDE Decomposition ${"─".repeat(Math.max(0, width - 22))}┐`);
  lines.push(`│${" ".repeat(width - 2)}│`);

  const primary = `Primary: ${truncate(state.primaryIntent, width - 14)}`;
  lines.push(`│  ${primary}${" ".repeat(Math.max(0, width - primary.length - 4))}│`);
  lines.push(`│${" ".repeat(width - 2)}│`);

  lines.push(`│  Directions:${" ".repeat(Math.max(0, width - 15))}│`);
  const dirEmoji: Record<string, string> = {
    east: "🌅", south: "🔥", west: "🌊", north: "❄️",
  };
  for (const [dir, summary] of Object.entries(state.directions)) {
    const emoji = dirEmoji[dir] || "?";
    const label = dir.charAt(0).toUpperCase() + dir.slice(1);
    const dirLine = `${emoji} ${label.padEnd(6)}: ${truncate(summary, width - 20)}`;
    lines.push(`│   ${dirLine}${" ".repeat(Math.max(0, width - dirLine.length - 5))}│`);
  }

  lines.push(`│${" ".repeat(width - 2)}│`);
  const secLine = `Secondary: ${state.secondaryCount} implicit intents found`;
  lines.push(`│  ${secLine}${" ".repeat(Math.max(0, width - secLine.length - 4))}│`);
  const ambLine = `Ambiguities: ${state.ambiguityCount} flagged`;
  lines.push(`│  ${ambLine}${" ".repeat(Math.max(0, width - ambLine.length - 4))}│`);
  const actLine = `Actions: ${state.actionCount} in dependency order`;
  lines.push(`│  ${actLine}${" ".repeat(Math.max(0, width - actLine.length - 4))}│`);

  lines.push(`│${" ".repeat(width - 2)}│`);
  const idLine = `ID: ${state.timestamp} │ .pde/${state.id.slice(0, 6)}.json`;
  lines.push(`│  ${idLine}${" ".repeat(Math.max(0, width - idLine.length - 4))}│`);
  lines.push(`└${"─".repeat(width - 2)}┘`);

  return lines;
}
```

### 4f. Widget Extension Registration

```typescript
// extensions/mino-widgets.ts
// ABOUTME: TUI widgets for ceremony direction, STC charts, narrative beats, PDE decomposition
// ABOUTME: Reads data from @mino stores; renders using Pi's terminal widget system

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { getSessionStore } from "./lib/mino-bridge";
import {
  renderCompassWidget,
  renderChartWidget,
  renderNarrativeWidget,
  renderDecompositionWidget,
} from "./lib/mino-widget-render";
import { getCompassState, getChartState, getNarrativeState, getDecompositionState } from "./lib/mino-widget-data";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async () => {
    // Direction Compass — always visible in footer area
    pi.registerWidget({
      name: "mino-compass",
      position: "sidebar",
      render: async (width: number) => {
        const state = await getCompassState();
        return renderCompassWidget(state, width);
      },
    });

    // Chart Viewer — toggle with Alt+C
    pi.registerWidget({
      name: "mino-chart",
      position: "panel",
      render: async (width: number) => {
        const state = await getChartState();
        if (!state) return ["No active chart. Use mino_create_chart to begin."];
        return renderChartWidget(state, width);
      },
    });

    // Narrative Beats — toggle with Alt+N
    pi.registerWidget({
      name: "mino-narrative",
      position: "panel",
      render: async (width: number) => {
        const state = await getNarrativeState();
        if (!state) return ["No narrative beats yet."];
        return renderNarrativeWidget(state, width);
      },
    });

    // Decomposition — toggle with Alt+D
    pi.registerWidget({
      name: "mino-decomposition",
      position: "panel",
      render: async (width: number) => {
        const state = await getDecompositionState();
        if (!state) return ["No PDE decomposition yet."];
        return renderDecompositionWidget(state, width);
      },
    });

    // Keyboard shortcuts
    pi.registerShortcut("alt+c", {
      description: "Toggle STC chart widget",
      action: () => pi.toggleWidget("mino-chart"),
    });

    pi.registerShortcut("alt+n", {
      description: "Toggle narrative beats widget",
      action: () => pi.toggleWidget("mino-narrative"),
    });

    pi.registerShortcut("alt+d", {
      description: "Toggle PDE decomposition widget",
      action: () => pi.toggleWidget("mino-decomposition"),
    });
  });
}
```

### 4g. Data Extraction Layer

```typescript
// extensions/lib/mino-widget-data.ts
// Reads from @mino stores and transforms into widget view states

import { PdeFileStore, type KnowledgeStore } from "@mino/store";
import type { Direction } from "@mino/types";
import { getSessionStore, getSessionDirection } from "./mino-bridge";

let currentChartId: string | null = null;
let lastPdeId: string | null = null;

export function setActiveChart(chartId: string) { currentChartId = chartId; }
export function setLastPde(pdeId: string) { lastPdeId = pdeId; }

export async function getCompassState() {
  const direction = getSessionDirection();
  const phaseNames: Record<Direction, string> = {
    east: "Decomposition",
    south: "Planning",
    west: "Execution",
    north: "Reflection",
  };
  return {
    currentDirection: direction,
    phaseName: phaseNames[direction],
    sessionDuration: formatDuration(process.uptime()),
    transitionHistory: [] as Direction[],
  };
}

export async function getChartState() {
  if (!currentChartId) return null;
  const store = getSessionStore(process.cwd());
  // Read chart data from store, transform to ChartViewState
  // Implementation delegates to CeremonyGraph.getChart()
  return null; // Implementor fills in
}

export async function getNarrativeState() {
  if (!currentChartId) return null;
  // Read narrative beats from NarrativeEngine
  return null; // Implementor fills in
}

export async function getDecompositionState() {
  if (!lastPdeId) return null;
  const pdeStore = new PdeFileStore(process.cwd());
  const decomp = await pdeStore.get(lastPdeId);
  if (!decomp) return null;

  return {
    id: lastPdeId,
    primaryIntent: decomp.primary?.description ?? "Unknown",
    directions: {
      east: decomp.directions?.east ?? "",
      south: decomp.directions?.south ?? "",
      west: decomp.directions?.west ?? "",
      north: decomp.directions?.north ?? "",
    },
    secondaryCount: decomp.secondary?.length ?? 0,
    ambiguityCount: decomp.ambiguities?.length ?? 0,
    actionCount: decomp.actionStack?.length ?? 0,
    timestamp: new Date().toISOString().slice(2, 12).replace(/-/g, ""),
  };
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m}m active`;
}
```

### 4h. Browser-Based Viewers (Future Enhancement)

For richer visualization, the existing browser-viewer pattern (plan-viewer, board-viewer) can host @mino/view React components directly:

```typescript
// Future: extensions/mino-browser-viewer.ts
// Renders @mino/view's React components in a browser tab
// Uses the same HTML-generation pattern as plan-viewer.ts

pi.registerCommand("/mino-dashboard", {
  description: "Open Mino ceremony dashboard in browser",
  execute: async () => {
    // Generate HTML that imports @mino/view components
    // Serve via Pi's local HTTP server
    // Open in default browser
  },
});
```

This is noted as future work — the TUI widgets are the primary integration target.

---

## 5. Anti-Patterns

| Anti-Pattern | Why It Fails | What To Do Instead |
|---|---|---|
| **Import React components for terminal rendering** | React/JSX cannot render in ANSI terminals | Extract data models; render with box-drawing + ANSI codes |
| **Poll store on every render frame** | Performance: JSONL reads on 60fps render loop | Cache state; invalidate on tool_call events |
| **Hardcode colors in widget renderers** | Breaks with theme cycling (Ctrl+X) | Use Pi's theme tokens from themeMap.ts |
| **Render all 4 widgets simultaneously** | Terminal space is limited (~80 cols) | Default: compass only; toggle others with shortcuts |
| **Widget renders block the event loop** | Freezes TUI on large charts with 100+ actions | Async render with truncation (max 8 visible actions) |
| **Duplicate data reading logic** | Drift between widget and tool output | Data layer reads once; widgets and tools share the same getSessionStore() |

---

## 6. Success Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | Direction compass renders with correct current direction | Visual: compass shows 🌅 EAST after PDE, 🌊 WEST during coding |
| 2 | Chart viewer shows progress bar + action list | After creating chart with 5 actions and completing 2: bar shows 40% |
| 3 | Narrative beats display acts and beat timestamps | After mino_find_narrative_beats: widget shows Act I/II/III |
| 4 | Decomposition widget shows PDE results | After mino_pde_parse_response: widget shows primary intent + 4 directions |
| 5 | Alt+C/Alt+N/Alt+D toggle widgets without conflict | Shortcuts don't collide with existing Pi shortcuts |
| 6 | Widgets respect active theme colors | After Ctrl+X theme cycle: widgets re-render with new palette |
| 7 | Widget renders complete in <50ms | No visible lag when toggling widgets |
| 8 | Widgets degrade gracefully when no data exists | "No active chart" message instead of crash when no ceremony state |
