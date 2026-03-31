# Phase 5: Adaptive Difficulty - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

The game automatically adjusts fall speed, spawn rate, and letter/word complexity to each child's skill level, targeting approximately 70% success rate. Difficulty eases faster than it ramps to keep the experience non-frustrating. No persistent difficulty (profiles are Phase 6).

This phase replaces the fixed constants in PlayingState (FALL_SPEED, SPAWN_INTERVAL_MS, SESSION_LENGTH) with a dynamic difficulty system that responds to real-time performance.

</domain>

<decisions>
## Implementation Decisions

### Adaptive Parameters (DIFF-01, DIFF-03)
- **D-01:** Three parameters adapt in real-time: **fall speed**, **spawn interval**, and **item complexity**
- **D-02:** Fall speed range: **40-150 px/s** (letter mode), **25-100 px/s** (word mode). Baseline starts at current fixed values (80 / 50)
- **D-03:** Spawn interval range: **800-3000 ms** (letter mode), **1500-4000 ms** (word mode). Baseline starts at current fixed values (1500 / 2500)
- **D-04:** Item complexity adapts via **progressive unlock based on rolling accuracy**: letter mode unlocks rows (home -> top -> bottom), word mode unlocks medium-length words. Thresholds already exist in Phase 3/4 code (40% / 70% progression); Phase 5 makes these dynamic based on rolling accuracy instead of session progress percentage

### Performance Measurement
- **D-05:** Performance measured via **rolling window of last 10 items** (hits vs misses). Window fills during first 10 items; no adjustments until window is full
- **D-06:** Adjustment triggers **after each item completes** (hit, miss, or reached bottom) -- continuous, not batched
- **D-07:** **Dead zone around target**: if rolling accuracy is 60-80%, hold parameters steady. Below 60% -> ease difficulty. Above 80% -> ramp difficulty

### Asymmetric Adjustment (DIFF-04 target: ~70%)
- **D-08:** Easing is **2x faster than ramping** -- if a ramp step adds +5 px/s fall speed, an ease step subtracts -10 px/s. This matches success criteria #2: "fall speed decrease faster than increase"
- **D-09:** Each adjustment step is **small and incremental** -- child should not notice sudden jumps. Speed changes ~5 px/s per step, spawn interval changes ~100-200ms per step
- **D-10:** **Floor and ceiling clamps** prevent parameters from going outside defined ranges (D-02, D-03)

### Word Complexity Adaptation (DIFF-02)
- **D-11:** Word length adapts separately from speed/spawn: rolling accuracy > 80% for 5+ items unlocks medium words (5-6 letters). Accuracy dropping below 50% reverts to short words only
- **D-12:** Letter row progression uses same rolling accuracy: > 80% adds next row, < 50% removes last-added row. This replaces the Phase 3 session-progress-percentage thresholds

### Session Behavior
- **D-13:** Difficulty **resets to baseline each session** -- no persistence between sessions. Profiles (Phase 6) will later store and restore difficulty levels
- **D-14:** **Session length remains fixed** (20 letters / 15 words) -- adaptive difficulty changes the experience within a session, not the session length
- **D-15:** A **difficulty level indicator** is not shown to the child (avoids anxiety). Debug overlay (F3) shows current difficulty parameters for developer verification

### Architecture
- **D-16:** New file `src/game/difficulty.ts` containing a `DifficultyManager` class that encapsulates all adaptation logic: rolling window, parameter calculation, adjustment triggers
- **D-17:** `DifficultyManager` is **pure logic, no PixiJS dependency** -- takes hits/misses as input, outputs current difficulty parameters (speed, spawnInterval, complexity level). Fully unit-testable
- **D-18:** PlayingState reads difficulty parameters from DifficultyManager each tick instead of using fixed constants. DifficultyManager is created per session (in PlayingState.enter) and discarded on exit
- **D-19:** GameContext extended with `getDifficulty()` method so debug overlay can display current parameters

### Claude's Discretion
- Exact step sizes for each parameter adjustment (within the 2x asymmetry constraint)
- Rolling window implementation details (circular buffer, array slice, etc.)
- Whether to use linear interpolation or stepped values for parameter changes
- Debug overlay format for difficulty display
- Exact accuracy thresholds for complexity unlocks (suggested 80%/50% are starting points)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` -- Core value (non-frustrating for 5-8 year olds), constraint on performance
- `.planning/REQUIREMENTS.md` -- DIFF-01 (speed adapts), DIFF-02 (word complexity adapts), DIFF-03 (spawn rate adapts), DIFF-04 (converges to ~70%)
- `.planning/ROADMAP.md` -- Phase 5 success criteria (5 items, all must be TRUE)

### Prior Phase Context
- `.planning/phases/03-letter-mode-gameplay/03-CONTEXT.md` -- Letter progression thresholds (D-04, D-05), non-punitive feedback (D-09)
- `.planning/phases/04-word-mode-game-modes/04-CONTEXT.md` -- Word categories by length (D-10, D-12), mode-aware PlayingState (D-23, D-24)

### Existing Code
- `src/game/states.ts` -- PlayingState with fixed constants: FALL_SPEED (80), SPAWN_INTERVAL_MS (1500), WORD_FALL_SPEED (50), WORD_SPAWN_INTERVAL_MS (2500), SESSION_LENGTH (20/15)
- `src/game/letters.ts` -- `getAvailableLetters(progress, total)` with 40%/70% thresholds for row progression
- `src/game/words.ts` -- `getAvailableWords(progress, total, locale)` with similar progression
- `src/game/types.ts` -- GameContext interface, GameMode type, SessionResult
- `src/game/game.ts` -- Game class, debug overlay integration point

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `getAvailableLetters(progress, total)` in `src/game/letters.ts` -- progression logic to refactor from percentage-based to accuracy-based
- `getAvailableWords(progress, total, locale)` in `src/game/words.ts` -- same refactoring needed
- `PlayingState` in `src/game/states.ts` -- reads constants per tick, easy to swap for DifficultyManager output
- Debug overlay in `src/game/debug.ts` -- already shows FPS, state, pool stats; extend with difficulty params

### Established Patterns
- Pure logic modules with no PixiJS dependency (letters.ts, words.ts, tween.ts) -- DifficultyManager follows same pattern
- GameContext interface for system access -- extend for difficulty
- Per-session lifecycle: create in enter(), use in update(), discard in exit()
- Unit tests with vi.mock for PixiJS isolation

### Integration Points
- `src/game/states.ts` PlayingState -- replace fixed constants with DifficultyManager reads
- `src/game/letters.ts` -- refactor `getAvailableLetters` to accept accuracy instead of progress/total
- `src/game/words.ts` -- refactor `getAvailableWords` similarly
- `src/game/types.ts` -- extend GameContext with getDifficulty()
- `src/game/debug.ts` -- add difficulty display

</code_context>

<specifics>
## Specific Ideas

- The 2x asymmetric easing is specifically designed for young children: when struggling, difficulty drops quickly to prevent frustration; when succeeding, it ramps slowly to avoid sudden overwhelm
- The dead zone (60-80%) prevents oscillation around the target -- the system holds steady when the child is in the flow zone
- Rolling window of 10 items means the system responds within ~15-25 seconds of play, fast enough to feel responsive but slow enough to avoid jitter
- No visible difficulty indicator for the child -- anxiety about "level" would undermine the non-frustrating core value

</specifics>

<deferred>
## Deferred Ideas

- Persistent difficulty levels across sessions -- Phase 6 (Profiles & Local Persistence) will store and restore difficulty state
- Per-letter accuracy tracking (which specific letters the child struggles with) -- could inform targeted practice in ADV-02 (v2)
- Difficulty presets per age group -- could simplify initial calibration but not needed for v1 adaptive system
- Visual feedback on difficulty changes (e.g., background color shift) -- Phase 8 (Visual Identity) scope

</deferred>

---

*Phase: 05-adaptive-difficulty*
*Context gathered: 2026-03-31*
