---
phase: quick-260426-pph
plan: 01
subsystem: game-states
tags: [bugfix, regression-net, tdd, animation]
requires: []
provides:
  - "PlayingState.update calls AlienContainer.updateIdle(dt) every frame for both letter and word entities"
  - "Vitest regression coverage that catches removal of either updateIdle call site"
affects:
  - src/game/states.ts
  - tests/game/states.test.ts
tech_stack_added: []
patterns: [tdd, regression-net]
key_files_created: []
key_files_modified:
  - src/game/states.ts
  - tests/game/states.test.ts
decisions:
  - "Replace forbidden non-null assertions with explicit null guards in pre-existing states.ts code (fold-in cleanup)"
  - "Use eslint-disable-next-line for third-party PascalCase imports (Assets) destructured into local scope in tests"
metrics:
  duration_min: 7
  completed_date: 2026-04-26
  tasks: 2
  commits: 2
---

# Quick Task quick-260426-pph: Re-wire AlienContainer.updateIdle Summary

Restore the regressed `entity.container.updateIdle(dt)` wiring in `PlayingState.update()` for both letter and word fall loops, and lock it down with two new vitest regression tests so the call sites can never silently disappear again.

## What Changed (the 2 lines restored)

In `src/game/states.ts`, inside `PlayingState.update()` immediately after `const dtSec = dt / 1000` (now lines 542 and 548):

```typescript
const dtSec = dt / 1000
for (const entity of this.activeEntities) {
  entity.container.updateIdle(dt)              // <-- restored (line 542)
  if (entity.tween === null && !entity.markedForRemoval) {
    entity.container.y += fallSpeed * dtSec
  }
}
for (const entity of this.activeWordEntities) {
  entity.container.updateIdle(dt)              // <-- restored (line 548)
  if (entity.tween === null && !entity.markedForRemoval) {
    entity.container.y += fallSpeed * dtSec
  }
}
```

Both calls run BEFORE the tween-guard so bobbing/blinking continues during tweens — `updateIdle` only mutates `sprite.y` (a child), not `container.x/y/scale` which the tween system owns.

## Test Additions

Two focused regression tests added to `tests/game/states.test.ts`:

| Test name | Mode | Lines | Describe block |
|-----------|------|-------|----------------|
| `calls updateIdle on letter entities each frame for bobbing/blinking` | letters | 599-632 | `describe('PlayingState')` |
| `calls updateIdle on word entities each frame for bobbing/blinking`   | words   | 1019-1030 | `describe('PlayingState word mode per-character tinting')` |

Both tests:
1. Spawn an entity via the existing pool-item mock (which already exposes `updateIdle: vi.fn()`).
2. Run an additional `state.update(ctx, 16)` so the fall-loop iterates over the spawned entity.
3. Assert `expect(item.updateIdle).toHaveBeenCalled()`.

Confirmed RED before Task 2 (both `AssertionError: expected "vi.fn()" to be called at least once`).
Confirmed GREEN after Task 2 (full suite: 248/248 pass).

## Commit Hashes

| Task | Type | Hash    | Message |
|------|------|---------|---------|
| 1    | RED  | 69753d5 | `test(quick-260426-pph): add failing regression tests for alien updateIdle wiring` |
| 2    | GREEN| 88a15d4 | `fix(quick-260426-pph): re-wire AlienContainer.updateIdle in PlayingState`         |

## Verification

- `grep -c "entity\\.container\\.updateIdle(dt)" src/game/states.ts` -> `2` (exactly the spec)
- `grep -rn "updateIdle" src/` -> 3 lines (1 definition in `alien-container.ts:32` + 2 call sites in `states.ts:542, 548`)
- `pnpm test` -> 20 files / 248 tests pass (including the 2 new regression tests)
- `pnpm exec eslint src/ tests/` -> no new errors introduced; `states.ts` and `states.test.ts` are now lint-clean (pre-existing errors in unrelated files remain — out of scope per Rule SCOPE_BOUNDARY)
- Pre-commit hooks (eslint, prettier, typecheck, commitlint) passed without `--no-verify` for both atomic commits

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Resolve pre-existing lint/prettier issues in `tests/game/states.test.ts` to unblock Task 1 commit**

- **Found during:** Task 1 (initial commit attempt)
- **Issue:** Pre-commit `eslint --max-warnings=0` and Prettier hooks failed on 10 pre-existing errors in the same file my new tests landed in. Without fixing them, the constraint "DO NOT use --no-verify; pre-commit hooks must pass" could not be honored.
- **Fix:** Limited the cleanup to the file I was already editing:
  - 2x `eslint-disable-next-line @typescript-eslint/naming-convention` for `const { Assets } = await import('pixi.js')` (third-party PascalCase class destructured into local scope — cannot be renamed without breaking the API).
  - 1x non-empty body for an empty arrow function (replaced `() => {}` with `() => { /* swallow expected error */ }`).
  - 3x `!` non-null assertions converted to safer `?.` optional chaining inside an existing word-mode test (line ~914 area).
  - Auto-fix dropped most warnings; final run also applied Prettier.
- **Files modified:** `tests/game/states.test.ts` (folded into commit `69753d5`).

**2. [Rule 3 - Blocking] Resolve pre-existing lint/prettier issues in `src/game/states.ts` to unblock Task 2 commit**

- **Found during:** Task 2 (commit attempt)
- **Issue:** Same situation — 8 pre-existing ESLint errors in `states.ts` (the file my fix touches) blocked the pre-commit hook.
- **Fix:** Behavior-preserving cleanup limited to `states.ts`:
  - 2x non-null assertions on `this.saveResult!` replaced with an explicit `else if (this.saveResult)` guard. Behavior is preserved because the original code only executed the `else` branch when `saveResult` was truthy at runtime; the `!` was only there to satisfy TS.
  - 1x indexed `for (let i ...)` replaced with `for (const ch of sbt.chars)`.
  - 1x `if (x === null) x = y` rewritten as `x ??= y`.
  - Auto-fix and Prettier handled the rest (4 `--fix`-able errors).
- **Files modified:** `src/game/states.ts` (folded into commit `88a15d4`).

**3. [Rule 3 - Blocking] Commitlint body-line-length rejection on first attempt of Task 2 commit**

- **Found during:** Task 2 (commitlint hook)
- **Issue:** First commit message body had a line longer than 100 chars; commitlint rejected; commit did NOT land.
- **Fix:** Re-wrote the body with shorter lines and re-ran the commit (no `git commit --amend`, no destructive ops). Commit landed cleanly as `88a15d4`.
- **Files modified:** None (commit-message-only change).

## ROADMAP/STATE Notes

- **No ROADMAP.md changes** were made — this is a quick-task per plan constraints.
- This SUMMARY.md is left **unstaged**; the orchestrator handles docs commits.
- STATE.md was not updated by this executor (orchestrator's responsibility for quick tasks).

## Self-Check: PASSED

- [x] `src/game/states.ts` exists and contains both `entity.container.updateIdle(dt)` call sites (verified via grep).
- [x] `tests/game/states.test.ts` exists and contains both new regression tests.
- [x] Commit `69753d5` (test/RED) exists in git log.
- [x] Commit `88a15d4` (fix/GREEN) exists in git log.
- [x] Full test suite (`pnpm test`) green: 248/248.
- [x] All success criteria from the plan satisfied.
