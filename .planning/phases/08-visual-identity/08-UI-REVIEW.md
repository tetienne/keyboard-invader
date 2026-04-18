# Phase 08 -- UI Review

**Audited:** 2026-04-12
**Baseline:** 08-UI-SPEC.md (approved design contract)
**Screenshots:** Not captured (Playwright CLI not installed; dev server confirmed running on port 5173; code-only audit performed)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | 8 hardcoded French strings and 5 hardcoded English strings bypass the i18n system |
| 2. Visuals | 3/4 | Starfield uses 1 merged layer instead of the specified 3 distinct layers; all other visual elements present |
| 3. Color | 3/4 | Laser bolt uses glow color (0x6b8bf5) instead of the spec-required accent color (0xe94560); two stale old-palette values remain |
| 4. Typography | 2/4 | 11 distinct font sizes in use against a spec that defines 4 canonical roles |
| 5. Spacing | 3/4 | Spacing values are mostly consistent with declared scale; two hardcoded legacy values outside the scale |
| 6. Experience Design | 4/4 | Boot error state, all animation states, escape/dodge tweens, and z-layered containers all correctly implemented |

**Overall: 17/24**

---

## Top 3 Priority Fixes

1. **Hardcoded game strings in PlayingState and GameOverState** -- Children playing in English receive French text mid-game ("Bravo !", "precision", "pratiques", "Temps:", "Rejouer", "Score:") because these strings skip the i18n lookup -- Extract all 8 French-only and 5 mixed strings in `src/game/states.ts` to `fr.json`/`en.json` and replace with `t()` calls.

2. **Typography fragmentation: 11 font sizes against 4 spec roles** -- No size consistency means visual hierarchy is unclear at a glance and future changes require hunting dozens of call sites -- Consolidate to the 4 spec-defined sizes (80, 48, 24, 32px) by mapping the 7 ad-hoc intermediate sizes (14, 18, 20, 22, 28, 36, 38px) to their nearest canonical role; export as constants from `theme.ts`.

3. **Starfield does not implement the 3-layer parallax contract** -- The spec requires three distinct layers (40 far stars / 25 mid / 15 near) with different speeds, alphas, and sizes; the implementation creates 60 undifferentiated stars with randomised properties -- Refactor `src/game/starfield.ts` to create three explicit layer groups matching the spec table so the parallax depth effect is perceptible.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

**Contract compliance check against UI-SPEC.md Copywriting Contract:**

| Spec requirement | Status |
|-----------------|--------|
| Primary CTA "Jouer" / "Play" | PASS -- `t('menu.play')` used via i18n |
| Loading screen "Chargement des aliens..." | PASS -- `t('boot.loading')` in BootState |
| Level-up title "Niveau {N} !" | PASS -- `t('progression.levelUp')` in CelebrationOverlay |
| Error state copy | PASS -- `t('boot.error')` rendered on asset failure |
| Level titles (Cadet, Apprenti...) | PASS -- `getLevelTitle()` reads from LEVEL_TITLES |

**Violations:**

`src/game/states.ts:271` -- `text: 'Keyboard Invader'` -- hardcoded English app title on the menu screen; not in i18n.

`src/game/states.ts:297` -- `text: 'A B C'` -- hardcoded mode label inside the letter-mode button.

`src/game/states.ts:305` -- `text: 'Lettres'` -- French-only mode name below the button.

`src/game/states.ts:328` -- `text: 'MOT'` -- hardcoded word placeholder in word-mode button.

`src/game/states.ts:336` -- `text: 'Mots'` -- French-only mode name below the word button.

`src/game/states.ts:460,547` -- `'Score: 0'` / `'Score: ' + String(this.hits)` -- HUD counter uses hardcoded English prefix throughout the session.

`src/game/states.ts:907` -- `text: 'Bravo !'` -- Game-over congratulation title is hardcoded French.

`src/game/states.ts:919` -- `\`${levelTitle} - Niv. ${String(profile.level)}\`` -- "Niv." prefix is a raw French string; `t('progression.level')` already exists in fr.json and would be appropriate here.

`src/game/states.ts:946` -- `\`${String(accuracy)}% precision\`` -- "precision" is untranslated French.

`src/game/states.ts:955` -- `\`${String(total)} ${itemLabel} pratiques\`` -- "pratiques" is untranslated French.

`src/game/states.ts:964` -- `\`Temps: ${timeStr}\`` -- "Temps:" is untranslated French.

`src/game/states.ts:1033` -- `text: 'Rejouer'` -- Replay CTA is hardcoded French; the spec lists "Rejouer" / "Play again" but it must go through i18n.

`src/game/states.ts:1053` -- `text: 'Menu'` -- Back-to-menu button is a raw string.

`src/game/states.ts:1227` -- `text: 'PAUSE'` -- PausedState (the state-machine class, as opposed to the game.ts overlay) renders a hardcoded string. Note: the actual pause overlay rendered by `game.ts:238` correctly uses `t('game.pause')`. The PausedState class appears to be a redundant state-machine state that is never transitioned to (state machine transitions skip 'paused' state in favour of the game.ts overlay), but the hardcoded string is still a code-quality issue.

**Positive:** All profile-related strings (profiles.title, profiles.edit, profiles.delete, profiles.create.\*) use `t()` correctly. Boot error state uses `t('boot.error')`. Level title system uses the `getLevelTitle()` function correctly.

---

### Pillar 2: Visuals (3/4)

**Contract compliance check against UI-SPEC.md Visual Elements Contract:**

| Element | Spec | Status |
|---------|------|--------|
| Letter alien SVGs | 6 files, 64x64 viewBox | PASS -- 6 files confirmed, all 64x64 |
| Word alien SVGs | 2 files, 128x128 viewBox | PASS -- 2 files confirmed, both 128x128 |
| Avatar SVGs | 6 files (3 kid + 3 alien), 128x128 | PASS -- 6 files confirmed, all 128x128 |
| Spaceship SVG | 64x64, bottom centre, 48px margin | PASS -- Defender at BASE_HEIGHT - 40 (8px off spec's 48px margin) |
| Star particle | 16x16 viewBox | PASS |
| SVG file sizes | Under 2KB each | PASS -- largest is 934B (kid-01.svg) |
| Alien idle bobbing | sin * 3px vertical | PASS -- `Math.sin(this.bobPhase) * 3` |
| Alien blink | Every 2-5 seconds | PASS -- `3 + Math.random() * 2` seconds interval |
| Alien hit reaction | Particle burst, 500ms | PASS -- DestructionEffect.burst(12 particles) |
| Alien dodge reaction | Quick horizontal dodge | PASS -- createDodgeTween() |
| Escape animation | Visible on-screen, 600ms | PASS -- Plan 05 fixed threshold to BASE_HEIGHT - 60 |
| Defender hover bob | Sin pattern, slower than aliens | PASS -- `ds * 2` bob phase |
| LaserBolt | 150ms travel time | PASS (spec says 200ms; actual 150ms -- minor discrepancy) |
| Z-order | bg/entities/effects/defender/HUD | PASS -- addChild order in PlayingState.enter() matches spec |
| Starfield layers | 3 distinct layers (40/25/15 stars) | FAIL |
| UI panels glow border | 12px corner, 2px glow stroke | PASS -- drawSpacePanel() uses UI_CONSTANTS |

**Starfield discrepancy (`src/game/starfield.ts`):**
The spec requires three distinct parallax layers: far (40 stars, 10px/s, alpha 0.3, 1px), mid (25 stars, 25px/s, alpha 0.6, 2px), near (15 stars, 45px/s, alpha 1.0, 3px). The implementation creates 60 undifferentiated stars (`count = 60`) with randomised radius (0.5-2px), speed (10-40px/s), and alpha (0.3-1.0). While visually plausible, the distinct layering effect described in the spec is not achieved. No true parallax separation exists.

**Minor:** Defender is positioned at `BASE_HEIGHT - 40` (680px) vs spec's 48px margin from bottom (`BASE_HEIGHT - 48` = 672px). 8px discrepancy, cosmetically negligible.

**Positive:** All alien SVG designs follow the round/blobby style per D-02. Word aliens use 128x128 and are visually distinct from letter aliens (larger containers). Locked avatar visual correctly applies `alpha = 0.3` and `tint = 0x666666`. CelebrationOverlay uses star sprite particles with warp-speed lines -- matches D-16. All screens have starfield backgrounds.

---

### Pillar 3: Color (3/4)

**Palette compliance check against UI-SPEC.md Canvas Palette:**

All 7 SPACE_PALETTE tokens are correctly defined in `src/game/theme.ts` and all match the spec hex values exactly. CSS tokens in `src/style.css` match: `--color-dominant: #1a1a3e`, `--color-secondary: #2d1b4e`, `--color-glow: #6b8bf5`. The 8-color LETTER_COLORS array exactly matches the spec values.

**Violations:**

`src/game/effects.ts:102` -- LaserBolt uses `color: 0x6b8bf5` (glow color) instead of the spec-required accent color `0xe94560`. The spec states: "Accent reserved for: defender spaceship laser bolt."

`src/game/profile-state.ts:143` -- Level badge background uses `0x16213e` (old pre-phase-08 secondary color). The correct new value is `SPACE_PALETTE.secondary` (0x2d1b4e).

`src/game/profile-state.ts:587` -- HTML name input uses `backgroundColor: '#1a1a2e'` (old dominant color). Should be `'#1a1a3e'` to match `SPACE_PALETTE.background`.

**Accent usage analysis:**
- XP bar fill: `SPACE_PALETTE.accent` via FILL_COLOR constant -- correct
- XP earned text: `0xe94560` hardcoded -- correct value but should reference palette constant
- Celebration level-up text: `0xe94560` hardcoded -- same note
- Primary CTAs (menu buttons): use drawSpacePanel with secondary fill -- matches spec (accent is not the panel background; buttons use secondary fill with glow border)

**Positive:** No accent overuse. Accent appears on 3 elements (XP bar, earned text, celebration text), all within the spec's declared reservation. No hardcoded colors besides the 3 violations above.

---

### Pillar 4: Typography (2/4)

**Contract compliance check against UI-SPEC.md Typography:**

The spec defines 4 BitmapFont roles:

| Role | Spec size | Spec weight |
|------|-----------|-------------|
| Display | 80px | 700 Bold |
| Heading | 48px | 700 Bold |
| Label | 24px | 400 Regular |
| Body | 32px | 400 Regular |

**What is installed:** Two BitmapFont instances: `GameFont` at 80px (weight 400) and `GameFontBold` at 48px (weight 700). Both are Fredoka at resolution 2. This correctly fixes D-22 blurriness.

**Distinct font sizes in use across source:** 14, 18, 20, 22, 24, 28, 36, 38, 48, 80px -- 10 unique sizes.

The spec's 4-role system is not enforced in practice. Examples of divergent usage:
- `fontSize: 14` -- menu button sublabels, edit/delete/new labels (5 occurrences) -- no spec role
- `fontSize: 18` -- HUD level label, profile names, avatar locked labels (10 occurrences) -- no spec role; closest is Label (24px)
- `fontSize: 20` -- pause hint, menu button (2 occurrences) -- no spec role
- `fontSize: 22` -- results stats text (3 occurrences) -- no spec role; closest is Body (32px)
- `fontSize: 28` -- XP earned text, replay button (3 occurrences) -- no spec role
- `fontSize: 36` -- profile title, menu button text (4 occurrences) -- no spec role; between Label and Heading
- `fontSize: 38` -- alien letterLabel inside AlienContainer (2 occurrences) -- near-Display, not spec role

**Note:** The spec's Body role (32px) is not used anywhere. The Display role (80px) is correctly used only in BitmapFont generation (GameFont) and implicitly via the alien container's letterLabel (38px, not 80px -- the alien container uses a smaller size to fit within the 72px sprite).

**BitmapFont weight issue:** `GameFont` is generated at 400 weight (80px), but the spec assigns 400 weight to the Body role (32px) and 700 weight to the Heading role (48px). In practice, `GameFont` is used for almost all text including headings, while `GameFontBold` appears to be unused in the current codebase. Searching confirms no occurrences of `'GameFontBold'` in states.ts or profile-state.ts -- all text uses `'GameFont'`.

**Positive:** All text uses Fredoka (GameFont) -- no font family drift. BitmapFont resolution 2 correctly installed. No system fonts used for canvas text (only for the HTML input overlay, which is appropriate).

---

### Pillar 5: Spacing (3/4)

**Contract compliance check against UI-SPEC.md Spacing Scale:**

The CSS token scale (4/8/16/24/32/48/64px) is correctly defined in `src/style.css`. All canvas-side spacing is expressed in raw pixel values since Tailwind classes don't apply to PixiJS canvas rendering. The audit therefore checks PixiJS position/size values against the declared scale.

**Values matching declared scale:**
- AlienContainer sprite size: 72px (non-scale but reasonable for touch target)
- Panel corner radius: 12px (`UI_CONSTANTS.panelCornerRadius`)
- Panel border: 2px (`UI_CONSTANTS.panelBorderWidth`)
- Touch target min: 44px (`UI_CONSTANTS.touchTargetMin` -- defined but avatar slots use 70-100px, which exceeds minimum; correct)
- HUD XP bar position: x=16, y=24 (within xs/sm scale territory)
- Score text x offset: `BASE_WIDTH - 200` -- 200 is not on the scale but is a layout margin, acceptable
- Spaceship margin: 40px (close to 2xl=48px but not exact -- 8px off)
- Star particle size: 8-16px (within sm-md range)

**Violations:**

`src/game/profile-state.ts:143` -- Badge fill uses `0x16213e` (old palette value, already flagged under Color) -- the badge circle radius of 12px is on-scale.

`src/game/profile-state.ts:587-588` -- HTML input padding is `8px` (correct, matches sm token) but the background color is off-palette (flagged under Color).

`src/game/states.ts:419` -- Word entity edge padding: `wordWidth / 2 + 20` -- the `20` is not on the declared scale (nearest is md=16 or sm=8).

`src/game/starfield.ts` -- Star scatter radius is random (not tied to scale), which is expected for particle art; no issue.

**Positive:** Panel inner radius (12px), HUD bar height (10px XP bar, 20px results XP bar), celebration particle initial size (8-16px range) are all reasonable. No arbitrary CSS `[Npx]` values or inline styles with off-scale values outside of the two noted above.

---

### Pillar 6: Experience Design (4/4)

**State coverage analysis:**

| State | Loading | Error | Empty | Disabled | Confirmation |
|-------|---------|-------|-------|----------|--------------|
| BootState | PASS (t('boot.loading') in i18n, visible in spec) | PASS (t('boot.error') canvas Text rendered) | n/a | n/a | n/a |
| MenuState | n/a | n/a | n/a | n/a | n/a |
| PlayingState | n/a | n/a | n/a | n/a | n/a |
| GameOverState | n/a | n/a | n/a | n/a | n/a |
| ProfileState | n/a | PASS (null texture logged) | PASS (empty profiles -> create view) | PASS (locked avatars visually disabled) | PASS (delete confirmation view) |

**Animation state coverage:**
- Hit: `createHitTween()` -- scale 1.3 + fade, DestructionEffect burst, LaserBolt fire -- all three linked
- Miss: `createDodgeTween()` -- horizontal oscillation returns to baseX
- Escape: `createEscapeTween()` -- fade + shrink + drift, triggered at BASE_HEIGHT - 60 (visible on screen)
- Level-up: CelebrationOverlay with warp lines + 40 star sprites + bounce text animation
- XP fill: Animated fill with easeOutQuad, multi-phase (stats -> filling -> celebrating -> resetting -> done)

**Interaction quality:**
- All interactive elements use `pointerover`/`pointerout` scale feedback (1.1x)
- Locked avatars show tooltip with timed fade-out (2000ms display, 500ms fade)
- HTML input for name entry is properly styled and focused
- Word mode x-constraint prevents edge overflow: `minX = wordWidth/2 + 20`
- Debug overlay (game.ts) toggleable via backtick key -- correctly cleaned up on destroy

**Single finding (minor):** The `PausedState` class in `states.ts` (lines 1215-1252) renders a hardcoded `'PAUSE'` string but the actual pause UI is rendered by `game.ts._showPauseOverlay()` using i18n. The `PausedState` class is never transitioned to by the state machine (no 'paused' transition defined in TRANSITIONS map), making it dead code. This is not a UX issue but creates confusion and a maintenance risk. Score unaffected since the live pause overlay is correct.

---

## Registry Safety

Registry audit: Project uses PixiJS canvas with no shadcn/component registry. `components.json` not present. Registry audit skipped per spec.

---

## Files Audited

- `/Users/Thibaut/git/keyboard-invader/src/game/theme.ts`
- `/Users/Thibaut/git/keyboard-invader/src/style.css`
- `/Users/Thibaut/git/keyboard-invader/src/shared/i18n/fr.json`
- `/Users/Thibaut/git/keyboard-invader/src/shared/i18n/en.json`
- `/Users/Thibaut/git/keyboard-invader/src/game/states.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/profile-state.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/alien-container.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/starfield.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/effects.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/defender.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/xp-bar.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/celebration.ts`
- `/Users/Thibaut/git/keyboard-invader/src/game/tween.ts`
- `/Users/Thibaut/git/keyboard-invader/src/avatars/definitions.ts`
- `/Users/Thibaut/git/keyboard-invader/src/avatars/renderer.ts`
- `/Users/Thibaut/git/keyboard-invader/public/assets/aliens/` (8 SVG files)
- `/Users/Thibaut/git/keyboard-invader/public/assets/avatars/` (6 SVG files)
- `/Users/Thibaut/git/keyboard-invader/public/assets/spaceship.svg`
- `/Users/Thibaut/git/keyboard-invader/public/assets/star.svg`
- `/Users/Thibaut/git/keyboard-invader/.planning/phases/08-visual-identity/08-UI-SPEC.md`
