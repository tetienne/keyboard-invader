# Phase 5: Adaptive Difficulty - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 05-adaptive-difficulty
**Areas discussed:** Difficulty parameters, Adaptation algorithm, Asymmetric adjustment, Session continuity
**Mode:** --auto (all decisions auto-selected with recommended defaults)

---

## Difficulty Parameters

| Option | Description | Selected |
|--------|-------------|----------|
| Speed + spawn + complexity | All three knobs adapt: fall speed, spawn interval, item complexity | Y |
| Speed only | Only fall speed changes | |
| Speed + spawn only | Two parameters, complexity stays fixed | |

**User's choice:** [auto] Speed + spawn + complexity (recommended default)
**Notes:** Covers all four DIFF requirements. Ranges based on current fixed values as baseline.

---

## Adaptation Algorithm

| Option | Description | Selected |
|--------|-------------|----------|
| Rolling window of last 10 items | Simple, responsive, avoids early-session noise | Y |
| Exponential moving average | Smoother but harder to tune | |
| Fixed interval assessment | Check every N seconds | |

**User's choice:** [auto] Rolling window of last 10 items (recommended default)
**Notes:** Dead zone 60-80% prevents oscillation. Adjusts after each item completion.

---

## Asymmetric Adjustment

| Option | Description | Selected |
|--------|-------------|----------|
| Ease 2x faster than ramp | Ease subtracts 2x what ramp adds | Y |
| Equal ease and ramp | Symmetric adjustment | |
| Ease 3x faster | More aggressive easing | |

**User's choice:** [auto] Ease 2x faster than ramp (recommended default)
**Notes:** Matches success criteria #2 and non-frustrating core value.

---

## Session Continuity

| Option | Description | Selected |
|--------|-------------|----------|
| Reset to baseline each session | No persistence, fresh start | Y |
| Carry over within browser session | Remember until page close | |
| Persist to storage | Save difficulty level | |

**User's choice:** [auto] Reset to baseline each session (recommended default)
**Notes:** Profiles (Phase 6) will handle persistence.

---

## Claude's Discretion

- Exact step sizes for parameter adjustments
- Rolling window implementation details
- Linear vs stepped parameter changes
- Debug overlay format for difficulty
- Exact accuracy thresholds (80%/50% suggested)

## Deferred Ideas

- Persistent difficulty across sessions -- Phase 6
- Per-letter accuracy tracking -- v2 ADV-02
- Difficulty presets per age group -- future enhancement
- Visual feedback on difficulty changes -- Phase 8
