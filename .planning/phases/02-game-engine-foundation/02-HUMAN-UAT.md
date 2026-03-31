---
status: resolved
phase: 02-game-engine-foundation
source: [02-VERIFICATION.md]
started: 2026-03-30T20:00:00Z
updated: 2026-03-30T20:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. F3 Debug Overlay
expected: Debug overlay visible in top-left corner, FPS reading near 60, state shows 'menu', pool shows '0/20'
result: pass

### 2. Menu interaction — click "Jouer"
expected: Transition to Playing state. Colored red rectangles begin falling from the top of the canvas.
result: pass

### 3. Keyboard destroys objects
expected: Press any letter key during Playing, the lowest on-screen rectangle disappears immediately.
result: pass

### 4. Blur pauses game
expected: Click away from the game window. A semi-transparent overlay with 'PAUSE' text appears. Rectangles stop moving.
result: issue
reported: "Pause works when switching tabs, but clicking browser toolbar/chrome UI does not trigger pause. Also score resets when resuming from pause."
severity: major

### 5. Focus resumes without jump
expected: Click back onto game window while paused. Pause overlay disappears. Rectangles resume falling without sudden jump.
result: issue
reported: "The game is reset — goes back to menu instead of resuming playing state"
severity: major

### 6. Resize letterboxing
expected: Resize window to non-16:9 aspect ratio. Canvas stays centered with black bars. Game area maintains 16:9.
result: pass

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Clicking away from game window pauses the game without losing state"
  status: failed
  reason: "User reported: clicking browser toolbar does not trigger pause. Score resets when resuming from pause."
  severity: major
  test: 4
  artifacts: [src/game/game.ts, src/game/states.ts]
  missing: []
  root_cause: "window 'blur' event does not fire when clicking browser chrome (toolbar, address bar) — only fires when focus leaves the browser window entirely. Need to also listen for pointer/mouse events leaving the canvas element."

- truth: "Resuming from pause continues the game from where it was paused"
  status: failed
  reason: "User reported: game resets to menu instead of resuming playing state on focus"
  severity: major
  test: 5
  artifacts: [src/game/states.ts]
  missing: []
  root_cause: "StateMachine.transition calls exit() on old state then enter() on new state. PlayingState.enter() resets ALL instance state (spawnTimer, totalSpawned, hits, misses, activeEntities). So paused→playing calls enter() which wipes the session. Fix: either (a) don't exit/enter on pause/resume cycle — use a 'suspended' flag, or (b) split PlayingState.enter() into init vs resume paths."
