---
phase: 08-visual-identity
plan: 02
subsystem: game-engine
tags: [pixi.js, alien-container, starfield, particles, tween, entity-refactor]

requires:
  - phase: 08-visual-identity-01
    provides: Theme constants, SVG assets, font loading, ALIEN_TEXTURES_PATHS, SPACESHIP_PATH, STAR_PARTICLE_PATH
provides:
  - AlienContainer class wrapping Sprite + BitmapText for letter/word entities
  - Starfield parallax background with 3 depth layers
  - DestructionEffect particle burst system
  - LaserBolt visual from defender to target
  - Defender spaceship with hover animation
  - Extended tween types (dodge, escape)
  - Refactored entity interfaces using AlienContainer
  - WordEntity.splitText: SplitBitmapText contract for per-character tinting
affects: [08-visual-identity-03, 08-visual-identity-04]

tech-stack:
  added: []
  patterns:
    - "AlienContainer extends Container (wraps Sprite + BitmapText)"
    - "Entity container pattern: entity.container instead of entity.text"
    - "SplitBitmapText as child of AlienContainer for word mode"
    - "Pool factory creates AlienContainers with alien sprites"

key-files:
  created:
    - src/game/alien-container.ts
    - src/game/starfield.ts
    - src/game/effects.ts
    - src/game/defender.ts
    - tests/game/alien-container.test.ts
    - tests/game/starfield.test.ts
    - tests/game/effects.test.ts
  modified:
    - src/game/tween.ts
    - src/game/letters.ts
    - src/game/words.ts
    - src/game/game.ts
    - src/game/states.ts
    - src/game/index.ts
    - tests/game/tween.test.ts
    - tests/game/letters.test.ts
    - tests/game/words.test.ts
    - tests/__mocks__/pixi.ts

key-decisions:
  - "letterLabel instead of label on AlienContainer (label is reserved by PixiJS Container)"
  - "Graphics-based particles instead of ParticleContainer (v8 API changed significantly)"
  - "SplitBitmapText uses pivot not anchor for centering (extends Container not BitmapText)"
  - "Tween no longer controls tint directly (removed from TweenTarget interface)"

patterns-established:
  - "Entity container pattern: LetterEntity.container and WordEntity.container are AlienContainers"
  - "WordEntity.splitText: SplitBitmapText is the contract for per-character tinting downstream"

requirements-completed: [AV-01]

duration: 10min
completed: 2026-04-03
---

# Phase 08 Plan 02: Gameplay Visual System Summary

**AlienContainer entity system with parallax starfield, particle effects, defender spaceship, and dodge/escape tween animations**

## Performance

- **Duration:** 10 min
- **Started:** 2026-04-03T19:44:11Z
- **Completed:** 2026-04-03T19:54:51Z
- **Tasks:** 2
- **Files modified:** 18

## Accomplishments
- AlienContainer wraps alien Sprite + BitmapText label with idle bobbing and blink animation
- 3-layer parallax starfield background with difficulty-based intensity control
- DestructionEffect produces radial star particle bursts, LaserBolt fires accent-colored fading bolts
- Defender spaceship with hover bob at screen bottom
- Tween system extended with dodge (horizontal oscillation) and escape (accelerate + fade) types
- Complete entity interface refactor: LetterEntity and WordEntity use AlienContainer instead of bare BitmapText
- WordEntity exposes splitText: SplitBitmapText for downstream per-character tinting

## Task Commits

Each task was committed atomically:

1. **Task 1: AlienContainer, Starfield, Effects, Defender modules + tween extensions** - `e754614` (feat)
2. **Task 2: Refactor entity interfaces, pools, and Game class for AlienContainer** - `a52a8cb` (feat)

## Files Created/Modified
- `src/game/alien-container.ts` - AlienContainer class: Sprite + BitmapText with idle bob/blink
- `src/game/starfield.ts` - 3-layer parallax starfield with intensity control
- `src/game/effects.ts` - DestructionEffect (particle burst) and LaserBolt (fading line)
- `src/game/defender.ts` - Defender spaceship with hover bob
- `src/game/tween.ts` - Added dodge and escape tween types + factory functions
- `src/game/letters.ts` - LetterEntity uses container: AlienContainer, removed LETTER_COLORS
- `src/game/words.ts` - WordEntity uses container: AlienContainer + splitText: SplitBitmapText
- `src/game/game.ts` - Pool factories create AlienContainers, word pool includes SplitBitmapText
- `src/game/states.ts` - All entity references updated to container/splitText pattern
- `src/game/index.ts` - LETTER_COLORS re-exported from theme.ts
- `tests/__mocks__/pixi.ts` - Added MockSprite, MockTexture, scale.set on MockGraphics, anchor on MockSplitBitmapText

## Decisions Made
- Renamed `label` to `letterLabel` on AlienContainer because `label` is a reserved property on PixiJS Container base class
- Used Graphics-based particles for DestructionEffect instead of ParticleContainer since the v8 API changed significantly
- SplitBitmapText uses pivot for centering (not anchor) since it extends Container, not BitmapText
- Removed tint control from TweenTarget interface since tint is now managed by AlienContainer's letterLabel

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated states.ts for entity interface compatibility**
- **Found during:** Task 2
- **Issue:** states.ts heavily uses entity.text.* which breaks when LetterEntity/WordEntity interfaces change
- **Fix:** Updated all entity.text references to entity.container, all entity.text.chars to entity.splitText.chars
- **Files modified:** src/game/states.ts
- **Verification:** TypeScript compiles clean, all 196 tests pass
- **Committed in:** a52a8cb (Task 2 commit)

**2. [Rule 1 - Bug] Renamed label to letterLabel on AlienContainer**
- **Found during:** Task 2
- **Issue:** PixiJS Container already has a `label` property (type string), causing TS2416 type conflict
- **Fix:** Renamed to `letterLabel` throughout
- **Files modified:** src/game/alien-container.ts, src/game/game.ts, tests/game/alien-container.test.ts
- **Verification:** TypeScript compiles clean
- **Committed in:** a52a8cb (Task 2 commit)

**3. [Rule 1 - Bug] Removed anchor.set on SplitBitmapText in word pool factory**
- **Found during:** Task 2
- **Issue:** SplitBitmapText extends Container (not BitmapText), has no anchor property
- **Fix:** Removed anchor.set call (pivot can be set later when text content is known)
- **Files modified:** src/game/game.ts
- **Committed in:** a52a8cb (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None - all modules are fully implemented with working animations and entity integration.

## Next Phase Readiness
- AlienContainer, Starfield, Effects, Defender ready for Plan 03 (integration into PlayingState)
- WordEntity.splitText contract established for Plan 03 per-character tinting
- Tween dodge/escape types ready for gameplay wiring

---
*Phase: 08-visual-identity*
*Completed: 2026-04-03*
