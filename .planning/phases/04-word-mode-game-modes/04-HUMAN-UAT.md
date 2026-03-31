---
status: partial
phase: 04-word-mode-game-modes
source: [04-VERIFICATION.md]
started: 2026-03-31T23:30:00.000Z
updated: 2026-03-31T23:30:00.000Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Mode selection buttons visual layout and hover effect
expected: Menu shows two visually distinct buttons ("Lettres" and "Mots") with hover feedback
result: [pending]

### 2. Per-character green highlight when typing a word correctly
expected: In word mode, each correctly typed character changes to green tint while remaining characters stay original color
result: [pending]

### 3. Wrong key shows red flash without resetting the cursor
expected: Typing wrong letter shows red flash + shake on current character, cursor stays at same position (child retries)
result: [pending]

### 4. Session summary text content for both modes
expected: After session, summary shows "Bravo!", accuracy %, items practiced count (with mode label), and time played in mm:ss format
result: [pending]

### 5. Pause overlay appears on blur; timer excludes paused time
expected: Blurring window shows pause overlay, timer stops during pause, Space/Enter to unpause
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
