# Phase 5: Adaptive Difficulty - Research

**Researched:** 2026-03-31
**Domain:** Game difficulty adaptation, rolling window statistics, control systems
**Confidence:** HIGH

## Summary

Phase 5 replaces fixed constants in PlayingState (FALL_SPEED, SPAWN_INTERVAL_MS, and progression thresholds) with a dynamic DifficultyManager class. The scope is well-defined: a pure TypeScript module with no external dependencies, consuming hit/miss events and outputting numeric parameters. The existing codebase patterns (pure logic modules like letters.ts, words.ts, tween.ts) provide a clear template.

The core algorithm is a bounded, asymmetric proportional controller with a dead zone. This is a well-understood control pattern. The main risk is not algorithmic complexity but integration: refactoring `getAvailableLetters` and `getAvailableWords` to accept accuracy instead of progress/total requires updating both the functions and their callers without breaking existing tests.

**Primary recommendation:** Build DifficultyManager as a pure class with zero dependencies, unit test it exhaustively, then integrate into PlayingState by replacing constant reads with DifficultyManager parameter reads.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Three parameters adapt in real-time: fall speed, spawn interval, and item complexity
- **D-02:** Fall speed range: 40-150 px/s (letter mode), 25-100 px/s (word mode). Baseline starts at current fixed values (80 / 50)
- **D-03:** Spawn interval range: 800-3000 ms (letter mode), 1500-4000 ms (word mode). Baseline starts at current fixed values (1500 / 2500)
- **D-04:** Item complexity adapts via progressive unlock based on rolling accuracy: letter mode unlocks rows (home -> top -> bottom), word mode unlocks medium-length words. Thresholds already exist in Phase 3/4 code (40% / 70% progression); Phase 5 makes these dynamic based on rolling accuracy instead of session progress percentage
- **D-05:** Performance measured via rolling window of last 10 items (hits vs misses). Window fills during first 10 items; no adjustments until window is full
- **D-06:** Adjustment triggers after each item completes (hit, miss, or reached bottom) -- continuous, not batched
- **D-07:** Dead zone around target: if rolling accuracy is 60-80%, hold parameters steady. Below 60% -> ease difficulty. Above 80% -> ramp difficulty
- **D-08:** Easing is 2x faster than ramping -- if a ramp step adds +5 px/s fall speed, an ease step subtracts -10 px/s
- **D-09:** Each adjustment step is small and incremental -- speed changes ~5 px/s per step, spawn interval changes ~100-200ms per step
- **D-10:** Floor and ceiling clamps prevent parameters from going outside defined ranges (D-02, D-03)
- **D-11:** Word length adapts separately from speed/spawn: rolling accuracy > 80% for 5+ items unlocks medium words (5-6 letters). Accuracy dropping below 50% reverts to short words only
- **D-12:** Letter row progression uses same rolling accuracy: > 80% adds next row, < 50% removes last-added row. This replaces the Phase 3 session-progress-percentage thresholds
- **D-13:** Difficulty resets to baseline each session -- no persistence between sessions
- **D-14:** Session length remains fixed (20 letters / 15 words)
- **D-15:** A difficulty level indicator is not shown to the child. Debug overlay (F3) shows current difficulty parameters for developer verification
- **D-16:** New file `src/game/difficulty.ts` containing a `DifficultyManager` class
- **D-17:** DifficultyManager is pure logic, no PixiJS dependency -- fully unit-testable
- **D-18:** PlayingState reads difficulty parameters from DifficultyManager each tick instead of using fixed constants. DifficultyManager is created per session and discarded on exit
- **D-19:** GameContext extended with `getDifficulty()` method so debug overlay can display current parameters

### Claude's Discretion
- Exact step sizes for each parameter adjustment (within the 2x asymmetry constraint)
- Rolling window implementation details (circular buffer, array slice, etc.)
- Whether to use linear interpolation or stepped values for parameter changes
- Debug overlay format for difficulty display
- Exact accuracy thresholds for complexity unlocks (suggested 80%/50% are starting points)

### Deferred Ideas (OUT OF SCOPE)
- Persistent difficulty levels across sessions (Phase 6)
- Per-letter accuracy tracking (v2 ADV-02)
- Difficulty presets per age group
- Visual feedback on difficulty changes (Phase 8)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DIFF-01 | La vitesse de chute s'ajuste automatiquement selon la performance de l'enfant | DifficultyManager.fallSpeed property, updated on each recordResult() call based on rolling accuracy vs dead zone thresholds |
| DIFF-02 | La longueur/complexite des mots s'adapte au niveau de l'enfant | DifficultyManager.complexityLevel property controls which letter rows / word lengths are available; refactored getAvailableLetters/getAvailableWords accept accuracy |
| DIFF-03 | Le taux d'apparition des lettres/mots s'adapte a la performance en temps reel | DifficultyManager.spawnInterval property, adjusted alongside fallSpeed with same dead zone logic |
| DIFF-04 | Le systeme vise un taux de reussite d'environ 70% pour maintenir l'etat de flow | Dead zone 60-80% centers on 70%; asymmetric 2x easing vs ramping naturally converges toward ~70% success rate |
</phase_requirements>

## Architecture Patterns

### DifficultyManager Class Design

The class follows the same pure-logic pattern as `tween.ts`, `letters.ts`, and `words.ts` -- no PixiJS imports, fully testable with plain objects.

```typescript
// src/game/difficulty.ts

export interface DifficultyParams {
  readonly fallSpeed: number
  readonly spawnInterval: number
  readonly complexityLevel: number // 0 = base, 1 = +top/medium, 2 = +bottom/all
}

export interface DifficultyConfig {
  readonly mode: 'letters' | 'words'
  // Speed bounds
  readonly minFallSpeed: number
  readonly maxFallSpeed: number
  readonly baseFallSpeed: number
  // Spawn bounds
  readonly minSpawnInterval: number
  readonly maxSpawnInterval: number
  readonly baseSpawnInterval: number
  // Step sizes
  readonly speedStep: number
  readonly spawnStep: number
  // Thresholds
  readonly deadZoneLow: number   // 0.6
  readonly deadZoneHigh: number  // 0.8
  readonly windowSize: number    // 10
}

export class DifficultyManager {
  private window: boolean[] = []   // true = hit, false = miss
  private _fallSpeed: number
  private _spawnInterval: number
  private _complexityLevel: number = 0
  private consecutiveHighAccuracy: number = 0

  constructor(private config: DifficultyConfig) { ... }

  /** Called after each item completes (hit, miss, or reached bottom). */
  recordResult(hit: boolean): void { ... }

  get params(): DifficultyParams { ... }
  get rollingAccuracy(): number { ... }
  get windowFull(): boolean { ... }
}
```

**Key design points:**
- `recordResult(hit)` is the single entry point. It pushes to the rolling window, calculates accuracy, and adjusts all three parameters
- Parameters are read-only from outside via the `params` getter
- The window is a simple array with shift/push (size 10, not worth a circular buffer for this scale)
- `consecutiveHighAccuracy` tracks how many consecutive items had >80% accuracy for the complexity unlock threshold (D-11: "5+ items")

### Recommended Step Sizes

Based on the parameter ranges and desired gradual feel (D-09):

| Parameter | Ramp Step (accuracy > 80%) | Ease Step (accuracy < 60%) | Rationale |
|-----------|---------------------------|---------------------------|-----------|
| Fall speed | +5 px/s | -10 px/s | Range is ~110 px/s (letters). 5px steps = ~22 adjustments to traverse full range. At 10 items/window, that's 220 items -- far more than a 20-item session. Prevents runaway |
| Spawn interval | -150 ms (faster spawning) | +300 ms (slower spawning) | Range is ~2200ms (letters). Similar gradual traversal. Note: LOWER interval = HARDER, so ramp DECREASES and ease INCREASES |

Note the inversion for spawn interval: harder = shorter interval, so ramping (making it harder) subtracts from the interval, while easing (making it easier) adds to it.

### Complexity Level State Machine

```
Level 0 (base):  HOME_ROW only / short words only
  -> Level 1:    when rollingAccuracy > 0.80 for 5+ consecutive items
Level 1:         HOME_ROW + TOP_ROW / short + medium words
  -> Level 2:    when rollingAccuracy > 0.80 for 5+ more consecutive items
  -> Level 0:    when rollingAccuracy < 0.50
Level 2:         ALL ROWS / all words (letters only; words max at level 1)
  -> Level 1:    when rollingAccuracy < 0.50
```

The "5+ consecutive items" counter resets whenever accuracy leaves the >80% zone. This prevents flickering between levels.

### Integration Pattern: PlayingState Changes

Current code reads fixed constants:
```typescript
// BEFORE (current)
const fallSpeed = this.mode === 'words' ? this.WORD_FALL_SPEED : this.FALL_SPEED
```

After integration:
```typescript
// AFTER
const { fallSpeed, spawnInterval } = this.difficulty.params
```

The DifficultyManager is instantiated in `PlayingState.enter()` and `recordResult()` is called at each of three event points:
1. Letter/word hit (in `_processLetterInput` / `_processWordInput`)
2. Letter/word miss (same methods)
3. Item reaches bottom (in the bottom detection loop)

### Refactoring getAvailableLetters / getAvailableWords

These functions currently take `(progress, total)` and compute a ratio internally. Phase 5 changes the signature:

```typescript
// BEFORE
export function getAvailableLetters(progress: number, total: number): readonly string[]

// AFTER
export function getAvailableLetters(complexityLevel: number): readonly string[]
```

The complexity level is a simple integer (0, 1, 2) mapped to which rows are available. This is cleaner than passing accuracy directly because the DifficultyManager owns the threshold logic.

Same pattern for `getAvailableWords`:
```typescript
// BEFORE
export function getAvailableWords(wordLists: WordLists, progress: number, total: number): readonly string[]

// AFTER
export function getAvailableWords(wordLists: WordLists, complexityLevel: number): readonly string[]
```

### GameContext Extension

```typescript
// In types.ts, add to GameContext interface:
export interface GameContext {
  // ... existing methods ...
  getDifficulty(): DifficultyParams | null  // null when not in playing state
}
```

### Debug Overlay Extension

The `DebugOverlay.update()` method currently takes `(fps, state, poolActive, poolTotal)`. Extend with an optional difficulty parameter:

```typescript
update(
  fps: number,
  state: string,
  poolActive: number,
  poolTotal: number,
  difficulty?: DifficultyParams | null,
): void {
  // ... existing lines ...
  if (difficulty) {
    lines.push(`<div>Speed: ${difficulty.fallSpeed.toFixed(0)} px/s</div>`)
    lines.push(`<div>Spawn: ${difficulty.spawnInterval.toFixed(0)} ms</div>`)
    lines.push(`<div>Complexity: ${difficulty.complexityLevel}</div>`)
  }
}
```

### Anti-Patterns to Avoid
- **Coupling DifficultyManager to PixiJS:** The class must never import from pixi.js. It receives primitives and returns primitives
- **Adjusting parameters on every frame:** Adjustments happen on item completion events only, not per-tick. Per-tick would cause micro-jitter and waste cycles
- **Storing accuracy as integer percentage:** Use floating point 0.0-1.0 internally. Integer rounding creates dead zones at boundaries

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Clamping | Custom min/max logic scattered everywhere | `Math.max(min, Math.min(max, value))` in one utility or inline | Prevents off-by-one at boundaries |

This phase has no external dependency needs. Everything is pure arithmetic and array operations.

## Common Pitfalls

### Pitfall 1: Spawn Interval Direction Confusion
**What goes wrong:** Coding "increase spawn interval" as making the game harder, when it actually makes it easier (longer wait between spawns)
**Why it happens:** "Increase" feels like "more", but higher interval = slower spawn = easier
**How to avoid:** Comment the direction explicitly in the adjustment code. Ramp (harder) DECREASES spawnInterval. Ease (easier) INCREASES spawnInterval
**Warning signs:** Game gets easier when accuracy is high

### Pitfall 2: Adjustments Before Window is Full
**What goes wrong:** Dividing by window.length when it's 0, or making adjustments based on 1-2 data points that wildly swing parameters
**Why it happens:** Forgetting the "no adjustments until window is full" rule (D-05)
**How to avoid:** Guard `recordResult` with `if (this.window.length < this.config.windowSize) return` after pushing but before adjusting
**Warning signs:** Parameters change erratically at session start

### Pitfall 3: Complexity Oscillation
**What goes wrong:** Child hits 81% accuracy, unlocks medium words, immediately struggles with harder words, drops to 49%, reverts to easy, quickly climbs back to 81%, unlocks again -- oscillating rapidly
**Why it happens:** The unlock/revert thresholds are too close, or there's no hysteresis
**How to avoid:** The "5+ consecutive items at >80%" requirement (D-11) provides hysteresis for unlocking. The revert threshold (50%) is far below the unlock threshold (80%), creating a wide band. Additionally, the consecutive counter resets on any dip below 80%, so the child truly needs sustained high accuracy
**Warning signs:** Debug overlay shows complexityLevel flickering between values

### Pitfall 4: Breaking Existing Tests
**What goes wrong:** Changing `getAvailableLetters(progress, total)` signature breaks 4 existing tests in `letters.test.ts` and the callers in `states.ts`
**Why it happens:** Function signature change is a coordinated refactor
**How to avoid:** Update tests alongside function changes in the same task. The test changes are simple: replace `getAvailableLetters(8, 20)` with `getAvailableLetters(1)` (complexity level 1)
**Warning signs:** `pnpm test` fails after refactoring letters.ts

### Pitfall 5: Not Counting "Reached Bottom" as Miss
**What goes wrong:** Items that fall off screen don't feed into the rolling window, so accuracy is inflated (only counting typed interactions)
**Why it happens:** The bottom detection code in PlayingState currently just triggers a tween; it doesn't increment misses or notify DifficultyManager
**How to avoid:** In the bottom detection loop, call `this.difficulty.recordResult(false)` and increment `this.misses++` for items reaching the bottom. Currently, bottom items are silently removed without counting as misses -- this must change for accurate difficulty tracking
**Warning signs:** Accuracy stays artificially high even when child ignores falling items

### Pitfall 6: Word Mode Hit Granularity
**What goes wrong:** In word mode, each keystroke is a hit/miss. A 4-letter word generates 4 hits on success. If DifficultyManager counts each keystroke as a result, the window of 10 "items" is actually 10 keystrokes, not 10 words
**Why it happens:** The current code increments `this.hits` per correct keystroke in word mode
**How to avoid:** Record result to DifficultyManager only on word completion (hit tween) or word reaching bottom (miss), not on individual keystrokes. The per-keystroke hits/misses count stays for the score display, but DifficultyManager gets word-level events only
**Warning signs:** Window fills after 2-3 words instead of 10

## Code Examples

### Rolling Window Implementation

```typescript
// Simple array-based rolling window (size 10)
private window: boolean[] = []

recordResult(hit: boolean): void {
  this.window.push(hit)
  if (this.window.length > this.config.windowSize) {
    this.window.shift()
  }

  // No adjustments until window is full
  if (this.window.length < this.config.windowSize) return

  const accuracy = this.window.filter(Boolean).length / this.window.length
  this.adjust(accuracy)
}
```

### Asymmetric Adjustment

```typescript
private adjust(accuracy: number): void {
  if (accuracy > this.config.deadZoneHigh) {
    // Ramp: make harder (small step)
    this._fallSpeed = Math.min(
      this.config.maxFallSpeed,
      this._fallSpeed + this.config.speedStep,
    )
    this._spawnInterval = Math.max(
      this.config.minSpawnInterval,
      this._spawnInterval - this.config.spawnStep,
    )
    this.updateComplexity(accuracy)
  } else if (accuracy < this.config.deadZoneLow) {
    // Ease: make easier (2x step)
    this._fallSpeed = Math.max(
      this.config.minFallSpeed,
      this._fallSpeed - this.config.speedStep * 2,
    )
    this._spawnInterval = Math.min(
      this.config.maxSpawnInterval,
      this._spawnInterval + this.config.spawnStep * 2,
    )
    this.updateComplexity(accuracy)
  }
  // Dead zone (60-80%): no change
}
```

### Default Configs Per Mode

```typescript
export const LETTER_DIFFICULTY_CONFIG: DifficultyConfig = {
  mode: 'letters',
  minFallSpeed: 40,
  maxFallSpeed: 150,
  baseFallSpeed: 80,
  minSpawnInterval: 800,
  maxSpawnInterval: 3000,
  baseSpawnInterval: 1500,
  speedStep: 5,
  spawnStep: 150,
  deadZoneLow: 0.6,
  deadZoneHigh: 0.8,
  windowSize: 10,
}

export const WORD_DIFFICULTY_CONFIG: DifficultyConfig = {
  mode: 'words',
  minFallSpeed: 25,
  maxFallSpeed: 100,
  baseFallSpeed: 50,
  minSpawnInterval: 1500,
  maxSpawnInterval: 4000,
  baseSpawnInterval: 2500,
  speedStep: 5,
  spawnStep: 150,
  deadZoneLow: 0.6,
  deadZoneHigh: 0.8,
  windowSize: 10,
}
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | `vite.config.ts` (inline test config) |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run --reporter=verbose` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIFF-01 | Fall speed adjusts based on rolling accuracy | unit | `pnpm vitest run tests/game/difficulty.test.ts -t "fall speed"` | Wave 0 |
| DIFF-02 | Complexity level changes based on sustained accuracy | unit | `pnpm vitest run tests/game/difficulty.test.ts -t "complexity"` | Wave 0 |
| DIFF-03 | Spawn interval adjusts based on rolling accuracy | unit | `pnpm vitest run tests/game/difficulty.test.ts -t "spawn interval"` | Wave 0 |
| DIFF-04 | System converges toward ~70% via asymmetric adjustment | unit | `pnpm vitest run tests/game/difficulty.test.ts -t "convergence"` | Wave 0 |
| DIFF-01/03 | Dead zone holds parameters steady at 60-80% | unit | `pnpm vitest run tests/game/difficulty.test.ts -t "dead zone"` | Wave 0 |
| DIFF-01 | Easing is 2x faster than ramping | unit | `pnpm vitest run tests/game/difficulty.test.ts -t "asymmetric"` | Wave 0 |
| Integration | PlayingState uses DifficultyManager params | unit | `pnpm vitest run tests/game/states.test.ts` | Exists (update needed) |
| Refactor | getAvailableLetters accepts complexityLevel | unit | `pnpm vitest run tests/game/letters.test.ts` | Exists (update needed) |
| Refactor | getAvailableWords accepts complexityLevel | unit | `pnpm vitest run tests/game/words.test.ts` | Exists (update needed) |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/game/difficulty.test.ts` -- covers DIFF-01, DIFF-02, DIFF-03, DIFF-04 (new file)
- [ ] Update `tests/game/letters.test.ts` -- adapt to new `getAvailableLetters(complexityLevel)` signature
- [ ] Update `tests/game/words.test.ts` -- adapt to new `getAvailableWords(wordLists, complexityLevel)` signature

## Project Constraints (from CLAUDE.md)

- **No backend:** All logic client-side, pure TypeScript
- **Performance:** Animations fluide even on modest machines; DifficultyManager does minimal work (array push/shift + arithmetic on item completion only, not per frame)
- **Vitest** for testing, inline config in vite.config.ts
- **pnpm** as package manager
- **TypeScript strict mode** with noUncheckedIndexedAccess
- **ESLint strict** with naming conventions (UPPER_CASE for constants allowed)
- **Pre-commit hooks** validate code; do not run formatters manually
- **No tests unless explicitly asked** (but nyquist_validation is enabled for this phase, so test gaps are identified for Wave 0)
- **PixiJS 8** for rendering; DifficultyManager must NOT import pixi.js
- **event.key** (not event.code) for AZERTY safety
- **No em dashes or en dashes** in any output

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/game/states.ts`, `src/game/letters.ts`, `src/game/words.ts`, `src/game/types.ts`, `src/game/debug.ts`, `src/game/game.ts` -- direct code reading
- Existing tests: `tests/game/letters.test.ts`, `tests/game/words.test.ts` -- test pattern reference
- Phase 05 CONTEXT.md -- 19 locked decisions with specific parameter ranges

### Secondary (MEDIUM confidence)
- Step sizes (5 px/s, 150ms) -- derived from parameter ranges and session length constraints. These are starting points subject to playtesting calibration

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure TypeScript
- Architecture: HIGH -- follows established codebase patterns (pure logic modules), all integration points identified in existing code
- Pitfalls: HIGH -- identified through direct code analysis of current hit/miss counting, bottom detection, and word-mode keystroke granularity

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable; no external dependencies to go stale)
