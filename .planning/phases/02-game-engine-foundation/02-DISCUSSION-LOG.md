# Phase 2: Game Engine Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 02-game-engine-foundation
**Areas discussed:** Game loop architecture, State machine design, Input handling, Developer verification, Object pooling strategy, Canvas sizing & scaling, Tab/focus behavior, Architecture & file layout

---

## Game Loop Architecture

### Tick Rate

| Option | Description | Selected |
|--------|-------------|----------|
| 60 ticks/sec (Recommended) | Matches 60fps displays, simplest approach -- 1 tick = 1 frame on most screens | ✓ |
| 30 ticks/sec + interpolation | Lower CPU cost, smoother visuals via render interpolation. More complex | |
| You decide | Claude picks best approach | |

**User's choice:** 60 ticks/sec
**Notes:** None

### Render Interpolation

| Option | Description | Selected |
|--------|-------------|----------|
| No interpolation (Recommended) | At 60 ticks/sec, near-zero visual benefit. Discrete steps look smooth | ✓ |
| Yes, interpolate | Smoother on high-refresh displays, adds alpha parameter | |
| You decide | Claude picks for target audience | |

**User's choice:** No interpolation
**Notes:** None

### Slow Device Handling

| Option | Description | Selected |
|--------|-------------|----------|
| Cap catch-up ticks (Recommended) | Run up to N catch-up ticks per frame, drop the rest | ✓ |
| Slow down game time | Game runs slower on weak machines | |
| You decide | Claude picks for children's laptops | |

**User's choice:** Cap catch-up ticks
**Notes:** None

### Loop Host

| Option | Description | Selected |
|--------|-------------|----------|
| PixiJS ticker (Recommended) | Use app.ticker as heartbeat, implement fixed timestep inside tick callback | ✓ |
| Custom RAF loop | Own requestAnimationFrame loop, independent of PixiJS | |
| You decide | Claude picks for PixiJS 8 architecture | |

**User's choice:** PixiJS ticker
**Notes:** None

---

## State Machine Design

### State Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| State classes (Recommended) | Each state is a class with enter/exit/update/render methods | ✓ |
| Enum + switch | Simple enum with switch in game loop | |
| You decide | Claude picks based on state count | |

**User's choice:** State classes
**Notes:** None

### Menu State Content

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder with 'Play' button (Recommended) | Simple PixiJS screen with game title and clickable 'Play' text | ✓ |
| Empty state with auto-transition | Menu exists in code but auto-transitions to Playing | |
| You decide | Claude picks what demonstrates state machine | |

**User's choice:** Placeholder with 'Play' button
**Notes:** None

### Transition Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Validated transitions (Recommended) | Define allowed transitions, throw errors in dev on invalid ones | ✓ |
| Free-form transitions | Any state to any state | |
| You decide | Claude picks strictness level | |

**User's choice:** Validated transitions
**Notes:** None

### Sub-states

| Option | Description | Selected |
|--------|-------------|----------|
| Flat for now (Recommended) | Playing is one state, sub-states added later when needed | ✓ |
| Sub-states from the start | Hierarchical state machine from day one | |
| You decide | Claude picks based on Phase 3+ needs | |

**User's choice:** Flat for now
**Notes:** None

---

## Input Handling

### Key Repeat

| Option | Description | Selected |
|--------|-------------|----------|
| Ignore repeats (Recommended) | Only process initial keydown, ignore event.repeat | ✓ |
| Allow repeats with cooldown | Accept repeats with minimum interval | |
| You decide | Claude picks for 5-8 year old typists | |

**User's choice:** Ignore repeats
**Notes:** None

### Input Buffering

| Option | Description | Selected |
|--------|-------------|----------|
| Buffer per frame (Recommended) | Queue keydown events, process once per game tick | ✓ |
| Process immediately | Handle each keydown event as it fires | |
| You decide | Claude picks for fixed-timestep loop | |

**User's choice:** Buffer per frame
**Notes:** None

### Key Normalization

| Option | Description | Selected |
|--------|-------------|----------|
| Lowercase + basic normalize (Recommended) | Normalize to lowercase, strip modifier combos. Dead keys deferred to Phase 3 | ✓ |
| Full normalization now | Handle dead keys, accents, and special chars from the start | |
| You decide | Claude picks based on STATE.md accent note | |

**User's choice:** Lowercase + basic normalize
**Notes:** None

### Input Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Global capture, state filters (Recommended) | Always listen for keys, each state decides what to process | ✓ |
| Per-state listeners | Each state registers/unregisters its own keyboard listeners | |
| You decide | Claude picks cleanest architecture | |

**User's choice:** Global capture, state filters
**Notes:** None

---

## Developer Verification

### Debug Overlay

| Option | Description | Selected |
|--------|-------------|----------|
| FPS + state + pool stats (Recommended) | Current FPS, active game state, pool usage (active/total), toggled with F3 | ✓ |
| FPS only | Just an FPS counter | |
| Full dev panel | FPS, state, pool stats, input buffer, tick timing, memory | |
| You decide | Claude picks right level for Phase 2 | |

**User's choice:** FPS + state + pool stats
**Notes:** None

### Playing State Demo

| Option | Description | Selected |
|--------|-------------|----------|
| Falling placeholder objects (Recommended) | Colored rectangles/circles falling, any key destroys nearest one | ✓ |
| Static 'Playing' label + input echo | Show 'Playing' text and echo pressed keys | |
| You decide | Claude picks best exercise of all systems | |

**User's choice:** Falling placeholder objects
**Notes:** None

### Overlay Technology

| Option | Description | Selected |
|--------|-------------|----------|
| HTML overlay (Recommended) | Simple DOM div positioned over canvas | ✓ |
| PixiJS BitmapText | Render debug info as PixiJS text on canvas | |
| You decide | Claude picks approach separating debug from game | |

**User's choice:** HTML overlay
**Notes:** None

---

## Object Pooling Strategy

### Pool Sizing

| Option | Description | Selected |
|--------|-------------|----------|
| Pre-allocate small + grow (Recommended) | Start with ~20 entities, grow on demand, never shrink | ✓ |
| Pre-allocate max capacity | Allocate maximum expected objects upfront (~50) | |
| You decide | Claude picks for typing game entity count | |

**User's choice:** Pre-allocate small + grow
**Notes:** None

### Pool Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Falling entities only (Recommended) | Pool falling invader objects. Effects/particles pooled in Phase 8 | ✓ |
| Entities + generic pool utility | Build reusable ObjectPool<T> class for any system | |
| You decide | Claude picks right scope for Phase 2 | |

**User's choice:** Falling entities only
**Notes:** None

---

## Canvas Sizing & Scaling

### Canvas-Window Relationship

| Option | Description | Selected |
|--------|-------------|----------|
| Full window, fixed aspect (Recommended) | Fill window, maintain 16:9 aspect ratio with letterboxing | ✓ |
| Full window, stretch | Always fill entire window, may distort | |
| Fixed resolution, centered | Fixed size (1280x720) centered in window | |
| You decide | Claude picks for children's typing game | |

**User's choice:** Full window, fixed aspect ratio
**Notes:** None

### Base Resolution

| Option | Description | Selected |
|--------|-------------|----------|
| 1280x720 (Recommended) | 720p base, scales cleanly to 1080p and 4K | ✓ |
| 1920x1080 | 1080p base, more coordinate space but larger numbers | |
| You decide | Claude picks for SVG/cartoon graphics | |

**User's choice:** 1280x720
**Notes:** None

---

## Tab/Focus Behavior

### Time Accumulator on Return

| Option | Description | Selected |
|--------|-------------|----------|
| Reset accumulator (Recommended) | Discard accumulated delta time on return, no catch-up burst | ✓ |
| Cap and catch up | Apply same max-catch-up-ticks cap as slow devices | |
| You decide | Claude picks safest for kids alt-tabbing | |

**User's choice:** Reset accumulator
**Notes:** None

### Focus Loss Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Pause on blur (Recommended) | Pause when window loses focus (blur event), not just tab hide | ✓ |
| Only on tab hide | Only pause via Page Visibility API | |
| You decide | Claude picks based on 5-8 year old behavior | |

**User's choice:** Pause on blur
**Notes:** None

---

## Architecture & File Layout

### Game Directory Organization

| Option | Description | Selected |
|--------|-------------|----------|
| One file per system (Recommended) | loop.ts, states.ts, input.ts, pool.ts, canvas.ts with index.ts barrel | ✓ |
| Feature folders | src/game/loop/, src/game/states/ each with index + internals | |
| Single game.ts file | Everything in one file, refactor later | |
| You decide | Claude picks for ~5-6 systems | |

**User's choice:** One file per system
**Notes:** None

### System Communication

| Option | Description | Selected |
|--------|-------------|----------|
| Central Game class (Recommended) | Game class owns PixiJS app, state machine, input, pool. Single entry point | ✓ |
| Direct imports, no central class | Each system imports what it needs from other modules | |
| You decide | Claude picks for scaling through Phase 3-10 | |

**User's choice:** Central Game class
**Notes:** None

### Types Location

| Option | Description | Selected |
|--------|-------------|----------|
| Game types in src/game/types.ts (Recommended) | Game-specific types in src/game/, shared types in src/shared/types/ | ✓ |
| All types in src/shared/types/ | Centralize all types | |
| You decide | Claude picks based on domain structure | |

**User's choice:** Game types in src/game/types.ts
**Notes:** None

---

## Claude's Discretion

- Object pool implementation details (data structure, recycling mechanism)
- PixiJS ticker configuration specifics (maxFPS, priority)
- State transition map specifics (exact allowed transitions)
- Debug overlay styling and positioning
- Placeholder object visual style (shape, colors, size)

## Deferred Ideas

None -- discussion stayed within phase scope
