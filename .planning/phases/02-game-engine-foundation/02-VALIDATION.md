---
phase: 2
slug: game-engine-foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| 02-01-01 | 01 | 1 | GAME-01 | typecheck | `pnpm typecheck` | N/A (types only) | pending |
| 02-01-02 | 01 | 1 | GAME-01, AV-04 | unit | `pnpm vitest run tests/game/canvas.test.ts tests/game/pool.test.ts tests/game/input.test.ts` | W0 | pending |
| 02-02-01 | 02 | 2 | GAME-01 | unit | `pnpm vitest run tests/game/states.test.ts tests/game/loop.test.ts` | W0 | pending |
| 02-02-02 | 02 | 2 | GAME-01, AV-04 | unit + typecheck | `pnpm vitest run tests/game/ && pnpm typecheck` | W0 | pending |
| 02-02-03 | 02 | 2 | GAME-01, AV-04 | human-verify | `pnpm vitest run tests/game/ && pnpm typecheck && pnpm lint` | N/A | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [x] `tests/game/canvas.test.ts` — letterbox scaling math tests
- [x] `tests/game/pool.test.ts` — object pool allocation tests
- [x] `tests/game/input.test.ts` — keyboard input capture tests (AZERTY)
- [x] `tests/game/states.test.ts` — FSM transition tests + concrete state lifecycle tests
- [x] `tests/game/loop.test.ts` — fixed-timestep game loop tests

*Test framework (vitest) already installed from Phase 1. All test files created within their respective plan tasks (TDD approach).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps rendering | GAME-01 | Requires visual canvas + DevTools | Open browser, check FPS counter in DevTools Performance tab |
| No per-frame allocations | GAME-01 | Requires DevTools memory timeline | Record memory timeline, verify flat allocation graph during gameplay |
| AZERTY layout handling | GAME-01 | Requires physical AZERTY keyboard or OS emulation | Switch OS keyboard to French AZERTY, verify key mapping |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 5s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
