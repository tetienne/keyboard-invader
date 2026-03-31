---
status: partial
phase: 03-letter-mode-gameplay
source: [03-VERIFICATION.md]
started: 2026-03-30T22:00:00Z
updated: 2026-03-30T22:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Letters fall visually
expected: Large colorful BitmapText letters fall from top at gentle pace (~80px/sec). Letters are ~80px, bright colors from kid-friendly palette.
result: [pending]

### 2. Correct keypress animation
expected: Pressing the matching key triggers green flash (tint 0x4ade80), scale up to 1.3x, and fade out over ~300ms. Letter disappears after animation.
result: [pending]

### 3. Incorrect keypress feedback
expected: Pressing wrong key shows red flash (tint 0xef4444) + horizontal shake on the lowest letter. No punishment, letter continues falling.
result: [pending]

### 4. Bottom letters fade silently
expected: Letters reaching bottom of canvas fade out silently. No game over, no life lost, session continues.
result: [pending]

### 5. Results screen after session
expected: After 20 letters, transition to results screen showing "Bravo !", hit/miss stats, accuracy percentage, and "Rejouer" + "Menu" buttons.
result: [pending]

### 6. Rejouer restarts gameplay
expected: Clicking "Rejouer" on results screen starts a new playing session. Clicking "Menu" returns to menu state.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
