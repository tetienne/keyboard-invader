# Phase 3: Letter Mode Gameplay - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

A 5-year-old can play a complete session of falling single letters, pressing the correct key to destroy them, with immediate visual feedback for correct and incorrect presses. A score counter tracks hits, and each session has a clear start and end with a results screen.

This phase transforms the Phase 2 placeholder rectangles into actual letter-matching gameplay. No word mode, no adaptive difficulty, no persistent profiles -- those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Letter Rendering
- **D-01:** Each falling letter is a **BitmapText entity** using the existing GameFont installed in BootState
- **D-02:** Letters are **large (~80px)** for visibility by young children on varying screen sizes
- **D-03:** Letters use a **cycling kid-friendly color palette** (bright, distinct colors) -- not monochrome. Each letter gets a random color from the palette on spawn

### Letter Selection & Difficulty
- **D-04:** Letters start from the **home row (ASDF JKL;)** and gradually introduce more letters as the session progresses (row by row: home → top → bottom)
- **D-05:** **Fixed gentle difficulty** for Phase 3 -- constant fall speed, constant spawn rate. Adaptive difficulty is explicitly Phase 5's scope (DIFF-01 through DIFF-04)
- **D-06:** **ASCII-only letters (a-z)** -- no accented characters in Phase 3. Dead-key handling deferred to word mode or a future phase. This resolves the blocker noted in STATE.md

### Visual Feedback
- **D-07:** **Correct hit:** letter scales up briefly + flashes green + fades out (positive, satisfying, non-distracting)
- **D-08:** **Wrong key:** gentle red flash on the targeted letter + small horizontal shake. No punishment sound, no scary effect -- aligns with core value of non-frustrating experience for 5-year-olds
- **D-09:** **Letter reaching bottom:** letter fades out silently -- no game over, no life lost. The session continues. Punitive mechanics are explicitly out of scope (REQUIREMENTS.md: "Game over punitif")

### Score & Session Structure
- **D-10:** **Simple hit counter** displayed at top-right of screen, increments per correct hit
- **D-11:** **Fixed letter count per session** (e.g., 20 letters), then automatic transition to a results screen
- **D-12:** **Results screen** shows hits, misses, and accuracy percentage -- brief and encouraging. Provides a "Rejouer" (play again) button to restart

### Input Matching
- **D-13:** Each falling letter has an **assigned key** (the letter itself). Only that key destroys it -- not "any key" like Phase 2 placeholder
- **D-14:** When multiple letters are on screen, the keypress **matches the lowest (closest to bottom) letter with that character**. If no matching letter exists, it's a miss
- **D-15:** Input matching uses the existing InputManager buffer (Phase 2 D-09), processing all buffered keys per tick

### State Machine Updates
- **D-16:** Add a **'gameover' state** (or 'results' state) to StateName and TRANSITIONS for the end-of-session results screen. Transition: playing → gameover, gameover → menu or gameover → playing (replay)
- **D-17:** The existing PlayingState is **refactored** to use letter entities instead of placeholder rectangles

### Claude's Discretion
- Exact color palette values for letters
- Specific animation timing/easing for hit/miss effects
- Results screen layout and styling details
- Letter spawn position randomization (across full width or lanes)
- Exact session letter count (20 is suggested but can be adjusted)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` -- Core value (non-frustrating for 5-8 year olds), constraints, target audience
- `.planning/REQUIREMENTS.md` -- GAME-01 (letters fall), GAME-02 (letter mode for pre-readers), GAME-04 (immediate feedback), GAME-05 (visible score)
- `.planning/ROADMAP.md` -- Phase 3 success criteria and dependencies

### Prior Phase Context
- `.planning/phases/02-game-engine-foundation/02-CONTEXT.md` -- Engine decisions: game loop (D-01 to D-03), state machine (D-04 to D-07), input handling (D-08 to D-11), object pooling (D-12 to D-13), canvas scaling (D-14 to D-15)
- `.planning/phases/02-game-engine-foundation/02-01-SUMMARY.md` -- Pure logic modules implementation details
- `.planning/phases/02-game-engine-foundation/02-02-SUMMARY.md` -- Game class, state machine, integration details

### Existing Code (Phase 2 output)
- `src/game/types.ts` -- GameState interface, StateName type, GameContext interface, TRANSITIONS map
- `src/game/states.ts` -- PlayingState (to be refactored), StateMachine, MenuState, PausedState
- `src/game/game.ts` -- Game class, ObjectPool wiring, InputManager wiring
- `src/game/input.ts` -- InputManager with AZERTY-safe keydown capture
- `src/game/pool.ts` -- ObjectPool<T> generic class
- `src/game/canvas.ts` -- computeScale, BASE_WIDTH (1280), BASE_HEIGHT (720)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PlayingState` in `src/game/states.ts` -- Already has spawn/fall/destroy loop for rectangles. Refactor to letters
- `ObjectPool<T>` in `src/game/pool.ts` -- Generic pool, can pool BitmapText entities instead of Graphics
- `InputManager` in `src/game/input.ts` -- Already buffers keydown events, filters repeats, normalizes to lowercase
- `BitmapFont 'GameFont'` installed in BootState -- Ready for BitmapText letter rendering
- `GameContext.getInputBuffer()` -- Returns buffered keys per frame

### Established Patterns
- State classes with `enter()/exit()/update()/render()` lifecycle
- Pool acquire/release cycle with visibility toggling
- `gameRoot` Container as scene graph root
- `dt` in milliseconds passed to update()
- BitmapText for all text rendering (not Canvas text)

### Integration Points
- `src/game/types.ts` -- StateName needs 'gameover' added, TRANSITIONS map needs updating
- `src/game/states.ts` -- PlayingState refactored, new GameOverState/ResultsState added
- `src/game/game.ts` -- ObjectPool factory may need to create BitmapText instead of Graphics
- `src/game/index.ts` -- Barrel export updated for new exports

</code_context>

<specifics>
## Specific Ideas

- The 5-year-old target user cannot read -- letters are purely visual symbols to match on the keyboard. Large, colorful, friendly presentation is essential
- "Jouer" / "Rejouer" buttons maintain French-first UI (i18n system from Phase 1 available)
- No game over state that feels like failure -- session just ends naturally after N letters
- The results screen should feel like a celebration, not a report card

</specifics>

<deferred>
## Deferred Ideas

- Accented character support (e, a, c, etc.) -- requires dead-key handling complexity, better suited for word mode (Phase 4+)
- Sound effects on hit/miss -- Phase 9 (Audio System) handles all audio
- Particle effects on letter destruction -- Phase 8 (Visual Identity) handles visual polish
- Adaptive difficulty (speed, spawn rate, letter complexity) -- Phase 5
- Streak counter or combo system -- could be added in Phase 7 (Progression System) or later

</deferred>

---

*Phase: 03-letter-mode-gameplay*
*Context gathered: 2026-03-30*
