---
phase: 08-visual-identity
reviewed: 2026-04-12T14:30:00Z
depth: standard
files_reviewed: 17
files_reviewed_list:
  - src/avatars/definitions.ts
  - src/avatars/renderer.ts
  - src/game/alien-container.ts
  - src/game/celebration.ts
  - src/game/defender.ts
  - src/game/effects.ts
  - src/game/game.ts
  - src/game/index.ts
  - src/game/letters.ts
  - src/game/profile-state.ts
  - src/game/starfield.ts
  - src/game/states.ts
  - src/game/theme.ts
  - src/game/tween.ts
  - src/game/words.ts
  - src/game/xp-bar.ts
  - src/style.css
findings:
  critical: 1
  warning: 6
  info: 4
  total: 11
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-04-12T14:30:00Z
**Depth:** standard
**Files Reviewed:** 17
**Status:** issues_found

## Summary

Reviewed the visual identity phase files covering avatar system, game rendering pipeline, state machine, effects/tweens, and UI components. The codebase is well-structured with clear separation of concerns (z-layer containers, object pools, state machine pattern). The main concerns are: (1) a potential crash in the avatar renderer when an asset is not yet loaded, (2) several places where `setTimeout` is used inside a game loop component which could fire after destruction, (3) a hardcoded locale string in the pause overlay and XP bar, and (4) a leaked event listener in the debug toggle setup.

## Critical Issues

### CR-01: Assets.get may return undefined if texture not loaded, causing Sprite crash

**File:** `src/avatars/renderer.ts:10`
**Issue:** `Assets.get<Texture>(def.svgPath)` returns `undefined` if the asset has not been loaded yet via `Assets.load()`. Passing `undefined` to `new Sprite(texture)` will cause a runtime error or render a broken sprite. While `BootState` preloads assets listed in `AVATAR_SVG_PATHS`, the `svgPath` values come from `AvatarDefinition` objects. If a definition is added with a path not in `AVATAR_SVG_PATHS` (e.g., a new avatar), or if `drawAvatar` is called before boot completes, this will crash. The same pattern appears in `AlienContainer.getRandomAlienTexture` (line 63) and the pool factories in `game.ts` (lines 58-60, 67-69).
**Fix:** Add a null check or use `Assets.load` with await, or at minimum assert the texture exists:
```typescript
export function drawAvatar(
  container: Container,
  def: AvatarDefinition,
  size: number,
): Sprite | null {
  const texture = Assets.get<Texture>(def.svgPath)
  if (!texture) {
    console.warn(`Avatar texture not loaded: ${def.svgPath}`)
    return null
  }
  const sprite = new Sprite(texture)
  sprite.width = size
  sprite.height = size
  sprite.anchor.set(0.5)
  container.addChild(sprite)
  return sprite
}
```
Note: callers like `profile-state.ts:395` already check `if (avatarSprite)` but only for the locked branch. The unlocked branch does not guard against a null return.

## Warnings

### WR-01: setTimeout in AlienContainer.updateIdle fires after destruction

**File:** `src/game/alien-container.ts:43-45`
**Issue:** The `setTimeout` at line 43 uses a 120ms delay to reset `sprite.scale.y`. Although it checks `this.destroyed`, this is a fragile pattern: if the container is destroyed and immediately reused from the object pool within 120ms, the callback will see `this.destroyed === false` on the recycled instance and mutate state belonging to a new usage context. Object pools reset containers via `reset()` (line 66), which sets `scale.set(1)`, but the stale timeout could overwrite the scale back to 1 at an unexpected time during the new entity's lifecycle.
**Fix:** Use a timer-based approach instead of `setTimeout`, tracking the blink end time and checking it in `updateIdle`:
```typescript
private blinkEndTime = 0

updateIdle(dt: number): void {
  const ds = dt / 1000
  this.bobPhase += ds * 3
  this.sprite.y = Math.sin(this.bobPhase) * 3

  this.blinkTimer += ds
  if (this.blinkEndTime > 0) {
    this.blinkEndTime -= ds
    if (this.blinkEndTime <= 0) {
      this.sprite.scale.y = 1
    }
  } else if (this.blinkTimer > 3 + Math.random() * 2) {
    this.sprite.scale.y = 0.85
    this.blinkTimer = 0
    this.blinkEndTime = 0.12
  }
}
```

### WR-02: BootState swallows asset loading failure silently

**File:** `src/game/states.ts:237-238`
**Issue:** If asset loading fails, the error is logged with `console.error` but the state machine never transitions. The game will remain stuck on the boot state with no user-visible feedback. For a children's game, a blank screen with no indication is a poor experience.
**Fix:** Show an error message to the user or retry:
```typescript
catch (err) {
  console.error('BootState: failed to load assets', err)
  // At minimum, display a visible error message
  const errorText = new BitmapText({
    text: 'Loading failed. Please refresh.',
    style: { fontFamily: 'sans-serif', fontSize: 24 },
  })
  errorText.x = BASE_WIDTH / 2
  errorText.y = BASE_HEIGHT / 2
  ctx.gameRoot.addChild(errorText)
}
```

### WR-03: Event listener leak in debug toggle setup

**File:** `src/game/game.ts:315-321`
**Issue:** The `_setupDebugToggle` method adds a `keydown` listener to `window` but never stores a reference to it. The `destroy()` method at line 323 calls `_cleanupVisibility?.()` and `_input.detach()` but there is no cleanup for the F3 debug listener. Each time `Game` is instantiated (if ever re-created), a new listener accumulates.
**Fix:** Store the listener reference and remove it in `destroy()`:
```typescript
private _cleanupDebug: (() => void) | null = null

private _setupDebugToggle(): void {
  const onDebugKey = (e: KeyboardEvent): void => {
    if (e.key === 'F3') {
      e.preventDefault()
      this._debug.toggle()
    }
  }
  window.addEventListener('keydown', onDebugKey)
  this._cleanupDebug = () => window.removeEventListener('keydown', onDebugKey)
}

destroy(): void {
  this._cleanupCanvas?.()
  this._cleanupVisibility?.()
  this._cleanupDebug?.()
  // ...
}
```

### WR-04: Hardcoded French strings bypass i18n system

**File:** `src/game/game.ts:234` and `src/game/game.ts:241`
**Issue:** The pause overlay text "PAUSE" (line 234) and "Appuie sur Espace pour continuer" (line 241) are hardcoded in French, bypassing the `t()` i18n function used everywhere else. Similarly, `xp-bar.ts:55` hardcodes `'Niv. 1'` and line 95 uses `'Niv. ${...}'`. The game is designed to support both French and English.
**Fix:** Use the i18n system:
```typescript
// game.ts
const text = new BitmapText({ text: t('game.pause'), ... })
const hint = new BitmapText({ text: t('game.pauseHint'), ... })

// xp-bar.ts
this.levelText.text = t('progression.level').replace('{level}', String(level))
```

### WR-05: Duplicate tween update logic between _updateTweens and _updateWordTweens

**File:** `src/game/states.ts:850-880`
**Issue:** `_updateTweens` (line 850) and `_updateWordTweens` (line 866) are identical in logic -- they differ only in the type parameter (`LetterEntity[]` vs `WordEntity[]`). Both `LetterEntity` and `WordEntity` share the same tween-related fields (`tween`, `container`, `baseX`). This duplication means any bug fix must be applied in two places. Given both interfaces share a compatible shape, a single generic function would work.
**Fix:** Extract a common interface and use a single method:
```typescript
interface TweenableEntity {
  container: AlienContainer
  baseX: number
  tween: LetterTween | null
}

private _updateEntityTweens(entities: TweenableEntity[], dt: number): void {
  for (const entity of entities) {
    if (entity.tween !== null) {
      const done = updateTween(entity, dt)
      if (done) {
        if (entity.tween.type === 'miss' || entity.tween.type === 'dodge' || entity.tween.type === 'escape') {
          entity.container.x = entity.baseX
        }
        entity.tween = null
      }
    }
  }
}
```

### WR-06: Non-null assertion on saveResult in celebrating phase

**File:** `src/game/states.ts:1189-1193`
**Issue:** `this.saveResult!` is used with non-null assertion operator at lines 1189 and 1190. While the flow from `enter()` should guarantee `saveResult` is non-null when `pendingLevelUps > 0`, the celebrating phase is reached asynchronously through timer-driven state transitions. If `exit()` is called mid-celebration (e.g., game force-quits), the code at `xp-resetting` phase (line 1207) could also run after `saveResult` is nullified. The `exit()` method sets `this.saveResult = null` at line 1120.
**Fix:** Add a guard:
```typescript
if (!this.saveResult) {
  this.resultsPhase = 'done'
  break
}
```

## Info

### IN-01: Unused AVATAR_SVG_PATHS duplicates data from AVATARS definitions

**File:** `src/game/theme.ts:66-73`
**Issue:** `AVATAR_SVG_PATHS` is a separate `Record<string, string>` that duplicates the `id -> svgPath` mapping already present in the `AVATARS` array in `definitions.ts`. This creates a maintenance burden: adding a new avatar requires updating both `AVATARS` and `AVATAR_SVG_PATHS`. The `AVATAR_SVG_PATHS` is only used in `BootState` to preload textures.
**Fix:** Derive the paths from `AVATARS` instead:
```typescript
// In BootState enter():
const avatarPaths = AVATARS.map(a => a.svgPath)
const assetPaths = [...ALIEN_TEXTURES_PATHS, ...WORD_ALIEN_TEXTURE_PATHS, SPACESHIP_PATH, STAR_PARTICLE_PATH, ...avatarPaths]
```

### IN-02: Hardcoded French labels in MenuState and GameOverState

**File:** `src/game/states.ts:300-313` and `src/game/states.ts:917-965`
**Issue:** Several UI strings are in French without using the `t()` function: "A B C" (line 300), "Lettres" (line 309), "MOT" (line 331), "Mots" (line 339), "Score:" (line 554), "Bravo !" (line 917), "precision" (line 957), "pratiques" (line 965), "Temps:" (line 974), "Rejouer" (line 1044), "Menu" (line 1065). These should use i18n keys for English support.
**Fix:** Add corresponding translation keys and use `t()` for each string.

### IN-03: Magic number 60 repeated for bottom detection threshold

**File:** `src/game/states.ts:566` and `src/game/states.ts:578`
**Issue:** The value `BASE_HEIGHT - 60` is used as the bottom detection threshold in two places. This magic number should be a named constant for clarity and single-point-of-change.
**Fix:**
```typescript
private readonly BOTTOM_THRESHOLD = BASE_HEIGHT - 60
```

### IN-04: Blinking randomness recalculated every frame

**File:** `src/game/alien-container.ts:40`
**Issue:** `3 + Math.random() * 2` is evaluated every frame when checking the blink timer. This means the threshold changes every frame, making the blink timing unpredictable in a non-uniform way. While not a bug (it still triggers eventually), the intent is likely "blink every 3-5 seconds" which would be better served by picking a random interval once when a blink completes.
**Fix:** Store the next blink threshold:
```typescript
private nextBlinkAt = 3 + Math.random() * 2

updateIdle(dt: number): void {
  // ...
  this.blinkTimer += ds
  if (this.blinkTimer > this.nextBlinkAt) {
    this.sprite.scale.y = 0.85
    this.blinkTimer = 0
    this.nextBlinkAt = 3 + Math.random() * 2
    // ...
  }
}
```

---

_Reviewed: 2026-04-12T14:30:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
