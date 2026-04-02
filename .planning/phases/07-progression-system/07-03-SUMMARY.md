---
phase: 07-progression-system
plan: 03
subsystem: game
tags: [celebration, particles, level-badges, locked-avatars, progression-ui]

requires:
  - phase: 07-progression-system
    provides: XpBar, SessionSaveResult, CelebrationOverlay wiring point
provides:
  - CelebrationOverlay component with particle effects and bounce animation
  - Level badges on profile screen avatars
  - Locked avatar display with lock icon and encouraging messages
affects:
  - src/game/states.ts (GameOverState celebrating phase)
  - src/game/profile-state.ts (select view, avatar grid)

tech-stack:
  added: []
  patterns:
    - Particle system with gravity for celebration effects
    - Locked/unlocked avatar grid with visual state differentiation

key-files:
  created:
    - src/game/celebration.ts
  modified:
    - src/game/states.ts
    - src/game/profile-state.ts
    - tests/__mocks__/pixi.ts

decisions:
  - Bounce easing for level text (0 to 1.3 to 1.0 over 600ms) for satisfying pop effect
  - Locked avatars use alpha 0.3 plus tint 0x666666 for clear visual distinction
  - Tooltip message fades over last 500ms of 2s display for smooth UX

metrics:
  duration: 3min
  completed: 2026-04-02
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
---

# Phase 07 Plan 03: Celebration & Profile Badges Summary

CelebrationOverlay with 40 color particles, bounce-scale text, and auto-dismiss; profile screen level badges and locked avatar handling with lock icon, level label, and encouraging tap message.

## What Was Built

### Task 1: CelebrationOverlay + GameOverState Wiring
- Created `src/game/celebration.ts` with full-screen overlay: semi-transparent backdrop, BitmapText with bounce animation (0 to 1.3 to 1.0), 40 particles with random colors from celebration palette, gravity at 120 px/s^2, and auto-dismiss at 2500ms
- Replaced placeholder celebrating phase in GameOverState with actual CelebrationOverlay instantiation and lifecycle management
- Multi-level-up support: celebration is created per pending level-up, destroyed on completion, and the next celebration starts if more levels remain

### Task 2: Profile Screen Level Badges + Locked Avatars
- Added level badge (circle radius 12, fill 0x16213e, white stroke) at bottom-right of each avatar in the profile select view
- Locked avatars in create/edit forms: rendered at alpha 0.3, tint 0x666666, with a lock icon (rect body + arc shackle) overlay
- Level requirement label below locked avatars using i18n key `progression.avatar.locked`
- Encouraging message on tap of locked avatar using `progression.avatar.locked.message` with 2s display and 500ms fade-out
- Locked avatars are not selectable; confirm button requires a valid unlocked avatar selection

### Task 3: Visual Verification (Auto-approved)
Auto-approved in auto-advance mode.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 855cac1 | CelebrationOverlay with particles and GameOverState wiring |
| 2 | bb611c2 | Level badges and locked avatar handling on profile screen |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added missing methods to PixiJS mock**
- Found during: Task 2
- Issue: MockGraphics lacked `stroke`, `arc`, `alpha`, and `tint` members needed by the lock icon and grayed avatar rendering
- Fix: Added `stroke`, `arc` as chainable mock fns, `alpha` and `tint` as properties to MockGraphics
- Files modified: tests/__mocks__/pixi.ts
- Commit: bb611c2

## Known Stubs

None. All data flows are wired to real sources (profile.level for badges, AVATAR_DEFINITIONS.unlockLevel for lock state, i18n keys for labels).

## Self-Check: PASSED
