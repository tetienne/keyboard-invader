---
status: partial
phase: 02-game-engine-foundation
source: [02-VERIFICATION.md]
started: 2026-03-30T20:00:00Z
updated: 2026-03-30T20:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. F3 Debug Overlay
expected: Debug overlay visible in top-left corner, FPS reading near 60, state shows 'menu', pool shows '0/20'
result: [pending]

### 2. Menu interaction — click "Jouer"
expected: Transition to Playing state. Colored red rectangles begin falling from the top of the canvas.
result: [pending]

### 3. Keyboard destroys objects
expected: Press any letter key during Playing, the lowest on-screen rectangle disappears immediately.
result: [pending]

### 4. Blur pauses game
expected: Click away from the game window. A semi-transparent overlay with 'PAUSE' text appears. Rectangles stop moving.
result: [pending]

### 5. Focus resumes without jump
expected: Click back onto game window while paused. Pause overlay disappears. Rectangles resume falling without sudden jump.
result: [pending]

### 6. Resize letterboxing
expected: Resize window to non-16:9 aspect ratio. Canvas stays centered with black bars. Game area maintains 16:9.
result: [pending]

## Summary

total: 6
passed: 0
issues: 0
pending: 6
skipped: 0
blocked: 0

## Gaps
