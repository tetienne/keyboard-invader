---
phase: 02-game-engine-foundation
plan: 01
subsystem: game-engine
tags: [pixi.js, typescript, object-pool, input-buffer, canvas-scaling, letterbox]

# Dependency graph
requires:
  - phase: 01-project-scaffolding-dev-tooling
    provides: TypeScript + Vite + PixiJS project with strict config
provides:
  - GameState interface and StateName type for state machine
  - TRANSITIONS record for allowed state transitions
  - ScaleResult and computeScale for letterbox canvas rendering
  - ObjectPool<T> generic class for entity pooling
  - InputManager class for AZERTY-safe keyboard input
  - GameContext interface contract for Game class
affects: [02-02-PLAN, phase-03, phase-04]

# Tech tracking
tech-stack:
  added: []
  patterns: [pure-logic-modules, tdd-red-green, generic-pool, input-buffer-drain-pattern]

key-files:
  created:
    - src/game/types.ts
    - src/game/canvas.ts
    - src/game/pool.ts
    - src/game/input.ts
    - tests/game/canvas.test.ts
    - tests/game/pool.test.ts
    - tests/game/input.test.ts
  modified:
    - eslint.config.mjs

key-decisions:
  - "UPPER_CASE variable naming allowed in ESLint for constants (BASE_WIDTH, TRANSITIONS)"
  - "GameContext uses unknown for pool items to avoid coupling to Graphics type at interface level"
  - "InputManager.handleKeyDown public for direct unit testing without DOM"
  - "KeyboardEvent mocks as plain objects instead of jsdom dependency for test speed"

patterns-established:
  - "Pure logic modules: game engine logic separated from PixiJS rendering for testability"
  - "Object pool pattern: pre-allocate, acquire/release, grow-on-demand, never shrink"
  - "Input buffer drain: capture keys per frame, drain once per tick, clear after read"
  - "Type-driven design: interfaces defined first, implementations follow contract"

requirements-completed: [GAME-01, AV-04]

# Metrics
duration: 10min
completed: 2026-03-30
---

# Phase 2 Plan 1: Game Engine Pure Logic Modules Summary

**Pure TypeScript game engine foundation with letterbox scaling, generic object pool, and AZERTY-safe input buffer -- 20 tests green**

## Performance

- **Duration:** 10 min
- **Started:** 2026-03-30T19:02:57Z
- **Completed:** 2026-03-30T19:13:18Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- All game engine type contracts defined (GameState, StateName, ScaleResult, GameContext, TRANSITIONS)
- Letterbox canvas scaling with pure computeScale function handles pillarbox, letterbox, and exact-fit
- Generic ObjectPool with acquire/release/grow/reset and zero per-frame allocations
- InputManager with repeat filtering, modifier filtering, lowercase normalization, and drain-per-tick pattern
- 20 unit tests across 3 test files, all passing green

## Task Commits

Each task was committed atomically:

1. **Task 1: Create game type definitions** - `b7a8c7b` (feat)
2. **Task 2 RED: Failing tests** - `0a88f3e` (test)
3. **Task 2 GREEN: Implementation** - `e40238b` (feat)

## Files Created/Modified
- `src/game/types.ts` - GameState, StateName, ScaleResult, GameContext interfaces and TRANSITIONS constant
- `src/game/canvas.ts` - computeScale pure function, applyScale, setupCanvas for PixiJS integration
- `src/game/pool.ts` - ObjectPool<T> generic class with acquire/release/grow/reset
- `src/game/input.ts` - InputManager with keydown capture, repeat/modifier filtering, drain
- `tests/game/canvas.test.ts` - 5 tests for letterbox scaling math
- `tests/game/pool.test.ts` - 7 tests for object pool lifecycle
- `tests/game/input.test.ts` - 8 tests for input buffer behavior
- `eslint.config.mjs` - Added UPPER_CASE format for variable naming convention

## Decisions Made
- Added UPPER_CASE to ESLint variable naming convention to support conventional constant names (BASE_WIDTH, TRANSITIONS)
- Used `as T` instead of non-null assertion to satisfy strict ESLint rules in pool.ts
- Used plain object mocks for KeyboardEvent in tests to avoid jsdom dependency overhead
- Made handleKeyDown public on InputManager for direct testability without DOM

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed pillarbox test expectation**
- **Found during:** Task 2 (canvas test GREEN phase)
- **Issue:** Test expected 1920x1080 to produce pillarbox (offsetX=320), but 1920x1080 is 16:9 same as base -- no pillarboxing occurs
- **Fix:** Changed test to use 2560x1080 ultrawide which genuinely produces pillarbox bars
- **Files modified:** tests/game/canvas.test.ts
- **Verification:** Test passes with correct math
- **Committed in:** e40238b

**2. [Rule 3 - Blocking] Added UPPER_CASE to ESLint naming convention**
- **Found during:** Task 2 (lint verification)
- **Issue:** ESLint naming-convention only allowed camelCase for variables, blocking BASE_WIDTH/BASE_HEIGHT/TRANSITIONS constants
- **Fix:** Added variable selector with ['camelCase', 'UPPER_CASE'] format
- **Files modified:** eslint.config.mjs
- **Verification:** pnpm lint passes clean
- **Committed in:** e40238b

**3. [Rule 3 - Blocking] Fixed void expression and non-null assertion lint errors**
- **Found during:** Task 2 (lint verification)
- **Issue:** Arrow function shorthands returning void expressions and non-null assertions forbidden by strict ESLint
- **Fix:** Added braces to arrow functions, replaced `!` with `as T` type assertion
- **Files modified:** src/game/canvas.ts, src/game/pool.ts, src/game/input.ts
- **Verification:** pnpm lint passes clean
- **Committed in:** e40238b

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes necessary for correctness and lint compliance. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all modules fully implemented with complete logic.

## Next Phase Readiness
- All type contracts ready for Plan 02 (state machine, game loop, Game class)
- computeScale ready for Game class to use in setupCanvas
- ObjectPool ready for entity management in gameplay
- InputManager ready for keyboard handling in game loop

---
*Phase: 02-game-engine-foundation*
*Completed: 2026-03-30*
