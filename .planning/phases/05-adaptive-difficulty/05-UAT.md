---
status: complete
phase: 05-adaptive-difficulty
source:
  - 05-01-SUMMARY.md
  - 05-02-SUMMARY.md
  - 05-VERIFICATION.md (Human Verification Required section)
started: 2026-04-28T00:00:00Z
updated: 2026-04-28T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Debug Overlay Shows Adaptive Difficulty Params
expected: |
  Start any game mode (letter or word). Press F3 to toggle the debug overlay.
  You should see three live values: Speed (px/s), Spawn (ms interval),
  and Complexity (level 0/1/2). After missing several items in a row,
  Speed decreases and Spawn increases within ~10 items.
result: pass
notes: F3 overlay also shows pool, fps, and state values — extra fields are expected (not an issue).

### 2. Dead Zone Holds Steady Around 70% Accuracy
expected: |
  Start a fresh letter session. For the first 10 letters, deliberately mix
  hits and misses targeting roughly 7/10 correct. After the rolling window of
  10 fills, on subsequent letters the Speed and Spawn values in the F3 debug
  overlay should NOT drift — they hold steady because 70% accuracy falls
  inside the 60–80% dead zone.
result: pass

### 3. Adaptive Ramp Increases Difficulty When Hitting Everything
expected: |
  Start a fresh letter session. Hit every letter correctly. After the first
  10 correct hits, letters fall noticeably faster (Speed value goes up in F3)
  and/or appear more frequently (Spawn value goes down). After 5+ more
  consecutive correct hits at >80% accuracy, Complexity should increment
  (0 → 1, then 1 → 2), unlocking harder letters (top-row keys) in the pool.
result: pass

### 4. Difficulty Resets Each New Session
expected: |
  After driving difficulty up or down in one session (game over or back to
  menu), start a new session. The F3 overlay should show Speed and Spawn
  back at the baseline preset values, and Complexity at 0 — not the
  end-of-previous-session values.
result: pass

### 5. Word Mode Records Per-Word, Not Per-Keystroke
expected: |
  Start a word session. Type a 5-letter word with one or two wrong keystrokes
  in the middle, but eventually complete the word correctly. The completion
  should count as one HIT in the difficulty window (not multiple misses).
  Verify by watching the F3 overlay: Speed/Spawn shouldn't dip just because
  you typed a couple of wrong letters mid-word.
result: pass

### 6. Bottom-Reaching Items Count as Misses
expected: |
  Let several letters/words fall all the way to the bottom without typing
  them. The score counter shows misses, AND in the F3 overlay you should see
  Speed decrease / Spawn increase shortly after — the difficulty window is
  recording bottoms as misses, not just keystroke errors.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]

## Notes

- Phase 5's original VERIFICATION.md gap (`vite.config.ts` not excluding
  `.claude/**`) was closed by Phase 8.3 plan 03 (verified `.claude/**` is
  in `vite.config.ts:14` `test.exclude`). That gap is no longer outstanding
  — only the 3 originally-deferred human-verification items remain, plus
  3 derived behavioral checks (D-04 reset, D-09 word-mode policy, D-13/14
  bottom-as-miss policy).
- Run the dev server before starting: `pnpm dev`
- F3 toggles the debug overlay (per `src/game/debug.ts`)
