---
phase: 05
slug: adaptive-difficulty
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
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
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `mise exec -- pnpm test`
- **After every plan wave:** Run `mise exec -- pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DIFF-01,03,04 | unit | `mise exec -- pnpm vitest run tests/game/difficulty.test.ts -x` | Wave 0 | pending |
| 05-01-02 | 01 | 1 | DIFF-01,02 | unit | `mise exec -- pnpm vitest run tests/game/letters.test.ts -x` | Exists (update) | pending |
| 05-02-01 | 02 | 2 | DIFF-01,02,03 | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts -x` | Exists (update) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/game/difficulty.test.ts` -- covers DIFF-01 (speed), DIFF-02 (complexity), DIFF-03 (spawn), DIFF-04 (convergence)
- [ ] Update `tests/game/letters.test.ts` -- adapt to new `getAvailableLetters(complexityLevel)` signature
- [ ] Update `tests/game/words.test.ts` -- adapt to new `getAvailableWords` signature

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Difficulty feels smooth in play | DIFF-04 | Subjective feel of flow state | Play a full session, observe speed gradually increasing on success |
| No visible difficulty jumps | DIFF-01 | Perceptual smoothness | Play and watch for sudden speed changes |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
