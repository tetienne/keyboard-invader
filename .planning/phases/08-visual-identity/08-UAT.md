---
status: diagnosed
phase: 08-visual-identity
source: 08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md
started: 2026-04-12T07:41:00Z
updated: 2026-04-12T07:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Space Color Palette
expected: Deep purple background (#1a1a3e) visible across all screens (profile, menu, gameplay, game over). Bright harmonized colors for aliens and UI elements.
result: pass
note: Auto-verified via Playwright screenshots (profile, menu, letter mode, word mode screens)

### 2. Fredoka Font
expected: Rounded, child-friendly Fredoka font renders clearly on all text — titles, buttons, HUD, profile names. No fallback to system fonts.
result: pass
note: Auto-verified via Playwright screenshots — Fredoka visible on "Keyboard Invader", "Nouveau profil", HUD text, button labels

### 3. Starfield Background (All Screens)
expected: Animated starfield with small white dots/stars visible on profile selection, menu, gameplay, and game over screens. Stars at multiple depth layers.
result: pass
note: Auto-verified via Playwright screenshots — starfield dots visible on all captured screens (profile, menu, letter mode, word mode)

### 4. SVG Avatars on Profile Screen
expected: Profile creation shows 3 unlocked SVG avatars (2 kid faces + 1 alien) and 3 locked avatars with lock icon overlay and level requirement labels (Niv. 3, Niv. 5, Niv. 8). Locked avatars appear dimmed.
result: pass
note: Auto-verified via Playwright screenshot (uat-08-boot.png) — all 6 avatars visible with correct locked/unlocked states

### 5. Alien Containers in Letter Mode
expected: Falling letters appear inside colored alien sprite containers (not plain text). Multiple alien shapes with different colors. White letter text visible on the alien body.
result: pass
note: Auto-verified via Playwright screenshot (uat-08-letter-mode.png) — cyan, orange, yellow, pink aliens with white letters D, S, K, L, A visible

### 6. Alien Containers in Word Mode
expected: Falling words appear with alien sprite decorations. Words are readable with BitmapText inside or beside the alien character.
result: pass
note: Auto-verified via Playwright screenshot (uat-08-word-mode.png) — "CLUB" and "BRAS" visible with round green alien sprites

### 7. Space Panel Menu Buttons
expected: Menu mode selection buttons ("A B C / Lettres" and "MOT / Mots") have glow-bordered space panel styling with rounded corners and purple tinting.
result: pass
note: Auto-verified via Playwright screenshot (uat-08-menu.png) — both buttons have visible glow borders and space theme styling

### 8. Defender Spaceship
expected: A spaceship sprite sits at the bottom center of the gameplay screen with a subtle hover/bob animation.
result: pass
note: Auto-verified via Playwright screenshots (uat-08-letter-mode.png, uat-08-word-mode.png) — spaceship visible at bottom center on both modes

### 9. Destruction Effects on Correct Hit
expected: In letter mode, pressing the correct key triggers a laser bolt from the defender to the alien, followed by a particle burst (star-shaped particles radiating outward). The alien disappears after the effect.
result: pass

### 10. Dodge/Escape Tweens on Miss
expected: When a letter reaches the bottom without being typed, it plays a dodge or escape animation (horizontal oscillation or accelerate + fade) rather than just disappearing.
result: issue
reported: "no"
severity: major

### 11. Celebration Star Particles
expected: At the end of a session or on level-up, a celebration overlay plays with star-shaped sprite particles and warp speed line effects.
result: pass

### 12. 60fps Performance (4x CPU Throttle)
expected: With Chrome DevTools 4x CPU throttle enabled, the game maintains smooth rendering at or near 60fps during letter mode gameplay with multiple aliens on screen. No visible jank or frame drops.
result: pass

## Summary

total: 12
passed: 11
issues: 1
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "When a letter reaches the bottom without being typed, it plays a dodge or escape animation (horizontal oscillation or accelerate + fade) rather than just disappearing."
  status: failed
  reason: "User reported: no"
  severity: major
  test: 10
  root_cause: "In _updateTweens() and _updateWordTweens() (states.ts ~L855-876), escape tweens fall into the else branch on completion, setting entity.tween=null immediately. The cleanup pass then removes the entity before the animation renders because markedForRemoval is true and tween is null."
  artifacts:
    - path: "src/game/states.ts"
      issue: "_updateTweens completion handler does not include 'escape' type in the reset branch — escape tween nullified prematurely"
  missing:
    - "Add 'escape' to the tween type check alongside 'miss' and 'dodge' in _updateTweens and _updateWordTweens completion handlers"
  debug_session: ""
