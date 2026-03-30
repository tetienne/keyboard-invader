# Phase 2: Game Engine Foundation - Research

**Researched:** 2026-03-30
**Domain:** PixiJS v8 game loop, state machine, input handling, object pooling, canvas scaling
**Confidence:** HIGH

## Summary

Phase 2 builds the game engine backbone: a fixed-timestep game loop driven by PixiJS's built-in Ticker, a finite state machine managing four states (Boot, Menu, Playing, Paused), keyboard input capture with AZERTY safety, object pooling for falling entities, and 16:9 letterboxed canvas scaling. All code goes into `src/game/` with one file per system.

PixiJS v8.17.1 (already installed) provides the Ticker class with `deltaTime`, `deltaMS`, and `elapsedMS` properties -- but it does NOT provide a built-in fixed-timestep accumulator. The fixed timestep must be implemented manually on top of the Ticker's variable `elapsedMS`. PixiJS also has NO built-in letterbox option in its ApplicationOptions -- letterboxing requires manual resize logic with a scaled root Container.

**Primary recommendation:** Implement a thin game loop layer on top of `app.ticker` that accumulates `elapsedMS`, runs fixed-step updates, and caps catch-up ticks. Use a manual resize handler (not `resizeTo: window`) to maintain 16:9 with letterbox bars.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: Fixed timestep at 60 ticks/sec, driven by PixiJS's built-in app.ticker
- D-02: No render interpolation
- D-03: Cap catch-up ticks (max ~3 per frame) to prevent spiral-of-death
- D-04: State classes with enter()/exit()/update()/render() methods -- one class per state (Boot, Menu, Playing, Paused)
- D-05: Validated transitions -- define allowed state transitions, throw errors in dev on invalid transitions
- D-06: Flat states for now -- no sub-states
- D-07: Menu state shows placeholder with 'Play' button (game title + clickable text)
- D-08: Ignore key repeats -- only process initial keydown, filter out event.repeat
- D-09: Buffer inputs per frame -- queue keydown events, process once per game tick
- D-10: Lowercase + basic normalization -- normalize to lowercase, ignore modifier combos
- D-11: Global capture, state-based filtering -- one keyboard listener, each state decides which keys to process
- D-12: Pre-allocate small + grow on demand -- start with ~20 entities, grow if needed, never shrink
- D-13: Pool falling entities only in Phase 2
- D-14: Full window with fixed aspect ratio (16:9) -- letterboxing if window aspect doesn't match
- D-15: 1280x720 base resolution for the game coordinate system
- D-16: Reset time accumulator on tab return -- no catch-up burst
- D-17: Pause on blur (window.blur event), not just tab visibility
- D-18: Debug overlay showing FPS, current game state, and object pool stats, toggled with F3
- D-19: Debug overlay rendered as HTML DOM overlay (not PixiJS)
- D-20: Playing state demonstrates with falling placeholder objects (colored rectangles) destroyable by pressing any key
- D-21: One file per system in src/game/: loop.ts, states.ts, input.ts, pool.ts, canvas.ts with index.ts barrel export
- D-22: Central Game class owns PixiJS app, state machine, input manager, and pool
- D-23: Game-specific types in src/game/types.ts

### Claude's Discretion
- Exact object pool implementation details (data structure, recycling mechanism)
- PixiJS ticker configuration specifics (maxFPS, priority)
- State transition map specifics (exact allowed transitions beyond the obvious ones)
- Debug overlay styling and positioning
- Placeholder object visual style (shape, colors, size)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 (partial) | L'enfant voit des lettres/mots tomber du haut de l'ecran et tape pour les eliminer | Rendering infrastructure: PixiJS Application + Ticker for game loop, Graphics for falling rectangles, object pooling for entity management, keyboard input capture. Actual letter/word content deferred to Phase 3. |
| AV-04 | Les animations sont fluides (60fps) meme sur machines modestes | Fixed-timestep at 60 ticks/sec via Ticker.elapsedMS accumulator, object pooling to avoid GC pauses, Graphics context reuse pattern, capped catch-up ticks to prevent frame spikes |

</phase_requirements>

## Standard Stack

### Core (already installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pixi.js | 8.17.1 | 2D WebGL/Canvas rendering, Ticker, scene graph | Already in package.json, v8 has BitmapText, Graphics context reuse, modern GPU pipeline |
| TypeScript | 6.0.2 | Type safety for game state, interfaces | Already configured with strict mode |
| Vite | 8.0.3 | Dev server, HMR, build | Already configured |
| Vitest | 4.1.2 | Unit testing for game logic | Already configured inline in vite.config.ts |

### No New Dependencies Needed

Phase 2 requires zero new npm packages. Everything is built with:
- PixiJS Ticker for the game loop
- PixiJS Graphics + Container for rendering
- PixiJS BitmapText for menu text
- Native `KeyboardEvent` API for input
- Native `document.visibilitychange` and `window.blur/focus` for pause
- DOM elements for debug overlay

## Architecture Patterns

### Recommended Project Structure (from D-21)

```
src/
  game/
    types.ts        # Game-specific type definitions
    canvas.ts       # Canvas sizing, letterboxing, resize handler
    loop.ts         # Fixed-timestep game loop wrapping app.ticker
    states.ts       # State machine + state class definitions (Boot, Menu, Playing, Paused)
    input.ts        # Keyboard input capture, buffering, normalization
    pool.ts         # Generic object pool for falling entities
    index.ts        # Barrel export
  main.ts           # Entry point -- instantiates Game, starts boot
  shared/
    types/index.ts  # Cross-cutting types (already exists)
```

### Pattern 1: Fixed-Timestep Accumulator on PixiJS Ticker

**What:** PixiJS Ticker fires on every `requestAnimationFrame` with variable timing. We accumulate `elapsedMS` and consume it in fixed 16.67ms steps (60Hz).

**When to use:** Always -- this is the core game loop pattern (D-01, D-02, D-03).

**Example:**
```typescript
// Source: Gaffer on Games "Fix Your Timestep" + PixiJS Ticker API
const TICK_MS = 1000 / 60  // ~16.667ms
const MAX_CATCH_UP = 3

let accumulator = 0

app.ticker.add((ticker) => {
  accumulator += ticker.elapsedMS

  let ticks = 0
  while (accumulator >= TICK_MS && ticks < MAX_CATCH_UP) {
    currentState.update(TICK_MS)
    accumulator -= TICK_MS
    ticks++
  }

  // Drop excess accumulated time (D-03: prevent spiral of death)
  if (accumulator >= TICK_MS) {
    accumulator = 0
  }

  currentState.render()
})
```

**Key Ticker properties:**
- `ticker.elapsedMS` -- raw milliseconds elapsed (uncapped, unscaled). Use this for the accumulator.
- `ticker.deltaTime` -- dimensionless scalar (1.0 at target FPS). Do NOT use for fixed timestep.
- `ticker.deltaMS` -- capped/scaled milliseconds. Do NOT use for fixed timestep.
- `ticker.FPS` -- current FPS (read-only). Use for debug overlay.

### Pattern 2: State Machine with Validated Transitions

**What:** Each state is a class with `enter()`, `exit()`, `update(dt)`, `render()`. A transition map defines valid source->target pairs.

**When to use:** All state changes go through the state machine (D-04, D-05).

**Example:**
```typescript
interface GameState {
  enter(game: Game): void
  exit(game: Game): void
  update(game: Game, dt: number): void
  render(game: Game): void
}

type StateName = 'boot' | 'menu' | 'playing' | 'paused'

const TRANSITIONS: Record<StateName, StateName[]> = {
  boot: ['menu'],
  menu: ['playing'],
  playing: ['paused', 'menu'],
  paused: ['playing', 'menu'],
}
```

### Pattern 3: Letterboxing via Scaled Root Container

**What:** PixiJS v8 has NO built-in letterbox option. Instead: set the Application to a fixed size (1280x720), listen for window resize, compute scale factor to fit while maintaining 16:9, apply scale + offset to a root game container, and fill background with black for letterbox bars.

**When to use:** Canvas initialization and every window resize (D-14, D-15).

**Example:**
```typescript
// Source: Community pattern, verified against PixiJS v8 API
// Do NOT use resizeTo: window (it stretches without aspect ratio preservation)

const BASE_WIDTH = 1280
const BASE_HEIGHT = 720

function resize(app: Application, gameContainer: Container): void {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight

  const scale = Math.min(
    screenWidth / BASE_WIDTH,
    screenHeight / BASE_HEIGHT,
  )

  gameContainer.scale.set(scale)
  gameContainer.x = (screenWidth - BASE_WIDTH * scale) / 2
  gameContainer.y = (screenHeight - BASE_HEIGHT * scale) / 2

  app.renderer.resize(screenWidth, screenHeight)
}
```

### Pattern 4: Input Buffer Queue

**What:** A single global `keydown` listener pushes events into a queue. Each game tick drains the queue and passes keys to the current state.

**When to use:** All keyboard input (D-08, D-09, D-10, D-11).

**Example:**
```typescript
const inputBuffer: string[] = []

function onKeyDown(event: KeyboardEvent): void {
  if (event.repeat) return           // D-08: ignore repeats
  if (event.ctrlKey || event.altKey || event.metaKey) return  // D-10: ignore modifiers

  const key = event.key.toLowerCase()  // D-10: normalize
  inputBuffer.push(key)
}

// Called once per game tick
function drainInputs(): string[] {
  const keys = [...inputBuffer]
  inputBuffer.length = 0
  return keys
}
```

**AZERTY safety:** Using `event.key` (not `event.code`) ensures the character the user intended is captured regardless of keyboard layout. On AZERTY, pressing the physical A key produces `event.key = 'q'` with `event.code = 'KeyA'`. Since we want the typed character, `event.key` is correct.

### Pattern 5: Object Pool with Grow-on-Demand

**What:** Pre-allocate a fixed number of entities. When all are active, grow the pool. Never shrink. Reuse by toggling `visible` and resetting position.

**When to use:** Falling placeholder objects in Playing state (D-12, D-13).

**Example:**
```typescript
// Pool uses PixiJS Graphics objects with pre-built GraphicsContext
class ObjectPool<T> {
  private readonly items: T[] = []
  private readonly active: Set<number> = new Set()

  constructor(
    private readonly factory: () => T,
    initialSize: number = 20,
  ) {
    for (let i = 0; i < initialSize; i++) {
      this.items.push(factory())
    }
  }

  acquire(): { item: T; index: number } {
    // Find first inactive
    for (let i = 0; i < this.items.length; i++) {
      if (!this.active.has(i)) {
        this.active.add(i)
        return { item: this.items[i]!, index: i }
      }
    }
    // Grow (D-12)
    const index = this.items.length
    const item = this.factory()
    this.items.push(item)
    this.active.add(index)
    return { item, index }
  }

  release(index: number): void {
    this.active.delete(index)
  }

  get activeCount(): number { return this.active.size }
  get totalCount(): number { return this.items.length }
}
```

### Pattern 6: Graphics Context Reuse

**What:** PixiJS v8 Graphics objects build geometry into a `GraphicsContext`. For pooled objects of the same shape, share a single `GraphicsContext` across all instances instead of rebuilding per object.

**When to use:** Pooled falling rectangles (performance optimization).

**Example:**
```typescript
// Source: PixiJS v8 Graphics guide
import { Graphics, GraphicsContext } from 'pixi.js'

// Build once
const rectContext = new GraphicsContext()
  .rect(0, 0, 40, 40)
  .fill(0xe94560)

// Reuse across pool
function createPooledGraphic(): Graphics {
  return new Graphics(rectContext)
}
```

### Anti-Patterns to Avoid

- **Using `resizeTo: window`:** Stretches canvas without preserving aspect ratio. Use manual resize handler instead.
- **Using `ticker.deltaTime` for fixed timestep:** `deltaTime` is a dimensionless scalar, not milliseconds. Use `ticker.elapsedMS`.
- **Using `ticker.deltaMS` for accumulator:** `deltaMS` is capped by minFPS and scaled by speed. Use raw `elapsedMS`.
- **Rebuilding Graphics every frame:** Graphics builds geometry into GPU buffers. Rebuild only when shape changes. For pooled identical objects, share a GraphicsContext.
- **Using `event.code` for typing games:** `event.code` returns the physical key position, not the typed character. On AZERTY keyboards, this produces wrong letters.
- **Adding children to Graphics/Sprite:** In PixiJS v8, only Container can have children. Sprite, Graphics, etc. are leaf nodes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Animation frame scheduling | Custom rAF loop | PixiJS Ticker (app.ticker) | Handles tab visibility, priority system, proper timing |
| WebGL/Canvas rendering | Raw Canvas 2D or WebGL | PixiJS Application + stage | GPU-accelerated, scene graph, automatic batching |
| Text rendering on canvas | Canvas 2D fillText | PixiJS BitmapText | Pre-rasterized glyphs, no per-frame text measurement |
| Event system for display objects | Custom hit testing | PixiJS eventMode + pointer events | Built-in hit testing, propagation, cursor management |

**Key insight:** PixiJS v8 provides the rendering, scene graph, and frame scheduling. We only hand-build the fixed-timestep wrapper, state machine, input buffer, object pool, and letterbox scaler -- all are thin layers (~50-100 lines each) on top of PixiJS primitives.

## Common Pitfalls

### Pitfall 1: Spiral of Death in Fixed Timestep
**What goes wrong:** If the game can't keep up (slow device, debugger attached), accumulated time grows unbounded, causing more and more catch-up ticks per frame, making it even slower.
**Why it happens:** Each catch-up tick takes real time, creating a feedback loop.
**How to avoid:** Cap catch-up ticks at 3 per frame (D-03). Drop excess accumulated time.
**Warning signs:** FPS counter shows values well below 60, debug overlay shows increasing pool active count.

### Pitfall 2: Tab Switch Time Bomb
**What goes wrong:** User switches to another tab for 30 seconds, returns, and the accumulator has 30 seconds of game time to process.
**Why it happens:** `requestAnimationFrame` pauses in background tabs, but `elapsedMS` on the first frame back reports the full elapsed time.
**How to avoid:** Reset the accumulator to 0 on visibility change / focus return (D-16). Listen to both `visibilitychange` AND `blur/focus` (D-17).
**Warning signs:** Game "fast-forwards" when returning to tab.

### Pitfall 3: Key Event Repeat Flood
**What goes wrong:** Holding a key down floods the input buffer with repeated events, causing rapid-fire destruction of entities.
**Why it happens:** Browsers fire repeated keydown events when holding a key (OS key repeat).
**How to avoid:** Filter `event.repeat === true` in the keydown handler (D-08).
**Warning signs:** Single key press destroys multiple entities.

### Pitfall 4: PixiJS v8 Application Init is Async
**What goes wrong:** Attempting to access `app.stage` or `app.ticker` before `await app.init()` completes.
**Why it happens:** PixiJS v8 changed Application to require async initialization (unlike v7 which was synchronous).
**How to avoid:** Always `await app.init({...})` before any other operations. Structure the Boot state to handle this.
**Warning signs:** Errors about undefined properties on Application.

### Pitfall 5: Graphics Destroy Leaks
**What goes wrong:** Removing Graphics from stage without calling `.destroy()` leaks GPU resources.
**Why it happens:** PixiJS doesn't auto-destroy removed children.
**How to avoid:** For pooled objects, don't destroy -- toggle `visible = false` and reset position. Only destroy on pool teardown. Shared GraphicsContext must be destroyed separately.
**Warning signs:** Increasing GPU memory in DevTools.

### Pitfall 6: Resize Listener Without Cleanup
**What goes wrong:** Multiple resize listeners accumulate if the game reinitializes.
**Why it happens:** Adding `window.addEventListener('resize', ...)` without removing on teardown.
**How to avoid:** Store the listener reference and remove it in the Game's destroy method.
**Warning signs:** Resize handler fires multiple times per event.

## Code Examples

### PixiJS v8 Application Initialization (verified pattern)

```typescript
// Source: PixiJS v8 API docs + existing src/main.ts pattern
import { Application, Container } from 'pixi.js'

const app = new Application()

await app.init({
  background: '#1a1a2e',
  width: window.innerWidth,
  height: window.innerHeight,
  // Do NOT use resizeTo: window (breaks letterboxing)
  // autoDensity: true + resolution for HiDPI (optional, can add later)
})

const container = document.getElementById('game-container')!
container.appendChild(app.canvas)

// Root game container for letterbox scaling
const gameRoot = new Container()
app.stage.addChild(gameRoot)
```

### PixiJS v8 Interactive BitmapText (menu button)

```typescript
// Source: PixiJS v8 Events guide
import { BitmapFont, BitmapText } from 'pixi.js'

BitmapFont.install({
  name: 'GameFont',
  style: { fontFamily: 'Arial', fontSize: 48, fill: '#ffffff' },
})

const playButton = new BitmapText({
  text: 'Jouer',
  style: { fontFamily: 'GameFont', fontSize: 24 },
})
playButton.eventMode = 'static'
playButton.cursor = 'pointer'
playButton.on('pointertap', () => {
  game.stateMachine.transition('playing')
})
```

### Pause Overlay (PixiJS Graphics + BitmapText)

```typescript
// Source: UI-SPEC layout contract
import { Container, Graphics, BitmapText } from 'pixi.js'

function createPauseOverlay(width: number, height: number): Container {
  const overlay = new Container()

  const bg = new Graphics()
    .rect(0, 0, width, height)
    .fill({ color: 0x000000, alpha: 0.5 })
  overlay.addChild(bg)

  const text = new BitmapText({
    text: 'PAUSE',
    style: { fontFamily: 'GameFont', fontSize: 48 },
  })
  text.x = width / 2 - text.width / 2
  text.y = height / 2 - text.height / 2
  overlay.addChild(text)

  overlay.visible = false
  return overlay
}
```

### Debug Overlay (DOM, not PixiJS -- D-19)

```typescript
// HTML element for debug overlay, toggled with F3
function createDebugOverlay(): HTMLDivElement {
  const el = document.createElement('div')
  el.id = 'debug-overlay'
  el.style.cssText = `
    position: fixed;
    top: 16px;
    left: 16px;
    background: rgba(22, 33, 62, 0.85);
    color: #a0aec0;
    font-family: monospace;
    font-size: 14px;
    padding: 8px;
    border-radius: 4px;
    z-index: 1000;
    display: none;
    pointer-events: none;
  `
  document.body.appendChild(el)
  return el
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PixiJS constructor options | `await app.init({...})` async | v8.0.0 (2024) | Must await before using app |
| Sprite/Graphics can have children | Only Container can have children | v8.0.0 (2024) | Wrap leaf nodes in Container for hierarchies |
| `interactive = true` | `eventMode = 'static'` | v7.2+ | New property name, more granular control |
| PIXI global namespace | Named imports from 'pixi.js' | v8.0.0 (2024) | Tree-shakeable, no global |
| Graphics immediate mode | GraphicsContext (retained mode) | v8.0.0 (2024) | Context can be shared/swapped for performance |

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vite.config.ts (inline test config) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AV-04 | 60fps game loop runs fixed timestep | unit | `pnpm vitest run tests/game/loop.test.ts -t "fixed timestep"` | Wave 0 |
| AV-04 | Catch-up ticks capped at 3 | unit | `pnpm vitest run tests/game/loop.test.ts -t "catch-up"` | Wave 0 |
| GAME-01 | Object pool acquires and releases entities | unit | `pnpm vitest run tests/game/pool.test.ts` | Wave 0 |
| GAME-01 | Object pool grows on demand | unit | `pnpm vitest run tests/game/pool.test.ts -t "grow"` | Wave 0 |
| D-04 | State machine transitions between valid states | unit | `pnpm vitest run tests/game/states.test.ts -t "transition"` | Wave 0 |
| D-05 | Invalid state transitions throw errors | unit | `pnpm vitest run tests/game/states.test.ts -t "invalid"` | Wave 0 |
| D-08 | Input ignores key repeats | unit | `pnpm vitest run tests/game/input.test.ts -t "repeat"` | Wave 0 |
| D-09 | Input buffers and drains per tick | unit | `pnpm vitest run tests/game/input.test.ts -t "buffer"` | Wave 0 |
| D-10 | Input normalizes to lowercase, ignores modifiers | unit | `pnpm vitest run tests/game/input.test.ts -t "normalize"` | Wave 0 |
| D-14 | Canvas scales to 16:9 with letterbox | unit | `pnpm vitest run tests/game/canvas.test.ts -t "letterbox"` | Wave 0 |
| D-16 | Accumulator resets on visibility change | unit | `pnpm vitest run tests/game/loop.test.ts -t "visibility"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test && pnpm typecheck && pnpm lint`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/game/loop.test.ts` -- fixed timestep accumulator, catch-up cap, visibility reset
- [ ] `tests/game/states.test.ts` -- state transitions, valid/invalid, enter/exit calls
- [ ] `tests/game/input.test.ts` -- key repeat filtering, modifier filtering, buffer drain
- [ ] `tests/game/pool.test.ts` -- acquire, release, grow on demand, count tracking
- [ ] `tests/game/canvas.test.ts` -- letterbox scaling math (pure function, no DOM needed)

Note: Game logic (state machine, input buffer, object pool, scaling math) is fully unit-testable without PixiJS or DOM. Extract pure logic from PixiJS-coupled code. The Ticker-dependent loop can be tested by injecting mock elapsed times.

## Open Questions

1. **HiDPI / devicePixelRatio handling**
   - What we know: PixiJS supports `resolution` and `autoDensity` options for HiDPI displays
   - What's unclear: Whether to enable HiDPI now or defer to a polish phase
   - Recommendation: Defer to later phase. Base 1280x720 looks fine on Retina; HiDPI adds complexity. Can add `resolution: window.devicePixelRatio, autoDensity: true` later without architectural changes.

2. **BitmapText centering after creation**
   - What we know: BitmapText width/height are available after creation. Menu text needs centering.
   - What's unclear: Whether width is immediately available or requires a frame to compute
   - Recommendation: Set position after creating the BitmapText. In existing main.ts this pattern already works. If issues arise, use `onRender` callback for first-frame positioning.

## Sources

### Primary (HIGH confidence)
- [PixiJS Ticker API docs](https://pixijs.download/release/docs/ticker.Ticker.html) -- full property/method reference, deltaTime vs elapsedMS vs deltaMS semantics
- [PixiJS ApplicationOptions API](https://pixijs.download/dev/docs/app.ApplicationOptions.html) -- confirmed NO letterbox option exists
- [PixiJS Events guide](https://pixijs.com/8.x/guides/components/events) -- eventMode values, pointer events, cursor property
- [PixiJS Graphics guide](https://pixijs.com/8.x/guides/components/scene-objects/graphics) -- GraphicsContext sharing pattern, rect/fill API, destroy requirements
- [PixiJS Container docs](https://pixijs.com/8.x/guides/components/scene-objects/container) -- addChild/removeChild, child events, only Containers can have children in v8
- [PixiJS Ticker guide](https://pixijs.com/8.x/guides/components/ticker) -- priority levels, maxFPS/minFPS, callback signature

### Secondary (MEDIUM confidence)
- [CodeREVUE: Scale PixiJS to fit screen](https://coderevue.net/posts/scale-to-fit-screen-pixijs/) -- letterbox scaling pattern with Container scale/offset
- [PixiJS Render Loop concept](https://pixijs.com/8.x/guides/concepts/render-loop) -- frame lifecycle: ticker -> scene graph -> render

### Tertiary (LOW confidence)
- [pixijs-interpolated-ticker](https://github.com/reececomo/pixijs-interpolated-ticker) -- third-party fixed-timestep plugin (NOT recommended; our needs are simpler than what it provides)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- PixiJS 8.17.1 already installed, APIs verified against current docs
- Architecture: HIGH -- patterns derived from PixiJS v8 official docs + user decisions are very specific
- Pitfalls: HIGH -- common game loop pitfalls well-documented, PixiJS v8 migration gotchas verified

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (PixiJS v8 API is stable)
