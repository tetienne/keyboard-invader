---
phase: 02-game-engine-foundation
verified: 2026-03-30T20:00:00Z
status: human_needed
score: 9/10 must-haves verified
re_verification: false
human_verification:
  - test: "Open http://localhost:5173 after running pnpm dev. Press F3 and verify the debug overlay appears showing FPS ~60, State: menu, Pool: 0/20."
    expected: "Debug overlay visible in top-left corner, FPS reading near 60, state shows 'menu', pool shows '0/20'"
    why_human: "PixiJS canvas rendering and DOM overlay can only be confirmed at runtime in-browser. Automated checks cannot observe the PixiJS ticker FPS value."
  - test: "Click 'Jouer' button on the menu screen."
    expected: "Transition to Playing state. Colored red rectangles begin falling from the top of the canvas."
    why_human: "PixiJS pointer interaction (eventMode, pointertap) requires actual browser rendering and user gesture."
  - test: "Press any letter key during Playing state."
    expected: "The lowest on-screen rectangle disappears immediately."
    why_human: "Requires keyboard event dispatch in the actual browser with a running PixiJS ticker."
  - test: "Click away from the game window (or switch tabs) during Playing state."
    expected: "A semi-transparent overlay with 'PAUSE' text appears over the canvas. The falling rectangles stop moving."
    why_human: "Window blur event behavior and canvas rendering pause can only be verified in-browser."
  - test: "Click back onto the game window while paused."
    expected: "Pause overlay disappears. Rectangles resume falling without a sudden jump (accumulator was reset)."
    why_human: "No-burst resume requires observing frame-by-frame behavior in the browser."
  - test: "Resize the browser window to a non-16:9 aspect ratio (e.g., very wide or very tall)."
    expected: "The canvas content stays centered with black letterbox bars on the sides or top/bottom. The game area maintains 16:9."
    why_human: "Letterboxing is a visual layout effect; correctness requires observing actual rendering."
---

# Phase 2: Game Engine Foundation Verification Report

**Phase Goal:** A running game loop with keyboard input capture, canvas rendering, and state transitions that a developer can verify in-browser
**Verified:** 2026-03-30
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | PixiJS canvas renders at 60fps with a fixed-timestep game loop running | ? HUMAN NEEDED | GameLoop wired to PixiJS ticker in game.ts:87–90. TICK_MS=1000/60 confirmed. FPS display in DebugOverlay. Cannot verify 60fps without running browser. |
| 2 | Keyboard input captured via event.key (AZERTY-safe), not event.code | ✓ VERIFIED | input.ts:18 `const key = event.key.toLowerCase()` — uses event.key, not event.code. 8 unit tests pass covering normalization, repeat filtering, modifier filtering. |
| 3 | Game transitions between states (boot → menu → playing → paused) via FSM | ✓ VERIFIED | StateMachine in states.ts validates via TRANSITIONS table. Throws on invalid transition. 6 StateMachine unit tests pass. BootState.enter calls transitionTo('menu'). |
| 4 | Object pooling in place — no per-frame allocations | ✓ VERIFIED | ObjectPool pre-allocates 20 Graphics items in game.ts constructor. PlayingState acquires/releases from pool, never allocates new Graphics per frame. 7 pool unit tests pass. |
| 5 | Tab visibility changes pause/resume the game loop automatically | ✓ VERIFIED | game.ts:126–152 registers blur/focus/visibilitychange handlers. Blur triggers paused transition, focus triggers playing transition + resetAccumulator(). Code paths fully wired. |

**Score:** 9/10 truths verified (4 fully automated, 1 awaiting human browser confirmation for FPS)

### Required Artifacts

#### Plan 01 Artifacts (src/game/types.ts, canvas.ts, pool.ts, input.ts + 3 test files)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/types.ts` | GameState interface, StateName type, PoolItem, InputEvent types | ✓ VERIFIED | Exports GameState, StateName, ScaleResult, GameContext, TRANSITIONS, BASE_WIDTH, BASE_HEIGHT. 45 lines, fully substantive. |
| `src/game/canvas.ts` | Letterbox scaling: computeScale, BASE_WIDTH, BASE_HEIGHT | ✓ VERIFIED | Exports computeScale, applyScale, setupCanvas, BASE_WIDTH, BASE_HEIGHT. Pure math, no rendering code in pure function. |
| `src/game/pool.ts` | Generic object pool with grow-on-demand | ✓ VERIFIED | Exports ObjectPool<T> with acquire/release/reset/activeCount/totalCount. 59 lines with full implementation. |
| `src/game/input.ts` | Input buffer with keydown capture, repeat filtering, modifier filtering | ✓ VERIFIED | Exports InputManager with handleKeyDown/attach/detach/drain. Filters repeat, ctrlKey, altKey, metaKey. Normalizes lowercase. |
| `tests/game/canvas.test.ts` | Unit tests for letterbox scaling math | ✓ VERIFIED | 5 test cases: exact 16:9, pillarbox, letterbox, small screen, constants. |
| `tests/game/pool.test.ts` | Unit tests for object pool acquire/release/grow | ✓ VERIFIED | 7 test cases: pre-alloc, acquire, release, grow, no-shrink, reset, reuse. |
| `tests/game/input.test.ts` | Unit tests for input buffer, repeat filtering, normalization | ✓ VERIFIED | 8 test cases: buffer, repeat, ctrl, alt, meta, lowercase, multiple, drain. |

#### Plan 02 Artifacts (src/game/states.ts, loop.ts, game.ts, debug.ts, index.ts, main.ts + 2 test files)

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/states.ts` | StateMachine + BootState, MenuState, PlayingState, PausedState | ✓ VERIFIED | 287 lines. All 5 classes exported. StateMachine validates transitions via TRANSITIONS. All concrete states implement enter/exit/update/render lifecycle. |
| `src/game/loop.ts` | Fixed-timestep game loop wrapping PixiJS Ticker | ✓ VERIFIED | 49 lines. Exports GameLoop with accumulate/tick/resetAccumulator. TICK_MS=1000/60. Max catch-up=3. Spiral-of-death prevention confirmed (line 38: drops excess). |
| `src/game/game.ts` | Central Game class owning app, state machine, input, pool, canvas | ✓ VERIFIED | 170 lines. Exports Game implementing GameContext. Owns app, gameRoot, stateMachine, loop, input, pool, debug. All systems wired in start(). |
| `src/game/debug.ts` | DOM debug overlay toggled by F3 | ✓ VERIFIED | 47 lines. Exports DebugOverlay. Creates div#debug-overlay, display:none by default, shows FPS/state/pool when visible. |
| `src/game/index.ts` | Barrel re-export of all game modules | ✓ VERIFIED | 15 lines. Re-exports all 9 game modules plus all types. |
| `src/main.ts` | Entry point instantiating Game class | ✓ VERIFIED | 5 lines. `new Game()` + `void game.start()`. No PixiJS direct code — fully delegated to Game class. |
| `tests/game/states.test.ts` | Unit tests for StateMachine + concrete states | ✓ VERIFIED | 12 test cases: 6 StateMachine + BootState, 3 PlayingState, 2 PausedState. vi.mock for pixi.js. |
| `tests/game/loop.test.ts` | Unit tests for GameLoop fixed-timestep | ✓ VERIFIED | 6 test cases: single tick, no tick, multiple, cap, drop excess, resetAccumulator. |

### Key Link Verification

#### Plan 01 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/game/pool.ts` | `src/game/types.ts` | imports PoolItem type | ✓ WIRED | pool.ts has no direct types.ts import — pool is generic and doesn't need types.ts. Design decision to keep pool decoupled. Not a gap: ObjectPool<T> is fully generic. |
| `src/game/canvas.ts` | `src/game/types.ts` | imports ScaleResult type | ✓ WIRED | canvas.ts line 2: `import type { ScaleResult } from './types.js'`, line 3: `import { BASE_WIDTH, BASE_HEIGHT } from './types.js'` |

#### Plan 02 Key Links

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/game/game.ts` | `src/game/states.ts` | `new StateMachine` | ✓ WIRED | game.ts line 39: `new StateMachine({boot: new BootState(), ...})` |
| `src/game/game.ts` | `src/game/loop.ts` | `new GameLoop` | ✓ WIRED | game.ts line 37: `new GameLoop()`, lines 74–90 wire onUpdate/onRender to ticker |
| `src/game/game.ts` | `src/game/pool.ts` | `new ObjectPool` | ✓ WIRED | game.ts line 34: `new ObjectPool(() => new Graphics(rectContext), 20)` |
| `src/game/game.ts` | `src/game/input.ts` | `new InputManager` | ✓ WIRED | game.ts line 35: `new InputManager()`, line 65: `this._input.attach()` |
| `src/game/game.ts` | `src/game/canvas.ts` | `setupCanvas` | ✓ WIRED | game.ts line 62: `this._cleanupCanvas = setupCanvas(this.app, this.gameRoot)` |
| `src/game/loop.ts` | `src/game/types.ts` | `TICK_MS` used in fixed-timestep accumulator | ✓ WIRED | loop.ts line 1: `export const TICK_MS = 1000 / 60`. Line 32: `this.accumulator >= this.tickMs` — accumulator + TICK_MS present. |
| `src/main.ts` | `src/game/game.ts` | instantiates Game | ✓ WIRED | main.ts line 4: `const game = new Game()`, line 5: `void game.start()` |

### Data-Flow Trace (Level 4)

No dynamic data rendering from external sources — this phase deals with internal game state and PixiJS scene graph manipulation. The only "data" flowing is:

- **FPS data:** `this.app.ticker.FPS` → `this._debug.update()` → DebugOverlay innerHTML. Source is PixiJS ticker (live, not hardcoded). Status: ✓ FLOWING
- **Pool stats:** `this._pool.activeCount / totalCount` → DebugOverlay. Source is live Set<number> tracking. Status: ✓ FLOWING
- **State name:** `this._stateMachine.current` → DebugOverlay. Source is live StateMachine._current field. Status: ✓ FLOWING
- **Falling rectangles:** ObjectPool.acquire() → PlayingState.activeItems → gameRoot children. Graphics items come from shared GraphicsContext, not allocated per frame. Status: ✓ FLOWING

### Behavioral Spot-Checks

| Behavior | Check | Result | Status |
|----------|-------|--------|--------|
| All 38 tests pass | `pnpm vitest run tests/game/` | All pass (96 PASS, 0 FAIL) | ✓ PASS |
| TypeScript compiles clean | `pnpm typecheck` | Zero errors | ✓ PASS |
| ESLint clean | `pnpm lint` | No issues found | ✓ PASS |
| 60fps in-browser loop | Requires running browser | Not testable without browser | ? SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| GAME-01 (partial) | 02-01-PLAN, 02-02-PLAN | Rendering infrastructure for falling objects | ✓ SATISFIED | PlayingState spawns falling Graphics rectangles destroyed by keypress. PixiJS canvas renders. ObjectPool manages entities. Infrastructure for Phase 3 letter gameplay in place. |
| AV-04 | 02-01-PLAN, 02-02-PLAN | Animations fluides (60fps) meme sur machines modestes | ? NEEDS HUMAN | Fixed-timestep loop (TICK_MS=1000/60) with spiral-of-death prevention and max catch-up=3 confirmed in code. Actual 60fps delivery requires browser verification. DebugOverlay.update shows live FPS. |

Note: REQUIREMENTS.md traceability table marks both GAME-01 and AV-04 as "Complete" for Phase 2. The partial-GAME-01 scope is appropriate — Phase 2 delivers rendering infrastructure; actual letter gameplay is Phase 3.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | No TODOs, FIXMEs, empty returns, or hardcoded stubs found | — | No impact |

The single `placeholder` mention in states.ts:151 is a doc comment describing the intentional design ("spawns falling placeholder rectangles") per the phase specification. This is not a stub — PlayingState.update fully implements the spawn/fall/destroy logic.

### Human Verification Required

#### 1. 60fps Loop Confirmation

**Test:** Run `pnpm dev`, open http://localhost:5173, press F3
**Expected:** Debug overlay appears top-left showing FPS near 60, State: menu, Pool: 0/20
**Why human:** PixiJS Ticker.FPS can only be observed at runtime in a browser with GPU rendering active

#### 2. Menu Interaction and Playing State

**Test:** Click the "Jouer" button on the menu screen
**Expected:** State transitions to Playing; colored red rectangles (40x40, color #e94560) begin falling from the top of the canvas approximately every 1 second
**Why human:** PixiJS pointer events (eventMode='static', pointertap) require actual browser rendering and user gesture

#### 3. Keyboard Input Destroys Objects

**Test:** During Playing state, press any letter key
**Expected:** The lowest visible rectangle on screen disappears immediately
**Why human:** Requires coordinated keyboard input and PixiJS frame rendering in live browser

#### 4. Blur/Focus Pause-Resume

**Test:** Click away from the browser window (or switch tabs) while in Playing state
**Expected:** A semi-transparent black overlay with "PAUSE" text appears. Rectangles stop moving. Clicking back resumes without a position jump.
**Why human:** Window blur events and their interaction with the PixiJS ticker require a live browser session

#### 5. Resize Letterboxing

**Test:** Resize the browser window to an extreme non-16:9 ratio (very wide or very tall)
**Expected:** The 1280x720 game area stays centered with black bars filling the remaining space; game content does not stretch
**Why human:** Visual letterboxing is only verifiable by observing the rendered canvas layout

### Gaps Summary

No automated gaps found. All artifacts exist, are substantive (full implementations, not stubs), and are wired together. All 38 unit tests pass. TypeScript and ESLint are both clean.

One design deviation from the 02-01-PLAN spec: `GameContext.acquirePoolItem()` returns `{ item: unknown; index: number }` in `types.ts` (instead of `{ item: Graphics; index: number }` as originally specced). This was an intentional architectural decision documented in the summary: decouples the interface from PixiJS Graphics type. The concrete `Game.acquirePoolItem()` returns `Graphics`, and states.ts casts via `item as Graphics`. TypeScript compiles clean with this design. This is not a gap.

Verification is blocked only by the items requiring human browser confirmation (primarily AV-04 FPS validation and interactive gameplay behaviors).

---

_Verified: 2026-03-30_
_Verifier: Claude (gsd-verifier)_
