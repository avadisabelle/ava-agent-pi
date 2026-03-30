# Four Question Types Evaluation — PDE Gate Template

> Used in PLAN mode Phase 0 to evaluate whether a PDE decomposition requires interactive user review.
> Based on structural thinking methodology (Robert Fritz).

## Purpose

After decomposing a task into intents (PDE), the agent evaluates the decomposition through four question types to determine whether genuine ambiguities exist that require user input before proceeding.

## The Four Question Types

### 1. Information Questions
**What's vague or incomplete?**
- Are any intents described in general terms that could mean multiple things?
- Is the scope clear or could it be interpreted broadly/narrowly?
- Are there technical details missing that would change the approach?

*If you find vague areas → ask the user to clarify.*

### 2. Clarification Questions
**What terms need the user's specific definition?**
- Does the user use terms that have multiple meanings in this context?
- Are there domain-specific concepts that the agent might interpret differently?
- Would the user's answer NOT change the existing picture but sharpen it?

*If terms are ambiguous → ask the user what they mean specifically.*

### 3. Implication Questions
**What's implied but not stated?**
- Two-part evaluation: (a) identify what seems implied, (b) verify it's actually what the user intended
- Does the request imply a preference for certain technologies, patterns, or approaches?
- Are there unstated constraints (timeline, compatibility, scope limits)?

*If implications exist that could be wrong → surface them for verification.*

### 4. Discrepancy Questions
**Do any intents contradict each other or reality?**
- Do two decomposed intents pull in opposite directions?
- Does any intent conflict with the current codebase architecture?
- Is there a gap between what the user described and what the codebase can support?

*If contradictions exist → present them. This is often where real insight happens.*

## Evaluation Outcome

| Result | Action |
|--------|--------|
| 1+ genuine questions from any type | Present PDE interactively via `show_plan` (questions mode) |
| No genuine questions across all types | Log evaluation to `.pde/<workspace>/evaluation.md`, proceed |

## Anti-Patterns (Be Careful)

- **Don't manufacture questions** — if everything is clear, say so
- **Don't import frameworks** — observe THIS decomposition, don't pattern-match against training data
- **Don't confuse your uncertainty with genuine ambiguity** — the question is whether the USER needs to clarify, not whether you feel uncertain
- **Don't skip the evaluation** — even if it feels obvious, run through the four types. 30 seconds of evaluation prevents hours of wrong-direction work

## Template for evaluation.md (when no interactive review needed)

```markdown
# PDE Evaluation — No Interactive Review Required

**Task:** <brief summary>
**Evaluated:** <timestamp>

## Four Question Types Assessment

### Information: No vague areas identified
<brief reasoning>

### Clarification: All terms are unambiguous in context
<brief reasoning>

### Implication: Implications verified against codebase
<brief reasoning>

### Discrepancy: No contradictions found
<brief reasoning>

## Decision: Proceed to Phase 1
```
