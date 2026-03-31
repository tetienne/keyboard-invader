# Phase 4: Word Mode & Game Modes - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

An 8-year-old can play word mode (complete words fall, typed letter-by-letter), both children can choose their mode from the menu, and sessions have a clear start/pause/end flow with a summary screen showing accuracy, items practiced, and time played.

This phase adds word-based gameplay alongside the existing letter mode, a mode selection menu, and an enhanced session summary. No adaptive difficulty, no profiles, no audio -- those are later phases.

</domain>

<decisions>
## Implementation Decisions

### Word Rendering & Typing Progress
- **D-01:** Each falling word is a single **BitmapText entity** from the existing pool, displaying the full word. Same acquire/release pattern as letter entities
- **D-02:** **Letter-by-letter highlight** as the child types -- each correctly typed character changes tint (e.g., green) while remaining characters stay in the original color. Uses PixiJS v8 character-level tint or a multi-BitmapText approach if needed
- **D-03:** Words use the same **kid-friendly color palette** and **large font size** as letters (~60-80px depending on word length), ensuring readability on varying screens
- **D-04:** Word fall speed is **slower than letter mode** to give children time to type multiple characters. Fixed speed for Phase 4; adaptive adjustment is Phase 5 scope

### Word Input Matching
- **D-05:** On **wrong letter**: gentle red flash on the current character position + small shake (consistent with Phase 3 D-08 non-punitive design). No progress lost -- the child retries the current letter
- **D-06:** On **correct letter**: current character highlights green, cursor advances to next character. When all characters typed, the word triggers the hit tween (scale up + fade out, same as Phase 3 D-07)
- **D-07:** Each word has an internal **typing cursor** tracking which character the child needs to type next. Only one word is "active" (targetable) at a time -- the lowest word on screen, same priority logic as Phase 3 D-14
- **D-08:** Input matching uses the existing **InputManager buffer** (Phase 2 D-09), processing buffered keys against the active word's current character

### Word Lists & Categories
- **D-09:** Word lists stored as **JSON files per locale**: `src/shared/i18n/fr.words.json` and `en.words.json`, loaded at boot. Consistent with existing i18n infrastructure
- **D-10:** Words categorized by **length** as a simple difficulty proxy: short (3-4 letters), medium (5-6 letters). Phase 4 uses only short and medium words
- **D-11:** **ASCII-only words** (no accented characters) -- consistent with Phase 3 D-06. French word lists use words without accents (e.g., "chat", "loup", "table", not "chateau", "ecole"). Dead-key handling deferred
- **D-12:** Word selection uses **progressive difficulty within a session**: start with short words, introduce medium words after ~40% of session. Same pattern as Phase 3 letter progression (home row -> top row -> bottom row)

### Mode Selection UI
- **D-13:** Menu screen updated with **two large, visually distinct buttons**: one for letter mode, one for word mode. Each button has an icon/visual cue so a 5-year-old who cannot read can still choose
- **D-14:** Button labels use i18n: "Lettres" / "Letters" and "Mots" / "Words"
- **D-15:** Mode selection is **per-session, not persisted** -- child chooses each time. Persistence comes with profiles in Phase 6
- **D-16:** MenuState refactored to show mode buttons instead of the single "Jouer" button. Selected mode is passed to PlayingState via GameContext

### Session Summary Screen (GAME-07)
- **D-17:** Summary screen shows: **accuracy percentage, items practiced count, and time played** (per GAME-07 requirement)
- **D-18:** Time played tracked from PlayingState enter to session end, displayed in minutes:seconds format
- **D-19:** Summary tone remains **encouraging** ("Bravo!") -- consistent with Phase 3 GameOverState design
- **D-20:** Summary actions: **"Rejouer"** (replay same mode) and **"Menu"** (return to mode selection). Replay preserves the current game mode

### Pause/Resume (GAME-06)
- **D-21:** Pause/resume already implemented at Game level (Phase 2). Phase 4 ensures it works correctly for both letter and word mode -- no additional pause logic needed beyond what exists
- **D-22:** Pause overlay and Space/Enter unpause behavior (Phase 2 D-16/17) applies identically to word mode

### Architecture
- **D-23:** PlayingState becomes **mode-aware**: accepts a game mode parameter ('letters' | 'words') and delegates to mode-specific spawning, matching, and scoring logic
- **D-24:** Shared logic (fall movement, tween updates, cleanup passes, score display) stays in PlayingState. Mode-specific logic (entity creation, input matching, letter selection vs word selection) extracted to helper modules
- **D-25:** New file `src/game/words.ts` for word list loading, word selection, and word-specific matching logic. Mirrors the structure of `src/game/letters.ts`
- **D-26:** GameContext extended with `getGameMode()` method so GameOverState knows which mode to replay

### Claude's Discretion
- Exact word list content (specific words for fr/en, count per category)
- Visual design of mode selection buttons (icon style, colors, layout)
- Whether to use SplitBitmapText or multiple BitmapText objects for per-character tint
- Internal code organization of mode-specific logic within PlayingState
- Exact word fall speed value (slower than letter mode's 80px/sec)
- Timer display format details on summary screen

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` -- Core value (non-frustrating for 5-8 year olds), two target children (5yo pre-reader, 8yo reader)
- `.planning/REQUIREMENTS.md` -- GAME-03 (word mode), GAME-06 (pause/resume), GAME-07 (session summary)
- `.planning/ROADMAP.md` -- Phase 4 success criteria and dependencies

### Prior Phase Context
- `.planning/phases/02-game-engine-foundation/02-CONTEXT.md` -- Engine decisions: state machine, input handling, object pooling, pause/resume
- `.planning/phases/03-letter-mode-gameplay/03-CONTEXT.md` -- Letter rendering, input matching, session flow, non-punitive feedback design

### Existing Code
- `src/game/types.ts` -- GameState interface, StateName, GameContext interface, TRANSITIONS map
- `src/game/states.ts` -- PlayingState (to extend for word mode), MenuState (to add mode buttons), GameOverState (to enhance summary)
- `src/game/letters.ts` -- Letter entity types, selection logic, matching functions (pattern to mirror for words)
- `src/game/tween.ts` -- Tween system (reusable for word animations)
- `src/game/input.ts` -- InputManager with buffer/drain pattern
- `src/game/pool.ts` -- ObjectPool<T> generic class
- `src/game/game.ts` -- Game class, pause overlay, GameContext implementation
- `src/shared/i18n/index.ts` -- i18n system (t(), locale detection, JSON loading)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `PlayingState` in `src/game/states.ts` -- Already has spawn/fall/match/score loop. Refactor to accept game mode parameter
- `ObjectPool<BitmapText>` in `src/game/pool.ts` -- Can pool word entities (BitmapText with full word text)
- `InputManager` in `src/game/input.ts` -- Buffer/drain pattern works for word typing (process one key at a time against current word character)
- `LetterEntity` type and helper functions in `src/game/letters.ts` -- Pattern to replicate for WordEntity
- Tween system in `src/game/tween.ts` -- Hit/miss/bottom tweens reusable for words
- `GameOverState` in `src/game/states.ts` -- Already shows results, extend with time played
- i18n system in `src/shared/i18n/` -- Ready for word list JSON files

### Established Patterns
- State classes with `enter()/exit()/update()/render()` lifecycle
- Pool acquire/release cycle with visibility toggling and full property reset
- `gameRoot` Container as scene graph root
- BitmapText for all text rendering
- Fixed timestep dt in milliseconds
- `findLowestMatch()` pattern for entity priority (lowest on screen)
- Progressive difficulty within session (Phase 3: home row -> top -> bottom)

### Integration Points
- `src/game/types.ts` -- Add GameMode type, extend GameContext with getGameMode()
- `src/game/states.ts` -- MenuState gets mode buttons, PlayingState becomes mode-aware, GameOverState adds time + replay-same-mode
- `src/game/game.ts` -- GameContext implementation updated for game mode
- `src/shared/i18n/fr.json` and `en.json` -- Add mode button labels
- New files: `src/shared/i18n/fr.words.json`, `en.words.json`, `src/game/words.ts`

</code_context>

<specifics>
## Specific Ideas

- The 5-year-old cannot read, so mode selection buttons need visual cues (icons or illustrations), not just text labels
- Word mode targets the 8-year-old sibling who can read -- words should be age-appropriate and familiar
- Letter-by-letter highlighting gives the same "one key at a time" rhythm as letter mode, just with continuity across a word
- Only one word is active/targetable at a time to avoid confusion about which word to type
- French word lists should avoid accented words entirely (not just strip accents) to keep input matching simple

</specifics>

<deferred>
## Deferred Ideas

- Accented character support (dead-key handling) -- requires complex input logic, better suited for a dedicated phase after adaptive difficulty
- Word difficulty based on letter frequency or phonetic complexity -- Phase 5 (Adaptive Difficulty) scope
- Category-based word lists (animals, colors, food) -- could enhance engagement but not required for v1 core
- Combo/streak bonuses for consecutive correct words -- Phase 7 (Progression System)
- Sound effects for word completion vs letter hit -- Phase 9 (Audio System)

</deferred>

---

*Phase: 04-word-mode-game-modes*
*Context gathered: 2026-03-31*
