# Phase 2: Game Engine Foundation - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

A running game loop with keyboard input capture, canvas rendering, state transitions, and object pooling that a developer can verify in-browser. This is the technical backbone for all gameplay phases -- no actual gameplay content yet, but all engine systems exercised via placeholder falling objects.

</domain>

<decisions>
## Implementation Decisions

### Game Loop Architecture
- **D-01:** Fixed timestep at **60 ticks/sec**, driven by PixiJS's built-in `app.ticker`
- **D-02:** **No render interpolation** -- at 60 ticks/sec the visual difference is negligible for a typing game
- **D-03:** **Cap catch-up ticks** (max ~3 per frame) to prevent spiral-of-death on slow devices -- drop excess accumulated time

### State Machine
- **D-04:** **State classes** with `enter()`/`exit()`/`update()`/`render()` methods -- one class per state (Boot, Menu, Playing, Paused)
- **D-05:** **Validated transitions** -- define allowed state transitions, throw errors in dev on invalid transitions
- **D-06:** **Flat states for now** -- no sub-states within Playing. Sub-states (countdown, level transitions) added in later phases when needed
- **D-07:** Menu state shows a **placeholder with a 'Play' button** (game title + clickable text) to prove state transitions work

### Input Handling
- **D-08:** **Ignore key repeats** -- only process initial keydown, filter out `event.repeat`. Each letter is one deliberate press
- **D-09:** **Buffer inputs per frame** -- queue keydown events, process them once per game tick. Prevents missed inputs between frames
- **D-10:** **Lowercase + basic normalization** -- normalize to lowercase, ignore modifier combos (Ctrl+X, Alt+X). Dead key / accent handling deferred to Phase 3
- **D-11:** **Global capture, state-based filtering** -- one keyboard listener, each state decides which keys to process

### Object Pooling
- **D-12:** **Pre-allocate small + grow on demand** -- start with ~20 entities, grow if needed, never shrink
- **D-13:** **Pool falling entities only** in Phase 2 -- effects and particles pooled when introduced in Phase 8

### Canvas Sizing & Scaling
- **D-14:** **Full window with fixed aspect ratio** (16:9) -- letterboxing (black bars) if window aspect doesn't match
- **D-15:** **1280x720 base resolution** for the game coordinate system -- scales cleanly to 1080p and 4K

### Tab/Focus Behavior
- **D-16:** **Reset time accumulator** on tab return -- no catch-up burst of ticks when coming back from alt-tab
- **D-17:** **Pause on blur** (window.blur event), not just tab visibility -- kids clicking outside the browser won't lose their game

### Developer Verification
- **D-18:** **Debug overlay** showing FPS, current game state, and object pool stats (active/total), toggled with F3
- **D-19:** Debug overlay rendered as **HTML DOM overlay** (not PixiJS) -- doesn't affect game rendering performance
- **D-20:** Playing state demonstrates with **falling placeholder objects** (colored rectangles) that can be "destroyed" by pressing any key -- exercises loop, pooling, input, and rendering together

### Architecture & File Layout
- **D-21:** **One file per system** in `src/game/`: `loop.ts`, `states.ts`, `input.ts`, `pool.ts`, `canvas.ts` with `index.ts` barrel export
- **D-22:** **Central Game class** owns the PixiJS app, state machine, input manager, and pool. Systems access each other through the game instance
- **D-23:** **Game-specific types in `src/game/types.ts`** -- `src/shared/types/` reserved for cross-cutting types (i18n, settings, profiles)

### Claude's Discretion
- Exact object pool implementation details (data structure, recycling mechanism)
- PixiJS ticker configuration specifics (maxFPS, priority)
- State transition map specifics (exact allowed transitions beyond the obvious ones)
- Debug overlay styling and positioning
- Placeholder object visual style (shape, colors, size)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` -- Core value, constraints, target audience (5-8 year olds)
- `.planning/REQUIREMENTS.md` -- GAME-01 (partial), AV-04 requirements for this phase
- `.planning/ROADMAP.md` -- Phase 2 success criteria and dependencies

### Prior Phase Context
- `.planning/phases/01-project-scaffolding-dev-tooling/01-CONTEXT.md` -- Project structure (D-03: domain-based src/), path aliases (D-04: @/), tooling decisions

### Existing Code
- `src/main.ts` -- Current PixiJS Application init with BitmapText (to be refactored into Game class)
- `src/game/` -- Empty directory (.gitkeep), target for all Phase 2 code
- `src/shared/types/index.ts` -- Existing shared types barrel

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/main.ts` -- PixiJS Application initialization pattern (background color, resizeTo, canvas mounting). Will be refactored into the Game class
- `src/shared/i18n/` -- i18n foundation with `t()` helper, fr.json/en.json -- can be used for menu text

### Established Patterns
- Domain-based organization: `src/game/`, `src/screens/`, `src/shared/` (Phase 1 D-03)
- `@/` path aliases for imports (Phase 1 D-04)
- BitmapFont installation pattern in current main.ts
- Vitest for testing (Phase 1 D-15)

### Integration Points
- `src/main.ts` -- Entry point, currently initializes PixiJS directly. Phase 2 replaces this with Game class instantiation
- `index.html` -- Contains `#game-container` div for canvas mounting
- `src/style.css` -- Base styles, may need updates for letterboxing/fullscreen canvas

</code_context>

<specifics>
## Specific Ideas

- The Playing state's falling placeholder objects serve as a visual smoke test for the entire engine -- loop, pooling, input, rendering all verified in one demo
- Debug overlay on F3 key gives developers immediate feedback on all Phase 2 success criteria
- Pause-on-blur is specifically chosen because 5-8 year olds frequently click outside browser windows

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 02-game-engine-foundation*
*Context gathered: 2026-03-30*
