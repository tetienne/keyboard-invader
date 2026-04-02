# Phase 7: Progression System - Research

**Researched:** 2026-04-02
**Domain:** XP/leveling system, UI animations (PixiJS), schema migration, game state extension
**Confidence:** HIGH

## Summary

Phase 7 adds an XP and leveling system to the game. Children earn XP after each session based on performance (hits + accuracy bonus, word mode multiplier), accumulate it toward 10 levels, see progress via XP bars (HUD + results screen), experience a celebration overlay on level-up, and unlock 3 additional avatars at levels 3, 5, and 8. This phase requires extending the profile schema (v1 to v2 migration), creating a pure-logic ProgressionManager (following the DifficultyManager pattern), adding XP bar UI components in both PlayingState and GameOverState, building a particle-based celebration overlay, and modifying ProfileState to support locked/unlocked avatars.

The codebase is well-structured for this addition. The DifficultyManager provides a clear template for ProgressionManager (pure logic, no PixiJS dependency, fully testable). The tween system can be extended for XP bar fill and celebration animations. The ObjectPool can be reused for particle pooling. The schema migration system already handles versioned envelopes with auto-upgrade on load.

**Primary recommendation:** Build ProgressionManager as a pure logic module first (XP calculation, level thresholds, level-up detection), then layer UI components on top (XP bar, celebration, avatar locks). Keep all XP/level math in one testable module.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** XP is accuracy-based: base XP per hit + accuracy bonus. Higher accuracy sessions earn more XP per hit than lower accuracy ones.
- **D-02:** Word mode earns 1.5x XP compared to letter mode (harder challenge rewarded).
- **D-03:** 10 levels with a gentle curve. Early levels fast (2-3 sessions), later levels slower (5-8 sessions). Achievable within weeks of regular play.
- **D-04:** XP calculation is a pure logic module (like DifficultyManager), no PixiJS dependency, fully unit-testable.
- **D-05:** Full-screen overlay celebration that takes over after the results screen for 2-3 seconds, then auto-dismisses.
- **D-06:** Particles + scale burst style: colorful particles (stars/confetti) burst outward from the level number, which scales up with a bounce. Extends existing tween system with particle spawning.
- **D-07:** Non-punitive, joyful tone. Consistent with Phase 3's feedback philosophy.
- **D-08:** In-game HUD shows level number + mini XP bar during gameplay (top corner).
- **D-09:** Results screen shows animated XP bar fill after the existing summary stats (accuracy, items, time).
- **D-10:** When level-up occurs on results: XP bar animates to 100%, full-screen celebration overlay plays, bar resets at new level showing remaining XP. Repeats if multiple level-ups in one session.
- **D-11:** Profile selection screen shows a small level badge on/near each avatar.
- **D-12:** Rounded pill shape with gradient fill (e.g. blue to purple), fills left-to-right. Level number on the left, XP text on the right.
- **D-13:** Leveling up unlocks new avatars. Start with 3 free avatars, 3 locked avatars unlockable at levels 3, 5, and 8.
- **D-14:** Locked avatars shown grayed out with lock icon and required level label (e.g. "Niv. 5"). Tapping shows an encouraging message like "Atteins le niveau 5 pour debloquer!"
- **D-15:** Auto-migrate existing profiles (schema v1 to v2) with defaults: xp: 0, level: 1. All previously available avatars remain accessible. Migration runs automatically on load.
- **D-16:** Profile schema extends with: xp (number), level (number), unlockedAvatarIds (string[]).

### Claude's Discretion
- Exact XP values per hit and accuracy bonus multiplier formula
- Exact XP thresholds per level (following the gentle curve constraint)
- Particle count, colors, and animation timing for celebration
- XP bar dimensions and positioning in HUD vs results screen
- Lock icon design and tooltip positioning

### Deferred Ideas (OUT OF SCOPE)
- Cosmetic titles per level (e.g. "Debutant", "Explorateur", "Champion") -- Phase 8
- Retroactive XP calculation from existing session history -- decided against
- Personnages deblocables beyond avatars (full character sprites) -- Phase 8
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROG-01 | L'enfant gagne de l'XP apres chaque session en fonction de sa performance | ProgressionManager pure logic module: XP formula (base per hit + accuracy bonus + word mode multiplier), called in saveSessionToProfile() |
| PROG-02 | L'enfant monte de niveau en accumulant de l'XP | Level threshold table in ProgressionManager, level-up detection returning old/new level, schema v2 storing xp/level on ProfileData |
| PROG-03 | L'enfant voit une animation de celebration quand il monte de niveau | Full-screen overlay with particle burst + scale bounce, triggered from GameOverState after XP bar fills to 100%, 2-3s auto-dismiss |
</phase_requirements>

## Architecture Patterns

### Recommended Module Structure

```
src/
  game/
    progression.ts       # ProgressionManager (pure logic, no PixiJS)
    xp-bar.ts           # XpBar PixiJS component (pill shape, gradient, animated fill)
    celebration.ts       # CelebrationOverlay (particles + scale burst)
  persistence/
    types.ts             # Extended ProfileData with xp, level, unlockedAvatarIds
    schema.ts            # v1->v2 migration added
  avatars/
    definitions.ts       # Extended AvatarDefinition with unlockLevel
```

### Pattern 1: Pure Logic Module (ProgressionManager)

**What:** A stateless utility module with pure functions for XP calculation and level resolution. Follows the DifficultyManager pattern from Phase 5 but is simpler since it does not need per-session state (XP is computed from SessionResult + profile state, not tracked over time).

**When to use:** Any game logic that must be unit-testable without PixiJS.

**Recommended approach:**

```typescript
// src/game/progression.ts

export interface XpGain {
  baseXp: number
  accuracyBonus: number
  modeMultiplier: number
  totalXp: number
}

export interface LevelUpResult {
  previousLevel: number
  newLevel: number
  levelsGained: number
  remainingXp: number
}

// XP thresholds: cumulative XP needed to reach each level
// Level 1: 0, Level 2: 50, Level 3: 120, ..., Level 10: 1500
export const LEVEL_THRESHOLDS: readonly number[] = [
  0,    // Level 1 (starting level)
  50,   // Level 2 (~2 sessions)
  120,  // Level 3 (~3 sessions)
  220,  // Level 4 (~3-4 sessions)
  360,  // Level 5 (~4 sessions)
  540,  // Level 6 (~5 sessions)
  780,  // Level 7 (~5-6 sessions)
  1080, // Level 8 (~6-7 sessions)
  1440, // Level 9 (~7 sessions)
  1900, // Level 10 (~8 sessions)
]
export const MAX_LEVEL = 10

export function calculateXpGain(
  hits: number,
  total: number,
  mode: 'letters' | 'words',
): XpGain {
  // Base: 2 XP per hit
  const baseXp = hits * 2
  // Accuracy bonus: up to +50% at 100% accuracy
  const accuracy = total > 0 ? hits / total : 0
  const accuracyBonus = Math.round(baseXp * accuracy * 0.5)
  // Word mode: 1.5x multiplier
  const modeMultiplier = mode === 'words' ? 1.5 : 1.0
  const totalXp = Math.round((baseXp + accuracyBonus) * modeMultiplier)

  return { baseXp, accuracyBonus, modeMultiplier, totalXp }
}

export function resolveLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]!) return i + 1
  }
  return 1
}

export function applyXp(
  currentXp: number,
  currentLevel: number,
  xpGain: number,
): LevelUpResult {
  const newTotalXp = currentXp + xpGain
  const newLevel = Math.min(resolveLevel(newTotalXp), MAX_LEVEL)
  return {
    previousLevel: currentLevel,
    newLevel,
    levelsGained: newLevel - currentLevel,
    remainingXp: newTotalXp,
  }
}

export function xpForCurrentLevel(totalXp: number, level: number): {
  current: number
  required: number
} {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? currentThreshold
  return {
    current: totalXp - currentThreshold,
    required: nextThreshold - currentThreshold,
  }
}
```

**Why this structure:**
- Pure functions, no class needed (simpler than DifficultyManager which has rolling window state)
- `calculateXpGain` returns a breakdown for display on results screen
- `applyXp` detects multi-level-ups (D-10)
- `xpForCurrentLevel` provides progress bar data
- All values tunable via the threshold table

### Pattern 2: PixiJS Graphics Component (XpBar)

**What:** A self-contained PixiJS Container that draws a rounded pill XP bar with gradient fill, level label, and animated fill transitions.

**Key considerations:**
- PixiJS v8 Graphics API uses `g.roundRect()` for pill shapes and `g.fill()` with color
- For gradient fill effect, draw two overlapping rounded rects: background (dark) + foreground (colored, width proportional to progress)
- BitmapText for level number (left) and XP text (right)
- Animate fill width over time using the existing tween pattern (elapsed/duration/progress)

```typescript
// XpBar manages its own Container with:
// - Background pill (dark gray rounded rect)
// - Fill pill (gradient-colored rounded rect, width animated)
// - Level text (BitmapText, left side)
// - XP text (BitmapText, right side, e.g. "45/120")
```

**Two sizes needed:**
- **HUD mini bar:** ~150x12px, top-left corner during PlayingState, level number only, no XP text
- **Results bar:** ~400x24px, centered, full labels, animated fill on enter

### Pattern 3: Celebration Overlay

**What:** Full-screen overlay container shown after level-up detection on results screen. Manages particle spawning, scale burst animation, and auto-dismiss.

**Implementation approach:**
- Create a Container added on top of GameOverState's container
- Center a BitmapText showing the new level number, animate scale 0->1.3->1.0 with bounce easing
- Spawn 30-50 particle Graphics (small circles/stars, random colors from a festive palette) with outward velocity from center, apply gravity + fade over 2-3 seconds
- Use the ObjectPool pattern for particles to avoid GC during celebration
- Auto-dismiss after 2.5s, then if another level-up pending, repeat; otherwise show reset XP bar

**Particle physics (simple):**
```typescript
interface Particle {
  graphic: Graphics
  vx: number
  vy: number
  life: number     // 0-1, decreases over time
  gravity: number  // positive = downward
}
// Each frame: x += vx*dt, y += vy*dt + gravity*dt, alpha = life, life -= dt/duration
```

### Pattern 4: Schema Migration v1 to v2

**What:** Extend the existing migration system in `schema.ts` to handle the new profile fields.

**Current pattern:** `migrateIfNeeded()` checks `schemaVersion` against `CURRENT_SCHEMA_VERSION`. If they differ, it maps profiles with defaults for missing fields.

**Extension needed:**
- Bump `CURRENT_SCHEMA_VERSION` from 1 to 2
- Add `xp: 0`, `level: 1`, `unlockedAvatarIds: ['avatar-red', 'avatar-blue', 'avatar-green']` defaults
- The 3 default unlocked avatars are the first 3 in the AVATARS array (ids: avatar-red, avatar-blue, avatar-green)
- Existing profiles keep all their data; only new fields get defaults

### Pattern 5: Avatar Unlock Metadata

**What:** Extend `AvatarDefinition` with an optional `unlockLevel` field. Avatars without it (or with `unlockLevel: 0`) are free from the start.

```typescript
export interface AvatarDefinition {
  id: string
  label: string
  color: number
  shape: 'circle' | 'square' | 'triangle' | 'star' | 'diamond' | 'hexagon'
  unlockLevel?: number  // undefined or 0 = free, >0 = requires this level
}
```

**Mapping (D-13):**
- avatar-red, avatar-blue, avatar-green: free (no unlockLevel)
- avatar-yellow: unlockLevel 3
- avatar-purple: unlockLevel 5
- avatar-orange: unlockLevel 8

### Anti-Patterns to Avoid

- **Storing derived state:** Do not store "xpForNextLevel" or "progressPercent" in the profile. Compute from xp + level at render time. Only store `xp` (cumulative total) and `level`.
- **Coupling XP logic to PixiJS:** The ProgressionManager must have zero PixiJS imports. UI components consume its output.
- **Blocking input during celebration:** The celebration is visual-only; buttons should still be clickable after it auto-dismisses (or even during, for impatient users).
- **Animating XP bar with requestAnimationFrame separately:** Use the existing game loop tick/update pattern. The GameOverState already has update() called each frame.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Easing functions | Custom cubic bezier | Simple quadratic/sine ease-out | The tween system already uses linear interpolation with Math.sin for shake; a simple `easeOutBounce` or `easeOutQuad` helper (5-10 lines) is sufficient for XP bar and scale burst |
| Particle system | Full physics engine | Simple velocity + gravity + life loop | 30-50 particles with linear motion + alpha fade is trivial; no need for a library |
| Gradient fills | Canvas gradient API | Two overlapping PixiJS rects | PixiJS v8 Graphics does not natively support gradients in fill; the standard approach is layering shapes with different colors |

## Common Pitfalls

### Pitfall 1: Multi-Level-Up Animation Sequencing
**What goes wrong:** If a child earns enough XP to jump from level 2 to level 4, the animation must play the full sequence: fill to 100%, celebrate level 3, reset bar, fill to 100%, celebrate level 4, reset bar, show remaining XP. Skipping this makes the experience confusing.
**Why it happens:** Developers calculate the final level and show one celebration, losing the intermediate levels.
**How to avoid:** `applyXp()` returns `levelsGained`. GameOverState maintains a queue of pending level-ups and processes them sequentially with a state machine (filling -> celebrating -> resetting -> filling...).
**Warning signs:** Jumping from level 2 to 4 shows only one celebration.

### Pitfall 2: XP Bar Fill Speed Mismatch
**What goes wrong:** The XP bar animation takes too long or too short, making it feel sluggish or invisible.
**Why it happens:** Using a fixed duration regardless of how much the bar needs to fill.
**How to avoid:** Scale the fill animation duration proportionally to the amount being filled. Base duration ~800ms for a full bar, minimum ~200ms for small fills.
**Warning signs:** Small XP gains take as long to animate as large ones.

### Pitfall 3: Schema Migration Breaking Existing Profiles
**What goes wrong:** Existing v1 profiles lose data or fail to load after the schema bump.
**Why it happens:** The migration function does not properly handle all edge cases (missing fields, partial profiles).
**How to avoid:** Follow the existing migration pattern exactly. Test with profiles that have various combinations of present/missing fields. The migration must be additive only.
**Warning signs:** Existing profiles show "level 0" or crash on load after update.

### Pitfall 4: Locked Avatar Selection on Profile Creation
**What goes wrong:** New profile creation allows selecting locked avatars, but the profile starts at level 1 with only 3 unlocked.
**Why it happens:** The avatar grid in `_renderProfileForm` renders all 6 avatars without checking unlock status.
**How to avoid:** Filter or gray out locked avatars in the creation/edit form. Only allow selection of avatars present in `unlockedAvatarIds`.
**Warning signs:** A child creates a profile with a locked avatar, then it shows as locked on the selection screen.

### Pitfall 5: GameContext Interface Extension Breaking Tests
**What goes wrong:** Adding `getProgression()` to GameContext breaks all existing test mocks that implement the interface.
**Why it happens:** TypeScript strict mode requires all interface methods to be present in mock implementations.
**How to avoid:** Add the new method to the interface and update all mock factories in test files. The existing tests use plain object mocks (not class-based), so adding one property is straightforward.
**Warning signs:** All existing tests fail with "missing property" after the interface change.

### Pitfall 6: saveSessionToProfile Ordering
**What goes wrong:** XP is calculated but level-up detection happens after the profile is already saved, so the level-up state is lost until next load.
**Why it happens:** The current `saveSessionToProfile()` in states.ts updates cumulative stats and saves immediately. XP calculation must happen in that flow.
**How to avoid:** Insert XP calculation and level-up detection into `saveSessionToProfile()` before the `repo.saveAll()` call. Return the XP gain and level-up info so GameOverState can use it for animations.
**Warning signs:** Profile shows correct XP after reload but the celebration never triggers.

## Code Examples

### Integration Point: saveSessionToProfile Extension

The current function (states.ts line 33-76) must be extended to:
1. Calculate XP gain from session result
2. Apply XP to profile, detect level-up
3. Update profile fields (xp, level, unlockedAvatarIds)
4. Return XP gain info for the UI

```typescript
// Return type for the extended function
interface SessionSaveResult {
  xpGain: XpGain
  levelUp: LevelUpResult
  newUnlocks: string[] // avatar IDs unlocked this session
}

function saveSessionToProfile(ctx: GameContext): SessionSaveResult | null {
  const profile = ctx.getActiveProfile()
  const result = ctx.getSessionResult()
  if (!profile || !result) return null

  // ... existing cumulative stats update ...

  // XP calculation
  const xpGain = calculateXpGain(result.hits, result.total, result.mode)
  const levelUp = applyXp(profile.xp, profile.level, xpGain.totalXp)

  profile.xp = levelUp.remainingXp
  profile.level = levelUp.newLevel

  // Check for new avatar unlocks
  const newUnlocks: string[] = []
  for (const avatar of AVATARS) {
    if (
      avatar.unlockLevel &&
      avatar.unlockLevel <= levelUp.newLevel &&
      !profile.unlockedAvatarIds.includes(avatar.id)
    ) {
      profile.unlockedAvatarIds.push(avatar.id)
      newUnlocks.push(avatar.id)
    }
  }

  // ... existing persist logic ...

  return { xpGain, levelUp, newUnlocks }
}
```

### GameOverState Results Screen Flow

The GameOverState.enter() must be restructured to support the animated sequence:

1. Show existing stats (accuracy, items, time) -- immediate, as today
2. Show XP bar at current level progress -- new
3. Animate XP bar filling with earned XP -- new, ~800ms
4. If level-up: animate bar to 100%, show celebration overlay, reset bar, repeat for multi-level-ups -- new
5. Show buttons (Rejouer, Menu) -- after animation completes

This requires giving GameOverState an `update()` method that actually does work (currently a no-op), managing animation phases via a simple state enum.

### Results Screen Animation State Machine

```typescript
type ResultsPhase =
  | 'stats'          // Showing stats, waiting briefly
  | 'xp-filling'     // Animating XP bar fill
  | 'celebrating'    // Full-screen celebration overlay
  | 'xp-resetting'   // Bar resetting for next level (if multi-level-up)
  | 'done'           // All animations complete, buttons active
```

## i18n Strings Needed

```json
{
  "progression.xp.earned": "+{xp} XP",
  "progression.level": "Niv. {level}",
  "progression.levelUp": "Niveau {level} !",
  "progression.avatar.locked": "Niv. {level}",
  "progression.avatar.locked.message": "Atteins le niveau {level} pour debloquer !",
  "progression.avatar.unlocked": "Nouveau personnage !"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| PixiJS Graphics gradients | Layered solid fills or tinting | PixiJS v8 | Use overlapping rectangles for gradient-like XP bar effect |
| Manual frame-by-frame animation | Tween system (elapsed/duration/progress) | Phase 3 | Extend existing tween pattern for XP bar and celebration |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 3.x |
| Config file | vite.config.ts (inline test config) |
| Quick run command | `pnpm vitest run tests/game/progression.test.ts` |
| Full suite command | `pnpm vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROG-01 | XP calculation from session (hits, accuracy, mode) | unit | `pnpm vitest run tests/game/progression.test.ts -t "xp calculation"` | Wave 0 |
| PROG-01 | Word mode 1.5x multiplier | unit | `pnpm vitest run tests/game/progression.test.ts -t "word mode"` | Wave 0 |
| PROG-02 | Level resolution from cumulative XP | unit | `pnpm vitest run tests/game/progression.test.ts -t "level resolution"` | Wave 0 |
| PROG-02 | Multi-level-up detection | unit | `pnpm vitest run tests/game/progression.test.ts -t "multi-level"` | Wave 0 |
| PROG-02 | Schema v1 to v2 migration | unit | `pnpm vitest run tests/persistence/schema.test.ts` | Exists (extend) |
| PROG-03 | Celebration triggered on level-up | manual-only | N/A | N/A (visual) |

### Sampling Rate
- **Per task commit:** `pnpm vitest run tests/game/progression.test.ts tests/persistence/schema.test.ts`
- **Per wave merge:** `pnpm vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `tests/game/progression.test.ts` -- covers PROG-01, PROG-02 (XP formula, level thresholds, multi-level-up)
- [ ] `tests/persistence/schema.test.ts` -- extend with v1->v2 migration test cases

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/game/difficulty.ts` -- DifficultyManager pattern to follow
- Project codebase: `src/persistence/schema.ts` -- schema migration pattern
- Project codebase: `src/persistence/types.ts` -- current ProfileData interface
- Project codebase: `src/game/states.ts` -- GameOverState + saveSessionToProfile
- Project codebase: `src/game/tween.ts` -- existing tween system
- Project codebase: `src/game/pool.ts` -- ObjectPool pattern for particle reuse
- Project codebase: `src/avatars/definitions.ts` -- current avatar definitions
- Project codebase: `src/game/profile-state.ts` -- profile selection UI

### Secondary (MEDIUM confidence)
- PixiJS v8 Graphics API (roundRect, circle, fill) -- verified from codebase usage patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, extends existing codebase patterns
- Architecture: HIGH -- follows established DifficultyManager pattern and existing tween/pool systems
- Pitfalls: HIGH -- identified from direct code analysis of integration points

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable codebase, no external dependency changes)
