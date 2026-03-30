---
phase: 03
slug: letter-mode-gameplay
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | vite.config.ts (inline vitest config) |
| **Quick run command** | `pnpm vitest run tests/game/` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~2 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/game/`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | GAME-01, GAME-02 | unit | `pnpm vitest run tests/game/letter.test.ts` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | GAME-04 | unit | `pnpm vitest run tests/game/feedback.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | GAME-05 | unit | `pnpm vitest run tests/game/score.test.ts` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | GAME-01 | integration | `pnpm vitest run tests/game/session.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/game/letter.test.ts` — stubs for letter entity creation, matching, color palette
- [ ] `tests/game/feedback.test.ts` — stubs for hit/miss visual feedback state transitions
- [ ] `tests/game/score.test.ts` — stubs for score tracking, session stats
- [ ] `tests/game/session.test.ts` — stubs for session flow (spawn N letters, end, results)

*Existing test infrastructure (vitest, vi.mock for pixi.js) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Letters visually fall smoothly | GAME-01 | Rendering quality requires visual inspection | Run `pnpm dev`, click "Jouer", observe falling letters |
| Correct hit shows green flash + scale | GAME-04 | Visual animation timing requires browser | Press matching key during gameplay, observe effect |
| Wrong key shows red flash + shake | GAME-04 | Visual animation requires browser | Press wrong key during gameplay, observe non-punitive feedback |
| Score counter visible and updating | GAME-05 | Layout positioning requires visual check | Play session, verify score increments on hits |
| Results screen shows after session ends | GAME-01 | Full session flow requires browser | Complete 20-letter session, verify results screen |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
