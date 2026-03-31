---
phase: 05-adaptive-difficulty
verified: 2026-03-31T00:10:00Z
status: gaps_found
score: 17/18 must-haves verified
re_verification: false
gaps:
  - truth: "Full test suite passes (all 132 tests green)"
    status: partial
    reason: "9 tests in a stale worktree file (.claude/worktrees/agent-a65e5ac2/tests/game/states.test.ts) fail because that copy does not include the getDifficulty/setDifficulty mock methods added in Plan 02. The 132 main project tests all pass when worktrees are excluded. The worktree is a leftover agent sandbox, not a real test regression."
    artifacts:
      - path: ".claude/worktrees/agent-a65e5ac2/tests/game/states.test.ts"
        issue: "Stale copy missing getDifficulty/setDifficulty vi.fn() stubs in the mock GameContext. Running `pnpm vitest run` without an exclude picks it up and reports 9 failures."
    missing:
      - "Add `exclude: ['.claude/**']` to the `test:` block in vite.config.ts so worktree files are never picked up by the test runner"
---

# Phase 05: Adaptive Difficulty Verification Report

**Phase Goal:** The game automatically adjusts to each child's skill level, keeping them in a flow state rather than bored or frustrated
**Verified:** 2026-03-31
**Status:** gaps_found (1 gap -- stale worktree test file)
**Re-verification:** No (initial verification)

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | DifficultyManager adjusts fall speed up when accuracy > 80% and down when < 60% | VERIFIED | `difficulty.ts` lines 52-72: ramp branch adds speedStep, ease branch subtracts speedStep*2 |
| 2  | DifficultyManager adjusts spawn interval down (harder) when accuracy > 80% and up (easier) when < 60% | VERIFIED | `difficulty.ts` lines 58-71: spawnInterval decremented in ramp, incremented by spawnStep*2 in ease |
| 3  | Easing steps are 2x larger than ramping steps | VERIFIED | `difficulty.ts` line 66: `speedStep * 2`, line 70: `spawnStep * 2` -- explicit 2x multiplier |
| 4  | No adjustments occur until rolling window of 10 items is full | VERIFIED | `difficulty.ts` lines 40-44: guard `if (window.length < windowSize) return` |
| 5  | Parameters hold steady in the 60-80% dead zone | VERIFIED | `difficulty.ts` lines 62-73: no else branch for 0.6-0.8 range; updateComplexity still called |
| 6  | Complexity level increases after 5+ consecutive items at >80% accuracy | VERIFIED | `difficulty.ts` lines 79-97: consecutiveHighAccuracy counter, promotes when >= complexityUpCount (5) |
| 7  | Complexity level decreases when accuracy drops below 50% | VERIFIED | `difficulty.ts` lines 92-97: demotes when accuracy < complexityDownThreshold (0.5) |
| 8  | All parameters are clamped to configured min/max bounds | VERIFIED | `difficulty.ts`: Math.min/max around every fallSpeed and spawnInterval mutation |
| 9  | getAvailableLetters accepts complexityLevel integer instead of progress/total | VERIFIED | `letters.ts` line 25-31: `getAvailableLetters(complexityLevel: number)` -- no progress/total params |
| 10 | getAvailableWords accepts complexityLevel integer instead of progress/total | VERIFIED | `words.ts` line 19-25: `getAvailableWords(wordLists, complexityLevel: number)` |
| 11 | PlayingState creates DifficultyManager on enter and uses its params for fallSpeed and spawnInterval | VERIFIED | `states.ts` lines 259-261: `new DifficultyManager(...)` in enter(); line 282: destructures params |
| 12 | PlayingState calls recordResult(true) on letter hit and word completion | VERIFIED | `states.ts` lines 523, 555: recordResult(true) on letter match and word complete |
| 13 | PlayingState calls recordResult(false) on letter miss and items reaching bottom | VERIFIED | `states.ts` lines 338, 350, 528: letter bottom, word bottom, letter keystroke miss |
| 14 | Word mode records results per word (not per keystroke) | VERIFIED | `states.ts` lines 558-564: wrong-key branch has no recordResult call (intentional per Pitfall 6) |
| 15 | Debug overlay shows current speed, spawn interval, and complexity level when F3 is active | VERIFIED | `debug.ts` lines 45-51: Speed/Spawn/Complexity lines pushed when difficulty param is truthy |
| 16 | getAvailableLetters and getAvailableWords called with complexityLevel from DifficultyManager | VERIFIED | `states.ts` line 439: `getAvailableLetters(this.difficulty.params.complexityLevel)`, line 471-474: same for words |
| 17 | Difficulty resets to baseline each new session | VERIFIED | `states.ts` line 259: new DifficultyManager instantiated in enter() -- config baseFallSpeed/baseSpawnInterval used as constructor defaults |
| 18 | Full test suite passes | PARTIAL | 132 main tests pass. 9 failures are from stale `.claude/worktrees/agent-a65e5ac2/tests/game/states.test.ts` picked up by vitest default glob |

**Score:** 17/18 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/difficulty.ts` | DifficultyManager class, DifficultyParams/DifficultyConfig interfaces, preset configs | VERIFIED | 154 lines; exports DifficultyManager, DifficultyParams, DifficultyConfig, LETTER_DIFFICULTY_CONFIG, WORD_DIFFICULTY_CONFIG |
| `tests/game/difficulty.test.ts` | 20+ unit tests for all difficulty behaviors | VERIFIED | 281 lines, 25 test cases covering all behaviors listed in plan |
| `src/game/letters.ts` | getAvailableLetters(complexityLevel) | VERIFIED | Line 25-31: correct single-param signature |
| `src/game/words.ts` | getAvailableWords(wordLists, complexityLevel) | VERIFIED | Lines 19-25: correct two-param signature |
| `src/game/states.ts` | PlayingState with DifficultyManager integration | VERIFIED | 14 difficulty-related lines confirmed |
| `src/game/types.ts` | GameContext with getDifficulty/setDifficulty | VERIFIED | Lines 61-62: both methods in interface |
| `src/game/debug.ts` | Debug overlay with difficulty display | VERIFIED | Lines 37-51: optional difficulty param, Speed/Spawn/Complexity display |
| `src/game/game.ts` | Game class implementing getDifficulty/setDifficulty | VERIFIED | Lines 181-187: both methods implemented; _currentDifficulty field at line 40 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| `src/game/states.ts` | `src/game/difficulty.ts` | `this.difficulty.params` | WIRED | `states.ts:282` reads params; `states.ts:439,473` uses complexityLevel |
| `src/game/states.ts` | `src/game/difficulty.ts` | `this.difficulty.recordResult` | WIRED | 5 call sites: lines 338, 350, 523, 528, 555 |
| `src/game/game.ts` | `src/game/states.ts` | `getDifficulty` delegates to PlayingState via `_currentDifficulty` | WIRED | Game stores params set by PlayingState via setDifficulty each frame |
| `src/game/game.ts` | `src/game/debug.ts` | `_debug.update` receives difficulty params | WIRED | `game.ts:110-116`: `this._currentDifficulty` passed as 5th argument |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `src/game/states.ts` | `difficulty.params.fallSpeed` | `DifficultyManager._fallSpeed` updated by `recordResult()` calls | Yes -- computed from rolling window of actual hit/miss events | FLOWING |
| `src/game/states.ts` | `difficulty.params.complexityLevel` | `DifficultyManager._complexityLevel` updated by `updateComplexity()` | Yes -- computed from consecutiveHighAccuracy counter | FLOWING |
| `src/game/debug.ts` | `difficulty.fallSpeed`, `difficulty.spawnInterval`, `difficulty.complexityLevel` | `game.ts._currentDifficulty` set by `states.ts:378` each frame | Yes -- live DifficultyManager params pushed every update() | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| DifficultyManager exports exist | `node -e "const d = require('./src/game/difficulty.ts')"` | N/A (ESM/TS module) | SKIP (ESM -- verified via tsc) |
| TypeScript compiles without errors | `npx tsc --noEmit` | Exit 0, no errors | PASS |
| Build produces output | `pnpm run build` | Built in 137ms, all assets generated | PASS |
| 132 main tests pass | `pnpm vitest run --exclude ".claude/**"` | 11 files, 132 tests -- all pass | PASS |
| Worktree tests fail | `pnpm vitest run` (default) | 9 failures in `.claude/worktrees/agent-a65e5ac2/tests/game/states.test.ts` | FAIL (stale worktree artifact) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DIFF-01 | 05-01, 05-02 | La vitesse de chute s'ajuste automatiquement selon la performance de l'enfant | SATISFIED | `difficulty.ts` ramp/ease adjusts `_fallSpeed`; `states.ts:282` reads `fallSpeed` from params each frame |
| DIFF-02 | 05-01, 05-02 | La longueur/complexite des mots s'adapte au niveau de l'enfant | SATISFIED | `complexityLevel` drives `getAvailableLetters`/`getAvailableWords`; complexity state machine promotes/demotes based on accuracy |
| DIFF-03 | 05-01, 05-02 | Le taux d'apparition des lettres/mots s'adapte a la performance en temps reel | SATISFIED | `difficulty.ts` adjusts `_spawnInterval`; `states.ts:287` uses `spawnInterval` from params in spawn loop |
| DIFF-04 | 05-01, 05-02 | Le systeme vise un taux de reussite d'environ 70% pour maintenir l'etat de flow | SATISFIED | Dead zone 60-80% (D-07) stabilizes at ~70% accuracy; asymmetric 2x easing corrects downward faster than ramping |

All 4 requirements satisfied. No orphaned requirements found.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `vite.config.ts` | 13 | `test: {}` -- no exclude for `.claude/**` worktrees | Warning | Stale worktree test files are picked up, causing misleading test failures |

No TODO/FIXME/placeholder/stub patterns found in any phase 05 source files. No hardcoded empty returns in difficulty.ts, states.ts, debug.ts, game.ts, letters.ts, or words.ts.

### Human Verification Required

#### 1. Flow State at ~70% Accuracy

**Test:** Start a letter game session. Press random keys for the first 10 letters (mix of correct and wrong, targeting about 7/10 correct). After 10 letters, observe no speed or spawn interval change on subsequent letters.
**Expected:** With 70% accuracy, the game holds parameters steady (dead zone 60-80%). Speed and spawn interval should not drift.
**Why human:** Cannot verify dead zone hold during actual gameplay without running the app.

#### 2. Adaptive Ramp Over Time

**Test:** Start a letter game. Hit every letter correctly. After 10 correct letters, note that letters fall faster or appear more frequently. After 5 more consecutive correct letters at >80% accuracy, verify the complexity level increments (unlocking top-row letters in the pool).
**Expected:** Observable speed increase and eventual introduction of harder letters.
**Why human:** Requires live gameplay to observe real-time adaptation behavior.

#### 3. Debug Overlay Difficulty Display

**Test:** Start any game mode, press F3 to open the debug overlay. Observe Speed, Spawn, and Complexity values. Then deliberately miss several items and watch the values change.
**Expected:** Speed decreases, spawn interval increases, debug overlay reflects updated values within a few seconds.
**Why human:** Debug overlay requires browser rendering; cannot verify visually without running the game.

### Gaps Summary

One gap found: the vitest config does not exclude `.claude/worktrees/**` from its default test glob. This causes 9 tests in a stale worktree copy of `tests/game/states.test.ts` to fail. That copy is missing the `getDifficulty`/`setDifficulty` mock methods that were added to the main `tests/game/states.test.ts` during Plan 02.

The fix is minimal: add `exclude: ['.claude/**']` to the `test:` block in `vite.config.ts`. All 132 main project tests pass cleanly when this exclusion is applied.

The adaptive difficulty logic itself is fully implemented, well-tested (25 unit tests), and correctly wired through the game loop. All 4 DIFF requirements are satisfied. The phase goal -- automatic skill-level adaptation -- is implemented in code and verified to compile and pass main tests.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
