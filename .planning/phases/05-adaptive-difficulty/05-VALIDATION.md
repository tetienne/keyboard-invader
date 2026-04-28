---
phase: 05
slug: adaptive-difficulty
status: validated
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-31
audited: 2026-04-28
---

# Phase 05 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `vite.config.ts` (inline test config) |
| **Quick run command** | `mise exec -- pnpm test` |
| **Full suite command** | `mise exec -- pnpm test` |
| **Estimated runtime** | ~1 second (775ms current) |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- pnpm test`
- **After every plan wave:** Run `mise exec -- pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Test File | Status |
|---------|------|------|-------------|-----------|-------------------|-----------|--------|
| 05-01-01 | 01 | 1 | DIFF-01,03,04 | unit | `mise exec -- pnpm vitest run tests/game/difficulty.test.ts` | `tests/game/difficulty.test.ts` (30 tests) | green |
| 05-01-02 | 01 | 1 | DIFF-02 | unit | `mise exec -- pnpm vitest run tests/game/letters.test.ts tests/game/words.test.ts` | `tests/game/letters.test.ts` (4 tests), `tests/game/words.test.ts` (3 tests) | green |
| 05-02-01 | 02 | 2 | wiring contract | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts` | `tests/game/states.test.ts` (mock GameContext.getDifficulty/setDifficulty) | green |
| 05-02-02 | 02 | 2 | DIFF-01,02,03 | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts` | `tests/game/states.test.ts` (40 tests, hit/miss/bottom/setDifficulty) | green |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `tests/game/difficulty.test.ts` -- covers DIFF-01 (speed), DIFF-02 (complexity), DIFF-03 (spawn), DIFF-04 (convergence)
- [x] `tests/game/letters.test.ts` -- adapted to new `getAvailableLetters(complexityLevel)` signature
- [x] `tests/game/words.test.ts` -- adapted to new `getAvailableWords(wordLists, complexityLevel)` signature

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Difficulty feels smooth in play | DIFF-04 | Subjective feel of flow state | Play a full session, observe speed gradually increasing on success |
| No visible difficulty jumps | DIFF-01 | Perceptual smoothness | Play and watch for sudden speed changes |
| Debug overlay (F3) renders Speed/Spawn/Complexity | DIFF-01,02,03 | DOM-only rendering of dev overlay; behavior covered indirectly via mock contract assertions in `states.test.ts` (setDifficulty pushes params), the integration is visual | Press F3 during gameplay, confirm three lines appear and update each frame |

---

## Validation Sign-Off

- [x] All tasks have automated verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s (full suite ~775ms)
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-28

---

## Validation Audit 2026-04-28

| Metric | Count |
|--------|-------|
| Gaps found | 0 |
| Resolved | 0 |
| Escalated | 0 |
| Tests verified green | 100 (across 4 files) |

**Method:** Cross-referenced PLAN/SUMMARY artifacts against the test suite. All listed tests exist, all pass, and behavior covers DIFF-01 through DIFF-04. The DebugOverlay HTML rendering is dev-only and added to Manual-Only.

**Map updates:**
- 05-01-02 expanded to reference both `letters.test.ts` and `words.test.ts` (Plan 01 Task 2 covered both)
- 05-02-01 redefined as the GameContext/Debug/Game plumbing task (covered indirectly via mock contract in states.test.ts)
- 05-02-02 added to map for the actual PlayingState wiring task (covered by states.test.ts)
- All statuses moved from `pending` → `green`
- Wave 0 checkboxes flipped to complete; `wave_0_complete: true`
