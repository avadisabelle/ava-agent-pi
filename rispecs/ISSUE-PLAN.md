# Issue Plan: agent-pi-jgwill wisdom-keeper

**Repo**: jgwill/agent-pi (or wherever agent-pi-jgwill lives upstream)
**Related issues**:
- miadisabelle/workspace-openclaw#46 (parent — ceremony pipeline workstreams)
- miadisabelle/mia-junai-vscode#1 (sibling — same feature in junai fork)

## Issue to Create

**Title**: feat: wisdom-keeper agent — sacred closing pipeline phase
**Body**: Add wisdom-keeper agent after reviewer/tester in agent chains. Performs MMOT evaluation against original PDE, identifies unresolved structural tensions, writes reflections to `.mw/north/reflections/`, seeds next PDE cycle.

Relates to miadisabelle/workspace-openclaw#46
See: rispecs/sacred-closing.spec.md

## Cross-Repo Relationship

```
miadisabelle/workspace-openclaw#46   ← parent ceremony workstream
    ├── agent-pi-jgwill issue        ← wisdom-keeper agent + chain registration
    └── miadisabelle/mia-junai-vscode#1  ← Reflect stage + wisdom-keeper in junai fork
```
