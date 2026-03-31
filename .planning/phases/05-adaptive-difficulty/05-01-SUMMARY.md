---
phase: 05-adaptive-difficulty
plan: 01
subsystem: game-logic
tags: [difficulty, adaptive, rolling-window, state-machine]

requires:
  - phase: 03-letter-mode-gameplay
    provides: getAvailableLetters with HOME_ROW/TOP_ROW/BOTTOM_ROW constants
  - phase: 04-word-mode-game-modes
    provides: getAvailableWords with WordLists interface
provides:
  - DifficultyManager class with rolling window, asymmetric adjustment, dead zone, complexity state machine
  - DifficultyParams/DifficultyConfig interfaces
  - LETTER_DIFFICULTY_CONFIG and WORD_DIFFICULTY_CONFIG preset configs
  - Refactored getAvailableLetters(complexityLevel) and getAvailableWords(wordLists, complexityLevel) signatures
affects: [05-02-integration, 06-profiles]

tech-stack:
  added: []
  patterns: [pure-logic-module, rolling-window, asymmetric-controller, complexity-state-machine]

key-files:
  created:
    - src/game/difficulty.ts
    - tests/game/difficulty.test.ts
  modified:
    - src/game/letters.ts
    - src/game/words.ts
    - tests/game/letters.test.ts
    - tests/game/words.test.ts

key-decisions:
  - "Complexity level as integer (0/1/2) rather than passing accuracy directly to selection functions"
  - "Dead zone boundaries are inclusive (0.6 and 0.8 do not trigger adjustment)"
  - "updateComplexity called from adjust() on every window-full evaluation, not just ramp/ease branches"

patterns-established:
  - "Pure logic difficulty module: no PixiJS imports, fully unit-testable"
  - "Complexity level integer maps to row/word unlocks via selection functions"

requirements-completed: [DIFF-01, DIFF-02, DIFF-03, DIFF-04]

duration: 7min
completed: 2026-03-31
---

# Phase 05 Plan 01: Adaptive Difficulty Core Algorithm Summary

**DifficultyManager with rolling window, asymmetric 2x easing, dead zone 60-80%, and complexity state machine for letter/word progression**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-31T21:49:05Z
- **Completed:** 2026-03-31T21:56:30Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- DifficultyManager class with full test coverage (25 tests) covering rolling window, speed/spawn adjustment, dead zone, asymmetric easing, and complexity level promotion/demotion
- Refactored getAvailableLetters and getAvailableWords to accept complexityLevel integer instead of progress/total ratio
- Both preset configs (LETTER_DIFFICULTY_CONFIG, WORD_DIFFICULTY_CONFIG) with correct parameter ranges per decisions D-02/D-03

## Task Commits

Each task was committed atomically:

1. **Task 1: DifficultyManager TDD** - `0c92c84` (feat)
2. **Task 2: Refactor letter/word selection signatures** - `e217487` (refactor)

_TDD task 1 had an intermediate RED commit before GREEN._

## Files Created/Modified
- `src/game/difficulty.ts` - DifficultyManager class, DifficultyParams/DifficultyConfig interfaces, preset configs
- `tests/game/difficulty.test.ts` - 25 unit tests covering all difficulty behaviors
- `src/game/letters.ts` - getAvailableLetters now accepts complexityLevel
- `src/game/words.ts` - getAvailableWords now accepts (wordLists, complexityLevel)
- `tests/game/letters.test.ts` - Updated to use complexityLevel-based tests
- `tests/game/words.test.ts` - Updated to use complexityLevel-based tests

## Decisions Made
- Dead zone boundaries are inclusive: accuracy at exactly 0.6 or 0.8 does not trigger adjustment. This prevents boundary flickering.
- updateComplexity is called from adjust() regardless of whether speed/spawn were changed (dead zone items still evaluate complexity). This means complexity can promote even while speed/spawn are stable.
- Complexity level as a simple integer (0, 1, 2) rather than passing raw accuracy to selection functions. DifficultyManager owns all threshold logic.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Worktree was behind main by 22 commits (missing all Phase 4 work). Resolved by merging main HEAD into worktree branch before starting work.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None. All functionality is fully implemented and tested.

## Next Phase Readiness
- DifficultyManager is ready for integration into PlayingState (Plan 02)
- states.ts still calls getAvailableLetters(progress, total) and getAvailableWords(wordLists, progress, total) with old signatures. Plan 02 will wire DifficultyManager and fix these callers.
- TypeScript compilation of states.ts will fail until Plan 02 updates the call sites.

## Self-Check: PASSED

All 6 files verified present. Both commit hashes (0c92c84, e217487) found in git log.

---
*Phase: 05-adaptive-difficulty*
*Completed: 2026-03-31*
