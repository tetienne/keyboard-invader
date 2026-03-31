---
phase: 03-letter-mode-gameplay
verified: 2026-03-30T22:00:00Z
status: human_needed
score: 4/4 must-haves verified
human_verification:
  - test: "Start a session and observe letters falling"
    expected: "Large colorful BitmapText letters fall from the top of the screen at a steady pace"
    why_human: "PixiJS canvas rendering and font rendering cannot be verified without a browser"
  - test: "Press a key matching a visible letter"
    expected: "The matching letter scales up, flashes green, and fades out. Score at top-right increments."
    why_human: "Tween animation and visual effect require browser observation"
  - test: "Press a key that does not match any visible letter"
    expected: "The lowest letter briefly flashes red and shakes horizontally. No score penalty. No game over."
    why_human: "Miss visual feedback requires browser observation"
  - test: "Let a letter reach the bottom without pressing anything"
    expected: "Letter fades out silently. No score penalty. No game over."
    why_human: "Bottom fade animation requires browser observation"
  - test: "Complete a full session (20 letters spawned and cleared)"
    expected: "Game transitions to a results screen showing 'Bravo !', hits count, misses count, and accuracy percentage"
    why_human: "State transition and results screen layout require browser observation"
  - test: "Click 'Rejouer' on results screen"
    expected: "Playing state restarts with fresh counters and new letters"
    why_human: "State re-entry and UI interaction require browser observation"
---

# Phase 3: Letter Mode Gameplay Verification Report

**Phase Goal:** A 5-year-old can play a complete session of falling letters, pressing keys to destroy them, with immediate visual feedback
**Verified:** 2026-03-30T22:00:00Z
**Status:** human_needed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Single letters fall from the top of the screen at a steady pace | ✓ VERIFIED | `PlayingState.update` increments `entity.text.y += FALL_SPEED * dtSec` per frame for all entities with `tween === null`. FALL_SPEED=80px/sec, SPAWN_INTERVAL_MS=1500ms. Spawning confirmed by test "spawns BitmapText letter after SPAWN_INTERVAL_MS (1500ms)". |
| 2 | Pressing the correct key destroys the matching letter with a visible effect | ✓ VERIFIED | `findLowestMatch` finds the lowest entity matching the key; `createHitTween()` applied (300ms: scale 1.0->1.3, green tint 0x4ade80, alpha 1->0); `markedForRemoval=true`; cleanup pass calls `ctx.releasePoolItem`. Hit tween logic fully tested (16 tween tests pass). |
| 3 | Pressing an incorrect key shows a distinct "wrong" visual feedback (no punishment, just indication) | ✓ VERIFIED | Miss path: `findLowestEntity` finds lowest letter; `createMissTween()` applied (200ms: red tint 0xef4444, dampened horizontal shake). Miss does NOT set `markedForRemoval`. After completion, `entity.text.tint` restored to `entity.originalTint` and `entity.text.x` restored to `entity.baseX`. No score deduction in code. |
| 4 | A score counter is visible on screen and increments on successful hits | ✓ VERIFIED | `enter()` creates `scoreText = new BitmapText({ text: 'Score: 0', ... })` at `x=BASE_WIDTH-200, y=20` and adds to `ctx.gameRoot`. `update()` sets `scoreText.text = 'Score: ' + String(this.hits)` after each input pass. |

**Score:** 4/4 truths verified

### Required Artifacts

#### Plan 01 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/types.ts` | StateName with 'gameover', TRANSITIONS, SessionResult, GameContext session methods | ✓ VERIFIED | Contains `'gameover'` in StateName union; `gameover: ['menu', 'playing']` in TRANSITIONS; `interface SessionResult { hits, misses, total }`; `setSessionResult(result: SessionResult): void` and `getSessionResult(): SessionResult \| null` on GameContext. |
| `src/game/letters.ts` | HOME_ROW, TOP_ROW, BOTTOM_ROW, LETTER_COLORS, getAvailableLetters, findLowestMatch, findLowestEntity, LetterEntity | ✓ VERIFIED | All 8 exports present. LetterEntity includes `originalTint: number` (added by Plan 02). 13 unit tests pass. |
| `src/game/tween.ts` | LetterTween interface, createHitTween, createMissTween, createBottomTween, updateTween | ✓ VERIFIED | All 5 exports present. Green tint `0x4ade80` and red tint `0xef4444` confirmed. 16 unit tests pass. |
| `tests/game/letters.test.ts` | 13 unit tests for letter selection and matching | ✓ VERIFIED | All 13 tests pass (pnpm vitest run confirms PASS 13, FAIL 0). |
| `tests/game/tween.test.ts` | 16 unit tests for tween animation logic | ✓ VERIFIED | All 16 tests pass (pnpm vitest run confirms PASS 16, FAIL 0). |

#### Plan 02 Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/states.ts` | Refactored PlayingState with letter gameplay + GameOverState | ✓ VERIFIED | Contains `export class GameOverState implements GameState`. Imports from letters.ts and tween.ts. Contains `getAvailableLetters`, `findLowestMatch`, `createHitTween`, `setSessionResult`, `transitionTo('gameover')`, `Bravo`, `Rejouer`, `getSessionResult`. |
| `src/game/game.ts` | Updated Game class with BitmapText pool, gameover state, session result storage | ✓ VERIFIED | `ObjectPool<BitmapText>` (not Graphics); `setSessionResult` and `getSessionResult` implemented; `gameover: new GameOverState()` in StateMachine constructor. No `GraphicsContext` import. |
| `src/game/index.ts` | Updated barrel exports including GameOverState and new letter/tween modules | ✓ VERIFIED | Exports `GameOverState`, `SessionResult`, `LetterEntity`, `LetterTween`, all letter utilities, all tween utilities. |
| `tests/game/states.test.ts` | Updated tests for PlayingState and new GameOverState tests | ✓ VERIFIED | Contains `describe('GameOverState', ...)` block with 3 tests. `createMockGameContext` includes `setSessionResult`/`getSessionResult`. `makeStates()` includes `gameover`. 19 state tests pass total. |

### Key Link Verification

#### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/game/letters.ts` | `src/game/types.ts` | imports BASE_WIDTH | ✓ WIRED | `letters.ts` does not directly import BASE_WIDTH from types.ts -- it imports `BitmapText` from pixi.js and `LetterTween` from tween.ts. BASE_WIDTH is used in states.ts (spawn position math). This link was expected but the actual implementation passes BASE_WIDTH via context arguments; not a gap. |
| `src/game/tween.ts` | `src/game/letters.ts` | imports LetterEntity | ✓ WIRED | `tween.ts` intentionally uses a structural `TweenTarget` interface instead of importing `LetterEntity` to avoid circular dependency. `LetterEntity` satisfies `TweenTarget` structurally. This is a documented design decision. |

#### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/game/states.ts` | `src/game/letters.ts` | imports getAvailableLetters, findLowestMatch, findLowestEntity, LETTER_COLORS, LetterEntity | ✓ WIRED | Lines 4-10 of states.ts: `import { getAvailableLetters, findLowestMatch, findLowestEntity, LETTER_COLORS } from './letters.js'` and `import type { LetterEntity } from './letters.js'`. All four functions actively used in PlayingState.update(). |
| `src/game/states.ts` | `src/game/tween.ts` | imports updateTween, createHitTween, createMissTween, createBottomTween | ✓ WIRED | Lines 11-16 of states.ts: all four tween functions imported. `createHitTween()`, `createMissTween()`, `createBottomTween()` called in PlayingState input/detection logic. `updateTween(entity, dt)` called in tween update pass. |
| `src/game/game.ts` | `src/game/states.ts` | registers GameOverState in StateMachine constructor | ✓ WIRED | `gameover: new GameOverState()` in `this._stateMachine` constructor. `GameOverState` imported from `./states.js`. |
| `PlayingState` | `GameContext.setSessionResult` | passes session stats when transitioning to gameover | ✓ WIRED | `ctx.setSessionResult({ hits: this.hits, misses: this.misses, total: this.SESSION_LENGTH })` called immediately before `ctx.transitionTo('gameover')` in session end check. |
| `GameOverState` | `GameContext.getSessionResult` | reads session stats on enter to display results | ✓ WIRED | `const result = ctx.getSessionResult()` on first line of `GameOverState.enter()`. `result?.hits`, `result?.misses`, `result?.total` used for stats display. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `PlayingState` | `activeEntities` | `ctx.acquirePoolItem()` returns BitmapText from ObjectPool; letter assigned from `getAvailableLetters()` output | ObjectPool pre-allocates 20 BitmapText nodes in `game.ts` constructor | ✓ FLOWING |
| `PlayingState` | `scoreText.text` | `this.hits` counter incremented on each `findLowestMatch` hit | Counter is runtime state, incremented from actual key matching logic | ✓ FLOWING |
| `GameOverState` | stats display | `ctx.getSessionResult()` reads `_sessionResult` set by `PlayingState.setSessionResult()` | SessionResult contains actual hits/misses/total from the played session | ✓ FLOWING |
| `GameOverState` | BitmapText nodes | `BitmapText` constructed with session stats formatted as strings | Real computed values (accuracy = `Math.round((hits/total)*100)`) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All 81 tests pass | `pnpm vitest run` | PASS (81) FAIL (0) | ✓ PASS |
| TypeScript compiles clean | `pnpm typecheck` | No errors | ✓ PASS |
| ESLint clean | `pnpm lint` | No issues found | ✓ PASS |
| Letters test suite | `pnpm vitest run tests/game/letters.test.ts` | PASS (13) | ✓ PASS |
| Tween test suite | `pnpm vitest run tests/game/tween.test.ts` | PASS (16) | ✓ PASS |
| States test suite includes GameOverState | `pnpm vitest run tests/game/states.test.ts` | PASS (19) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| GAME-01 | 03-01, 03-02 | L'enfant voit des lettres/mots tomber du haut de l'ecran et tape pour les eliminer | ✓ SATISFIED | PlayingState spawns BitmapText letters; fall logic and key-matching fully implemented; 20-letter session with gameover transition. |
| GAME-02 | 03-01, 03-02 | L'enfant en mode lettres voit des lettres individuelles avec gros visuels | ✓ SATISFIED | BitmapText created with fontSize=80, bright LETTER_COLORS palette (8 colors), anchor=0.5 (centered). Letter displayed as uppercase. |
| GAME-04 | 03-01, 03-02 | L'enfant recoit un feedback audio et visuel immediat a chaque frappe | ✓ SATISFIED (visual only) | Hit: green scale+fade (createHitTween, 300ms). Miss: red shake (createMissTween, 200ms). Bottom: fade (createBottomTween, 400ms). Audio feedback (AV-02) is Phase 9 scope. |
| GAME-05 | 03-02 | L'enfant voit son score affiche pendant la partie | ✓ SATISFIED | `scoreText` BitmapText at `x=BASE_WIDTH-200, y=20`. Updated each frame: `'Score: ' + String(this.hits)`. |

**Note on GAME-04 audio:** The requirement says "feedback audio et visuel". Audio effects (AV-02) are explicitly scoped to Phase 9 per REQUIREMENTS.md traceability table. The visual feedback component of GAME-04 is fully satisfied by this phase.

**No orphaned requirements:** REQUIREMENTS.md traceability maps GAME-01, GAME-02, GAME-04, GAME-05 to Phase 3, matching exactly the requirement IDs claimed in both plan frontmatters.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | - |

No TODO/FIXME/placeholder comments found. No empty implementations. No hardcoded empty data that flows to rendering. No stubs.

### Human Verification Required

#### 1. Letters Fall Visually

**Test:** Run `pnpm dev`, open http://localhost:5173, click "Jouer"
**Expected:** Large colorful letters (80px BitmapText) fall from the top at a gentle pace (80px/sec), one every 1.5 seconds, with bright colors from the kid-friendly palette
**Why human:** PixiJS canvas rendering cannot be verified without a browser

#### 2. Correct Keypress Feedback

**Test:** While letters are falling, press the key matching a visible letter
**Expected:** The matching letter scales up to 1.3x, flashes green, and fades to invisible over 300ms. Score counter at top-right increments.
**Why human:** Tween animation and visual effect require browser observation

#### 3. Incorrect Keypress Feedback

**Test:** Press a key that does not match any visible letter
**Expected:** The lowest letter briefly flashes red and shakes horizontally (dampened sine wave) over 200ms, then restores to its original color. No score change. No letter destroyed.
**Why human:** Miss visual feedback requires browser observation

#### 4. Bottom Fade

**Test:** Do not press any keys and let a letter reach the bottom of the screen
**Expected:** The letter fades out silently over 400ms when it passes below y=BASE_HEIGHT+40. No penalty, no game over, no sound.
**Why human:** Bottom fade animation requires browser observation

#### 5. Session End and Results Screen

**Test:** Complete a full session by pressing keys (or letting letters fall) until all 20 have been spawned and cleared
**Expected:** Game transitions to a results screen showing "Bravo !", hits count, misses count, accuracy percentage, a "Rejouer" button, and a "Menu" button
**Why human:** State transition and results screen layout require browser observation

#### 6. Rejouer Button

**Test:** On the results screen, click "Rejouer"
**Expected:** Playing state restarts with fresh counters (Score: 0), new letters begin falling, full session of 20 plays again
**Why human:** State re-entry and UI interaction require browser observation

### Gaps Summary

No automated gaps found. All four ROADMAP success criteria are fully implemented and wired:

1. Letters fall at a steady pace (80px/sec, 1500ms spawn interval) via PlayingState fall logic.
2. Correct keypress destroys matching letter with green scale+fade effect via hit tween.
3. Incorrect keypress shows red flash+shake on lowest letter via miss tween, no punishment.
4. Score counter at top-right increments on each hit.

The phase additionally delivers the session lifecycle (20 letters, gameover transition), results screen with stats, Rejouer/Menu buttons, and the supporting pure-logic modules (tween system, letter selection with progressive row unlocking).

The only items requiring verification are visual/browser behaviors that cannot be confirmed programmatically.

---

_Verified: 2026-03-30T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
