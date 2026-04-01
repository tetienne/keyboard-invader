# Phase 6: Profiles & Local Persistence - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Two children sharing the same computer each have their own profile with saved progress, selectable by clicking their avatar. This phase introduces the persistence layer (LocalStorage), profile data model, profile selection screen, and profile creation/edit/delete flows. Firebase cloud sync is out of scope (Phase 10).

</domain>

<decisions>
## Implementation Decisions

### Profile Selection Flow
- **D-01:** The app opens to a **dedicated profile selection screen** before the menu. This is the new entry point after boot (boot -> profiles -> menu -> playing).
- **D-02:** First launch (no profiles exist) shows the **profile creation flow directly** as a first-run experience, guiding the user to create their first profile.
- **D-03:** After selecting a profile, the child proceeds to the existing MenuState (letter/word mode selection).

### Avatar System
- **D-04:** **Pre-defined set of 6-8 colorful cartoon avatars** to choose from. SVG-based placeholders for now (simple geometric characters); Phase 8 (Visual Identity) will replace them with final art.
- **D-05:** A child can **change their avatar later** from a profile edit screen.

### Profile Data Shape
- **D-06:** Each profile stores: **name** (string, child's first name), **avatarId** (string, references a pre-defined avatar), **cumulativeStats** (totalSessions, totalHits, totalMisses, bestAccuracy), **lastDifficultyParams** (from DifficultyManager, restored on session start per Phase 5 D-13), **preferredGameMode** ('letters' | 'words' | null), **createdAt** (ISO date string).
- **D-07:** **Last 10 session summaries** stored per profile (hits, misses, accuracy, mode, date). Enough for Phase 7 XP calculations without unbounded LocalStorage growth.
- **D-08:** Profile data schema must be **extensible** for Phase 7 (XP, level fields added later) without migration complexity -- use a versioned schema with sensible defaults for missing fields.

### Profile Management
- **D-09:** **Maximum 4 profiles** -- keeps the selection screen clean for household use.
- **D-10:** Profiles can be **deleted with a confirmation step** (parent-facing action). Confirmation prevents accidental deletion by a young child.
- **D-11:** Profile **editing** limited to: change name, change avatar. No other editable fields.

### Persistence Architecture
- **D-12:** All persistence through **LocalStorage** with a single JSON key (e.g., `keyboard-invader-profiles`). One read on boot, write after each session and profile change.
- **D-13:** Persistence layer implemented as an **adapter/repository pattern** so Phase 10 can swap in Firebase without changing game logic.

### State Machine Integration
- **D-14:** New state `'profiles'` added to StateName. Transitions: boot -> profiles, profiles -> menu. Menu gets a "change profile" back-link to profiles.
- **D-15:** `GameContext` extended with profile-related methods: `setActiveProfile()`, `getActiveProfile()`, and access to the persistence layer.

### Claude's Discretion
- LocalStorage key naming and data serialization format
- Profile selection screen layout and animations
- Exact avatar placeholder designs (simple geometric SVGs)
- Error handling for corrupted LocalStorage data (silent reset vs warning)
- Whether preferred game mode auto-selects in MenuState or just highlights

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game Architecture
- `src/game/types.ts` -- StateName, GameMode, GameContext interface, SessionResult (all need extending for profiles)
- `src/game/states.ts` -- StateMachine, MenuState, all game states (profile state integrates here)
- `src/game/game.ts` -- Game class implementing GameContext (needs profile methods)
- `src/game/difficulty.ts` -- DifficultyManager, DifficultyParams (profile stores/restores these per D-13/Phase 5)

### i18n
- `src/shared/i18n/fr.json` -- Already has `"menu.profiles": "Profils"`
- `src/shared/i18n/en.json` -- Already has `"menu.profiles": "Profiles"`

### Prior Phase Decisions
- `.planning/phases/05-adaptive-difficulty/05-CONTEXT.md` D-13 -- Difficulty resets each session; Phase 6 stores/restores
- `.planning/phases/04-word-mode-game-modes/04-CONTEXT.md` D-15 -- Mode selection per-session; profiles can persist preference

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `StateMachine` class in `states.ts` -- handles state transitions, just needs new 'profiles' state registered
- `BitmapText` pattern used in MenuState for clickable buttons with hover effects -- reusable for avatar selection
- `GameFont` BitmapFont installed in BootState -- available for profile screen text
- i18n strings for "Profiles"/"Profils" already exist

### Established Patterns
- State pattern: each state implements `GameState` interface with enter/exit/update/render
- UI elements created in `enter()`, destroyed in `exit()` with null checks
- Pointer events (eventMode, cursor, pointertap) for click interactions (MenuState pattern)
- GameContext as the central interface for cross-state communication

### Integration Points
- `types.ts` StateName union needs 'profiles' added
- `TRANSITIONS` record needs profiles transitions
- `GameContext` interface needs profile-related methods
- `Game` class constructor needs to register ProfileState
- `BootState` currently transitions to 'menu' -- needs to transition to 'profiles' instead
- `DifficultyManager` created in `PlayingState.enter()` -- needs to accept initial params from profile
- `src/screens/` directory exists (empty) -- could house profile screen components if extracted from states.ts

</code_context>

<specifics>
## Specific Ideas

- Avatars should be large, colorful, and immediately recognizable -- a 5-year-old picks by visual recognition, not by reading a name
- Profile names should support short first names only (max ~12 chars) -- "Raphael", "Lea", not "Raphael Martin"
- The profile screen should feel like a "character select" screen from a kid's game, not a login form

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 06-profiles-local-persistence*
*Context gathered: 2026-04-01*
