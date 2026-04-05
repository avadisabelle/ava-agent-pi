# agent-pi Rispecs Index

> RISE Framework specifications for agent-pi — @mino integration layer.

## Existing Specs
| File | Focus |
|------|-------|
| [sacred-closing](sacred-closing.spec.md) | Wisdom Keeper pipeline phase (North → NE seed) |

## @mino Integration (00–04)
| # | File | Focus |
|---|------|-------|
| 00 | [mino-integration-overview](00-mino-integration-overview.spec.md) | Install profile, package→system mapping, dependency wiring |
| 01 | [mino-ceremony-extension](01-mino-ceremony-extension.spec.md) | Pi extension bootstrapping @mino/ceremony (33 MCP tools) |
| 02 | [mino-inquiry-skill](02-mino-inquiry-skill.spec.md) | Pi skill wrapping @mino/inquiry (11 MCP tools, PDE) |
| 03 | [mino-view-widgets](03-mino-view-widgets.spec.md) | TUI widgets from @mino/view (STC, narrative, compass) |
| 04 | [mino-agent-bridge](04-mino-agent-bridge.spec.md) | Bridge between pi agent engine and @mino/agent lifecycle |

---

**Upstream specs:** See [mino-sdk/rispecs/README.md](/a/src/mino-sdk/rispecs/README.md) for the 28 package-level specs that define the API surface consumed here.

**Lineage:** sacred-closing.spec.md → 00-mino-integration-overview → 01–04 integration specs
