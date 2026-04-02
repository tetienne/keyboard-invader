---
phase: 07-progression-system
plan: 01
subsystem: game
tags: [xp, leveling, progression, schema-migration, i18n]

requires:
  - phase: 03-letter-mode-gameplay
    provides: GameMode type, SessionResult interface
provides:
  - Pure logic XP calculation module (calculateXpGain, resolveLevel, applyXp, xpForCurrentLevel)
  - LEVEL_THRESHOLDS and MAX_LEVEL constants
  - Schema v2 migration with xp, level, unlockedAvatarIds fields
  - Avatar unlock level metadata
  - 6 progression i18n keys in fr/en
affects: [07-02, 07-03, 08-visual-identity]

tech-stack:
  added: []
  patterns: [pure-logic-module-no-pixi, schema-versioned-migration, additive-field-defaults]

key-files:
  created:
    - src/game/progression.ts
    - src/game/difficulty.ts
    - src/persistence/types.ts
    - src/persistence/schema.ts
    - src/avatars/definitions.ts
    - tests/game/progression.test.ts
    - tests/persistence/schema.test.ts
  modified:
    - src/game/types.ts
    - src/shared/i18n/fr.json
    - src/shared/i18n/en.json

key-decisions:
  - "LEVEL_THRESHOLDS: 10 levels [0,50,120,220,360,540,780,1080,1440,1900] for 2-8 session pacing"
  - "XP formula: 2 per hit + accuracy bonus (baseXp * accuracy * 0.5) with 1.5x words multiplier"
  - "3 free avatars (red, blue, green), 3 locked (yellow@3, purple@5, orange@8)"

patterns-established:
  - "Pure logic modules: game calculations in separate .ts files with zero PixiJS imports"
  - "Schema migration: additive field defaults with version check in migrateIfNeeded"

requirements-completed: [PROG-01, PROG-02]

duration: 3min
completed: 2026-04-02
---

# Phase 7 Plan 01: Progression Data Layer Summary

**Pure XP/level calculation module with schema v2 migration, avatar unlock metadata, and i18n progression strings**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T07:58:54Z
- **Completed:** 2026-04-02T08:02:46Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- XP calculation module with accuracy bonus and mode multiplier, fully unit-tested (19 tests)
- Schema v2 migration adding xp, level, unlockedAvatarIds to ProfileData with backward-compatible defaults
- Avatar definitions extended with unlockLevel metadata for 3 locked avatars
- 6 progression i18n keys added in both French and English

## Task Commits

Each task was committed atomically:

1. **Task 1: ProgressionManager pure logic module + unit tests** - TDD
   - RED: `207d96e` (test) - failing tests for XP and level resolution
   - GREEN: `652b309` (feat) - implement progression module, 19 tests pass
2. **Task 2: Schema migration v2, ProfileData extension, avatar unlock, i18n** - `fb07d06` (feat)

## Files Created/Modified
- `src/game/progression.ts` - XP calculation, level resolution, level-up detection (pure logic)
- `src/game/difficulty.ts` - DifficultyParams/DifficultyManager (prerequisite for persistence types)
- `src/game/types.ts` - Added GameMode type
- `src/persistence/types.ts` - ProfileData with xp/level/unlockedAvatarIds, CURRENT_SCHEMA_VERSION=2
- `src/persistence/schema.ts` - migrateIfNeeded with v0->v2 and v1->v2 migration paths
- `src/avatars/definitions.ts` - AvatarDefinition with optional unlockLevel field
- `src/shared/i18n/fr.json` - 6 progression keys in French
- `src/shared/i18n/en.json` - 6 progression keys in English
- `tests/game/progression.test.ts` - 19 unit tests for XP/level functions
- `tests/persistence/schema.test.ts` - 7 tests for schema migration

## Decisions Made
- LEVEL_THRESHOLDS designed for early-fast, later-slow pacing: level 2 at ~2 sessions, level 10 at ~8 sessions
- XP formula uses 2 XP/hit base with accuracy scaling, providing meaningful reward for precision
- 3 free avatars available from start, 3 locked at levels 3, 5, and 8 for progression motivation

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Created prerequisite files from Phase 5/6 not yet in worktree**
- **Found during:** Task 2 (schema migration)
- **Issue:** This worktree runs in parallel and lacks files from Phases 4-6 (difficulty.ts, persistence/types.ts, persistence/schema.ts, avatars/definitions.ts)
- **Fix:** Created the prerequisite files matching the shapes from other parallel agents' worktrees
- **Files created:** src/game/difficulty.ts, src/persistence/types.ts, src/persistence/schema.ts, src/avatars/definitions.ts
- **Verification:** Full test suite (107 tests) passes
- **Committed in:** fb07d06

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Prerequisite files created to unblock parallel execution. No scope creep; files match exactly what other agents are building.

## Issues Encountered
None beyond the prerequisite file creation documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- XP/level contracts ready for UI plans (07-02: XP bar overlay, 07-03: level-up celebration)
- Schema migration tested and ready for profile persistence integration
- Avatar unlock metadata ready for profile selection UI filtering

---
*Phase: 07-progression-system*
*Completed: 2026-04-02*
