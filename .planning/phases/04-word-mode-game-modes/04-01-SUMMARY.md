---
phase: 04-word-mode-game-modes
plan: 01
subsystem: game
tags: [typescript, i18n, word-mode, game-types]

requires:
  - phase: 03-letter-mode-gameplay
    provides: LetterEntity pattern, tween system, letter progression logic
provides:
  - GameMode type for letters/words distinction
  - Extended SessionResult with timePlayed and mode
  - Word list JSONs for fr/en locales
  - words.ts module with word selection and matching logic
  - i18n labels for menu mode buttons and summary screen
affects: [04-02, 05-adaptive-difficulty]

tech-stack:
  added: []
  patterns: [WordEntity with cursorIndex for character-by-character typing, WordMatchResult union type for match outcomes]

key-files:
  created:
    - src/game/words.ts
    - src/shared/i18n/fr.words.json
    - src/shared/i18n/en.words.json
    - tests/game/words.test.ts
    - tests/game/types-ext.test.ts
  modified:
    - src/game/types.ts
    - src/game/game.ts
    - src/game/states.ts
    - src/game/index.ts
    - src/shared/i18n/fr.json
    - src/shared/i18n/en.json
    - tests/game/states.test.ts

key-decisions:
  - "WordEntity.text uses structural interface (not PixiJS import) to keep module pure-logic testable"
  - "matchWordKey returns union type without mutating entity, caller handles state changes"

patterns-established:
  - "WordEntity with cursorIndex: mirrors LetterEntity pattern but adds character-by-character tracking"
  - "WordMatchResult union type: correct/complete/wrong for pure-logic match checking"

requirements-completed: [GAME-03]

duration: 17min
completed: 2026-03-31
---

# Phase 04 Plan 01: Word Mode Data Layer Summary

**GameMode type, word list JSONs (fr/en), and words.ts module with selection, matching, and word entity logic**

## Performance

- **Duration:** 17 min
- **Started:** 2026-03-31T19:54:47Z
- **Completed:** 2026-03-31T20:12:03Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- GameMode type ('letters' | 'words') and extended SessionResult with timePlayed/mode fields
- Word list JSONs with 25 short + 20 medium words for both French and English
- words.ts module exporting loadWordLists, getAvailableWords, findActiveWord, matchWordKey
- 17 new unit tests covering all word module functions, plus 5 type extension tests

## Task Commits

Each task was committed atomically:

1. **Task 1: Type extensions, word list JSONs, and i18n labels** - `df3948f` (feat)
2. **Task 2: words.ts module with selection and matching logic + unit tests** - `cfe9e22` (feat)

_TDD tasks had RED commits before GREEN implementation._

## Files Created/Modified
- `src/game/types.ts` - Added GameMode type, extended SessionResult and GameContext
- `src/game/words.ts` - New module with WordEntity, WordLists, word selection and matching
- `src/game/game.ts` - Implemented setGameMode/getGameMode on Game class
- `src/game/states.ts` - Added sessionElapsed tracking, timePlayed/mode to session result
- `src/game/index.ts` - Exported GameMode type
- `src/shared/i18n/fr.words.json` - French word lists (25 short + 20 medium)
- `src/shared/i18n/en.words.json` - English word lists (25 short + 20 medium)
- `src/shared/i18n/fr.json` - Added menu mode and summary screen labels
- `src/shared/i18n/en.json` - Added menu mode and summary screen labels
- `tests/game/types-ext.test.ts` - Tests for GameMode type and word list JSON structure
- `tests/game/words.test.ts` - 17 tests for words.ts module functions
- `tests/game/states.test.ts` - Updated mock context for new GameContext methods

## Decisions Made
- WordEntity.text uses a structural interface instead of importing PixiJS types, keeping the module pure-logic and testable without DOM/canvas
- matchWordKey returns a union type ('correct' | 'complete' | 'wrong') without mutating the entity; the caller is responsible for advancing cursorIndex

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed SessionResult shape in existing code**
- **Found during:** Task 1
- **Issue:** Adding timePlayed and mode to SessionResult broke existing PlayingState and test mocks
- **Fix:** Added sessionElapsed time tracking to PlayingState, updated setSessionResult call, updated mock context in states.test.ts
- **Files modified:** src/game/states.ts, src/game/game.ts, tests/game/states.test.ts
- **Verification:** Full test suite passes (103 tests)
- **Committed in:** df3948f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Necessary to maintain type safety after SessionResult extension. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All pure-logic foundations ready for Plan 02 (PlayingState word mode integration)
- WordEntity, getAvailableWords, findActiveWord, matchWordKey all tested and exported
- GameContext has setGameMode/getGameMode for mode switching
- i18n labels ready for menu mode buttons and summary screen

---
*Phase: 04-word-mode-game-modes*
*Completed: 2026-03-31*
