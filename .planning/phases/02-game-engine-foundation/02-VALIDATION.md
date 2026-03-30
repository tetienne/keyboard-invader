---
phase: 2
slug: game-engine-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | GAME-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | AV-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/game-loop.test.ts` — fixed-timestep game loop tests
- [ ] `src/__tests__/state-machine.test.ts` — FSM transition tests
- [ ] `src/__tests__/input-handler.test.ts` — keyboard input capture tests (AZERTY)
- [ ] `src/__tests__/object-pool.test.ts` — object pool allocation tests
- [ ] `src/__tests__/visibility.test.ts` — tab visibility pause/resume tests

*Test framework (vitest) already installed from Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps rendering | GAME-01 | Requires visual canvas + DevTools | Open browser, check FPS counter in DevTools Performance tab |
| No per-frame allocations | GAME-01 | Requires DevTools memory timeline | Record memory timeline, verify flat allocation graph during gameplay |
| AZERTY layout handling | GAME-01 | Requires physical AZERTY keyboard or OS emulation | Switch OS keyboard to French AZERTY, verify key mapping |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
