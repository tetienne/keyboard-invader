# Phase 7: Progression System - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Children earn XP after each session, accumulate it toward levels 1-10, see their progress via an XP bar (in-game HUD + results screen + profile screen), and experience a full-screen celebration with particles when leveling up. Leveling unlocks new avatars (3 locked, 3 free from start).

</domain>

<decisions>
## Implementation Decisions

### XP Formula & Leveling Curve
- **D-01:** XP is accuracy-based: base XP per hit + accuracy bonus. Higher accuracy sessions earn more XP per hit than lower accuracy ones.
- **D-02:** Word mode earns 1.5x XP compared to letter mode (harder challenge rewarded).
- **D-03:** 10 levels with a gentle curve. Early levels fast (2-3 sessions), later levels slower (5-8 sessions). Achievable within weeks of regular play.
- **D-04:** XP calculation is a pure logic module (like DifficultyManager), no PixiJS dependency, fully unit-testable.

### Level-Up Celebration
- **D-05:** Full-screen overlay celebration that takes over after the results screen for 2-3 seconds, then auto-dismisses.
- **D-06:** Particles + scale burst style: colorful particles (stars/confetti) burst outward from the level number, which scales up with a bounce. Extends existing tween system with particle spawning.
- **D-07:** Non-punitive, joyful tone. Consistent with Phase 3's feedback philosophy.

### Progress Visibility
- **D-08:** In-game HUD shows level number + mini XP bar during gameplay (top corner).
- **D-09:** Results screen shows animated XP bar fill after the existing summary stats (accuracy, items, time).
- **D-10:** When level-up occurs on results: XP bar animates to 100%, full-screen celebration overlay plays, bar resets at new level showing remaining XP. Repeats if multiple level-ups in one session.
- **D-11:** Profile selection screen shows a small level badge on/near each avatar.

### XP Bar Visual Design
- **D-12:** Rounded pill shape with gradient fill (e.g. blue to purple), fills left-to-right. Level number on the left, XP text on the right.

### Level Rewards & Motivation
- **D-13:** Leveling up unlocks new avatars. Start with 3 free avatars, 3 locked avatars unlockable at levels 3, 5, and 8.
- **D-14:** Locked avatars shown grayed out with lock icon and required level label (e.g. "Niv. 5"). Tapping shows an encouraging message like "Atteins le niveau 5 pour debloquer!"

### Schema Migration
- **D-15:** Auto-migrate existing profiles (schema v1 to v2) with defaults: xp: 0, level: 1. All previously available avatars remain accessible. Migration runs automatically on load.
- **D-16:** Profile schema extends with: xp (number), level (number), unlockedAvatarIds (string[]).

### Claude's Discretion
- Exact XP values per hit and accuracy bonus multiplier formula
- Exact XP thresholds per level (following the gentle curve constraint)
- Particle count, colors, and animation timing for celebration
- XP bar dimensions and positioning in HUD vs results screen
- Lock icon design and tooltip positioning

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Persistence Layer
- `src/persistence/types.ts` -- ProfileData, CumulativeStats, SessionSummary interfaces (must extend)
- `src/persistence/repository.ts` -- ProfileRepository interface
- `src/persistence/local-storage.ts` -- LocalStorageProfileRepository implementation
- `src/persistence/schema.ts` -- Schema migration logic (must add v1->v2 migration)

### Game Engine
- `src/game/types.ts` -- GameContext interface, SessionResult, StateName, TRANSITIONS (must extend)
- `src/game/game.ts` -- Game class implementing GameContext (must extend)
- `src/game/states.ts` -- StateMachine + all state classes, saveSessionToProfile() function (must extend)
- `src/game/tween.ts` -- Tween system (must extend for celebration animations and XP bar)

### Profile & Avatar System
- `src/avatars/definitions.ts` -- AvatarDefinition interface + AVATARS array (must add unlock metadata)
- `src/game/profile-state.ts` -- ProfileState UI (must add level badge and locked avatar display)

### Gameplay States
- `src/game/states.ts` -- GameOverState (results screen, must add XP display + celebration trigger)
- `src/game/states.ts` -- PlayingState (must add HUD XP bar)

### i18n
- `src/shared/i18n/fr.json` -- French translations (must add progression strings)
- `src/shared/i18n/en.json` -- English translations (must add progression strings)

### Prior Phase Patterns
- `src/game/difficulty.ts` -- DifficultyManager pattern to follow for ProgressionManager
- `.planning/phases/05-adaptive-difficulty/05-CONTEXT.md` -- Pure logic module pattern (D-16 to D-18)
- `.planning/phases/06-profiles-local-persistence/06-CONTEXT.md` -- Repository adapter pattern, schema versioning

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Tween system** (`src/game/tween.ts`): Hit/miss/bottom tweens with scale, tint, alpha. Extend for XP bar fill and celebration burst.
- **Object pool** (`src/game/pool.ts`): Reuse for particle pooling in celebrations.
- **Avatar renderer** (`src/avatars/renderer.ts`): drawAvatar() function, extend with level badge overlay and lock icon.
- **i18n system** (`src/shared/i18n/index.ts`): t() function for translated strings.

### Established Patterns
- **Pure logic modules**: DifficultyManager created per-session, no PixiJS dependency, fully testable. ProgressionManager follows this pattern.
- **GameContext extension**: Each phase adds methods (getDifficulty, getActiveProfile, etc.). Phase 7 adds getProgression().
- **State machine transitions**: States have enter/exit/update/render. Celebration overlay can be managed within GameOverState.
- **Schema migration**: Versioned envelope in LocalStorage, migrateIfNeeded() auto-upgrades on load.

### Integration Points
- **saveSessionToProfile()** in states.ts: Called in GameOverState.enter(). Extend to calculate XP and detect level-ups.
- **GameOverState render**: Currently shows accuracy, items, time. Add XP bar and celebration after.
- **PlayingState render**: Add HUD elements (level badge + mini XP bar) to the game canvas.
- **ProfileState**: Add level badge on avatars, gray out + lock icon on locked avatars.

</code_context>

<specifics>
## Specific Ideas

- Children ages 5-8: celebrations must be joyful and encouraging, never condescending
- The XP bar fill animation on the results screen should feel satisfying (not instant)
- Locked avatar message should be motivating ("Atteins le niveau 5!") not blocking ("You can't use this")
- Multi-level-up in one session: repeat the celebration cycle for each level crossed

</specifics>

<deferred>
## Deferred Ideas

- Cosmetic titles per level (e.g. "Debutant", "Explorateur", "Champion") -- could be added in Phase 8 (Visual Identity)
- Retroactive XP calculation from existing session history -- decided against in favor of clean start with defaults
- Personnages deblocables beyond avatars (full character sprites) -- Phase 8 (Visual Identity)

</deferred>

---

*Phase: 07-progression-system*
*Context gathered: 2026-04-02*
