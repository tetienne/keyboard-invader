---
phase: 04
slug: word-mode-game-modes
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-31
---

# Phase 04 -- Validation Strategy

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
| 04-01-01 | 01 | 1 | GAME-03 | unit | `mise exec -- pnpm vitest run tests/game/words.test.ts -x` | Wave 0 | pending |
| 04-01-02 | 01 | 1 | GAME-03 | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts -x` | Exists (extend) | pending |
| 04-02-01 | 02 | 2 | GAME-06 | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts -x` | Exists (extend) | pending |
| 04-02-02 | 02 | 2 | GAME-07 | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts -x` | Exists (extend) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/game/words.test.ts` -- stubs for GAME-03 (word selection, word matching, findActiveWord)
- [ ] Extend `tests/game/states.test.ts` -- covers GAME-03 (PlayingState word mode), GAME-06 (pause in word mode), GAME-07 (summary with time)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Mode selection buttons visually distinct | GAME-03 | Visual layout verification | Open menu, verify two buttons with icons visible |
| Word letter-by-letter highlight visible | GAME-03 | Visual tint verification | Play word mode, type correct letter, verify green highlight |
| Pause overlay shows during word mode | GAME-06 | Visual overlay verification | During word mode, blur window, verify pause overlay |
| Summary shows time played | GAME-07 | Visual display verification | Complete a session, verify time displayed on results screen |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
