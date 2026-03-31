---
phase: 04-word-mode-game-modes
plan: 02
subsystem: game
tags: [typescript, pixi, word-mode, game-states, split-bitmap-text]

requires:
  - phase: 04-word-mode-game-modes
    plan: 01
    provides: GameMode type, word lists, words.ts module, extended SessionResult
provides:
  - Mode selection menu with letter/word buttons
  - Word mode gameplay with SplitBitmapText and per-character highlighting
  - Enhanced session summary with accuracy, item count, and time played
  - SplitBitmapText object pool for word entities
affects: [05-adaptive-difficulty]

tech-stack:
  added: []
  patterns: [SplitBitmapText pool for word entities, mode-branching in PlayingState]

key-files:
  created: []
  modified:
    - src/game/game.ts
    - src/game/types.ts
    - src/game/states.ts
    - src/game/tween.ts
    - tests/game/states.test.ts

key-decisions:
  - "SplitBitmapText from PixiJS 8 used for word entities with per-character tint control via .chars array"
  - "Word mode uses slower fall speed (50 vs 80) and longer spawn interval (2500ms vs 1500ms) for readability"
  - "Miss tween on word entities restores only unmatched char tints (preserving green on already-typed chars)"

patterns-established:
  - "Mode-branching: PlayingState reads mode once in enter() and branches spawn/input/cleanup logic"
  - "Dual pool pattern: separate ObjectPool<BitmapText> and ObjectPool<SplitBitmapText> for letter/word entities"

requirements-completed: [GAME-03, GAME-06, GAME-07]

duration: 9min
completed: 2026-03-31
---

# Phase 04 Plan 02: Word Mode Game Integration Summary

**Mode selection menu, word mode PlayingState with SplitBitmapText per-character highlighting, and enhanced session summary with accuracy/items/time**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-31T21:10:51Z
- **Completed:** 2026-03-31T21:20:43Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 5

## Accomplishments
- SplitBitmapText object pool added to Game class for word mode entities
- MenuState replaced single "Jouer" button with two mode selection buttons (A B C / Lettres, MOT / Mots)
- PlayingState handles both letter and word mode with mode-specific spawning, fall speed, input processing
- Word mode: per-character green highlight on correct key, red flash + shake on wrong key (no cursor reset)
- GameOverState shows three-line summary: accuracy %, items practiced with mode label, time in mm:ss
- Replay preserves current mode; Menu returns to mode selection
- TweenTarget extended with optional chars field for word entity support

## Task Commits

1. **Task 1: Game class GameMode support and word pool** - `e610975` (feat)
2. **Task 2: MenuState, PlayingState word mode, GameOverState summary** - `0a3a5bf` (feat)
3. **Task 3: Browser verification** - auto-approved in auto mode

## Files Created/Modified
- `src/game/types.ts` - Added acquireWordPoolItem/releaseWordPoolItem to GameContext
- `src/game/game.ts` - Added SplitBitmapText pool, word pool methods
- `src/game/states.ts` - Full rewrite: MenuState mode selection, PlayingState dual-mode, GameOverState enhanced summary
- `src/game/tween.ts` - Added optional chars field to TweenTarget interface
- `tests/game/states.test.ts` - Added tests for mode selection, word spawning, session result with timePlayed/mode

## Decisions Made
- Used SplitBitmapText (PixiJS 8.11+) for word entities, giving per-character tint control via .chars array
- Word mode fall speed is 50px/s (vs 80 for letters) and spawn interval 2500ms (vs 1500ms) for readability
- Session length for words is 15 (vs 20 for letters) since words take longer to type
- Miss tween on words preserves already-typed green chars, only restores unmatched chars to original color

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SplitBitmapText uses split() not updateText()**
- **Found during:** Task 2
- **Issue:** Plan referenced `updateText()` method but actual PixiJS 8.17 API uses `split()` to populate chars
- **Fix:** Used `sbt.split()` after setting text property
- **Files modified:** src/game/states.ts

---

**Total deviations:** 1 auto-fixed (API mismatch)
**Impact on plan:** Minimal, just an API name difference.

## Known Stubs
None. All data paths are wired and functional.

## Self-Check: PASSED
