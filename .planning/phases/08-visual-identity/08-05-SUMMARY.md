---
phase: 08-visual-identity
plan: 05
subsystem: game-engine
tags: [bug-fix, animation, escape-tween, gap-closure]
gap_closure: true
dependency_graph:
  requires: []
  provides: [visible-escape-animation]
  affects: [playing-state, bottom-detection]
tech_stack:
  added: []
  patterns: [earlier-detection-threshold]
key_files:
  created: []
  modified:
    - src/game/states.ts
decisions:
  - "BASE_HEIGHT - 60 triggers escape tween at y=660, giving 60px visible space for 600ms animation"
metrics:
  duration: 1min
  completed: "2026-04-12T08:04:04Z"
  tasks_completed: 1
  tasks_total: 1
  files_modified: 1
---

# Phase 08 Plan 05: Fix Escape Tween Visibility Summary

Bottom detection threshold lowered from BASE_HEIGHT + 40 to BASE_HEIGHT - 60 so escape tweens trigger while entities are still 60px above the viewport floor, making the 600ms fade+shrink+drift animation visible to players.

## What Was Done

### Task 1: Lower bottom detection threshold so escape tweens trigger on-screen

**Commit:** `22b805a`

Two changes applied at four locations in `src/game/states.ts`:

1. **Bottom detection threshold** (lines 566, 578): Changed `entity.container.y > BASE_HEIGHT + 40` to `entity.container.y > BASE_HEIGHT - 60` in both the letter entity loop and word entity loop. This means escape tweens now trigger at y > 660 (60px from the bottom of the 720px viewport) instead of y > 760 (40px below the viewport edge, completely off-screen).

2. **Tween completion handler** (lines 855, 871): Added `|| entity.tween.type === 'escape'` to the type check in both `_updateTweens` and `_updateWordTweens`. This ensures the entity's x position resets to `baseX` after the escape tween completes (since the escape animation includes lateral drift via `sin(t * PI * 2) * 15`), keeping cleanup consistent with miss and dodge tweens.

**Verification:**
- `BASE_HEIGHT - 60` appears exactly twice in states.ts (letter and word loops)
- `type === 'escape'` appears in both `_updateTweens` and `_updateWordTweens`
- All 237 tests pass

## Deviations from Plan

None - plan executed exactly as written.

## UAT Gap Closed

**Gap #10:** "Dodge/escape animations must play visibly when letters reach the bottom."

- Root cause: bottom detection at y > 760 meant entities were already off-screen when escape tween started
- Fix: detection at y > 660 gives 60px of visible space for the 600ms animation to play on-screen
- The escape tween animates alpha (fade), scale (shrink), and x (lateral drift) but NOT y, confirming the entity must already be visible when the tween begins

## Self-Check: PASSED
