---
phase: 08-visual-identity
fixed_at: 2026-04-12T08:28:22Z
review_path: .planning/phases/08-visual-identity/08-REVIEW.md
iteration: 1
findings_in_scope: 7
fixed: 7
skipped: 0
status: all_fixed
---

# Phase 08: Code Review Fix Report

**Fixed at:** 2026-04-12T08:28:22Z
**Source review:** .planning/phases/08-visual-identity/08-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 7
- Fixed: 7
- Skipped: 0

## Fixed Issues

### CR-01: Assets.get may return undefined if texture not loaded, causing Sprite crash

**Files modified:** `src/avatars/renderer.ts`, `src/game/alien-container.ts`, `src/game/game.ts`
**Commit:** 80dc4e6
**Applied fix:** Added `safeGetTexture()` helper in each file that casts `Assets.get<Texture>()` to `Texture | undefined` (since PixiJS types claim it always returns T but runtime can return undefined). `drawAvatar` now returns `Sprite | null` with a null guard. `AlienContainer.getRandomAlienTexture` falls back to `Texture.WHITE`. Pool factories in `game.ts` use nullish coalescing to fall back to `Texture.WHITE`. Also fixed pre-existing ESLint issues (non-null assertions on array access, type-only imports) in the same files to allow the commit to pass hooks.

### WR-01: setTimeout in AlienContainer.updateIdle fires after destruction

**Files modified:** `src/game/alien-container.ts`
**Commit:** 4835ed2
**Applied fix:** Replaced `setTimeout` blink pattern with a timer-based approach using a `blinkEndTime` field. The `updateIdle` method now tracks blink end time via delta-time decrements instead of scheduling a callback. Added `blinkEndTime` reset in the `reset()` method to prevent stale state when the container is recycled from the object pool.

### WR-02: BootState swallows asset loading failure silently

**Files modified:** `src/game/states.ts`
**Commit:** e9a84ce
**Applied fix:** Added a user-visible error message in the catch block using PixiJS `Text` (canvas-based, not BitmapText) since BitmapFont may not be loaded when the error occurs. Uses the existing `boot.error` i18n key for the message text. Also fixed pre-existing ESLint issues in the same file (unnecessary type assertions, nullish coalescing preference) and applied WR-06 fix in the same commit since both are in the same file.

### WR-03: Event listener leak in debug toggle setup

**Files modified:** `src/game/game.ts`
**Commit:** e8a05ad
**Applied fix:** Added `_cleanupDebug` field to store a cleanup function. `_setupDebugToggle` now creates a named `onDebugKey` handler, stores its removal in `_cleanupDebug`, and `destroy()` invokes the cleanup alongside the existing `_cleanupCanvas` and `_cleanupVisibility` calls.

### WR-04: Hardcoded French strings bypass i18n system

**Files modified:** `src/game/game.ts`, `src/game/xp-bar.ts`, `src/shared/i18n/fr.json`, `src/shared/i18n/en.json`
**Commit:** cea1c31
**Applied fix:** Added `game.pause` and `game.pauseHint` translation keys to both fr.json and en.json. Updated pause overlay in `game.ts` to use `t('game.pause')` and `t('game.pauseHint')`. Updated all three "Niv." occurrences in `xp-bar.ts` (constructor, `setProgress`, `setLevel`) to use `t('progression.level').replace('{level}', ...)` which maps to the existing translation key.

### WR-05: Duplicate tween update logic between _updateTweens and _updateWordTweens

**Files modified:** `src/game/states.ts`
**Commit:** ad258da
**Applied fix:** Merged `_updateTweens` and `_updateWordTweens` into a single `_updateEntityTweens` method that accepts an array of objects with the shared shape `{ container: AlienContainer; baseX: number; tween: LetterTween | null }`. Both `LetterEntity[]` and `WordEntity[]` satisfy this interface. Updated the two call sites to use the unified method. Also simplified the tween-null assignment (removed redundant else branch).

### WR-06: Non-null assertion on saveResult in celebrating phase

**Files modified:** `src/game/states.ts`
**Commit:** e9a84ce
**Applied fix:** Added a null guard `if (!this.saveResult)` before accessing `saveResult.levelUp` in the celebrating phase. If `saveResult` is null (e.g., due to an early `exit()` call), the code now skips to `'done'` phase instead of crashing. Removed the non-null assertions (`!`) that ESLint flagged. This is a logic fix: requires human verification.

## Skipped Issues

None -- all findings were fixed.

---

_Fixed: 2026-04-12T08:28:22Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
