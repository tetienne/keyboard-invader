---
phase: 7
slug: progression-system
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | vite.config.ts (inline test config) |
| **Quick run command** | `pnpm vitest run tests/game/progression.test.ts tests/persistence/schema.test.ts` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run tests/game/progression.test.ts tests/persistence/schema.test.ts`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 0 | PROG-01, PROG-02 | unit | `pnpm vitest run tests/game/progression.test.ts` | W0 | pending |
| 07-01-02 | 01 | 0 | PROG-02 | unit | `pnpm vitest run tests/persistence/schema.test.ts` | Extend | pending |
| 07-02-01 | 02 | 1 | PROG-01 | unit | `pnpm vitest run tests/game/progression.test.ts -t "xp calculation"` | W0 | pending |
| 07-02-02 | 02 | 1 | PROG-02 | unit | `pnpm vitest run tests/game/progression.test.ts -t "level resolution"` | W0 | pending |
| 07-02-03 | 02 | 1 | PROG-02 | unit | `pnpm vitest run tests/game/progression.test.ts -t "multi-level"` | W0 | pending |
| 07-03-01 | 03 | 2 | PROG-03 | manual | N/A (visual animation) | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/game/progression.test.ts` -- stubs for PROG-01 (XP formula), PROG-02 (level thresholds, multi-level-up)
- [ ] `tests/persistence/schema.test.ts` -- extend with v1->v2 migration test cases

*Existing infrastructure covers test framework setup.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Celebration overlay plays on level-up | PROG-03 | Visual animation with particles, scale burst, auto-dismiss | 1. Play a session that earns enough XP for level-up. 2. Verify full-screen overlay appears with particles. 3. Verify overlay auto-dismisses in 2-3s. 4. Verify buttons become active after dismiss. |
| XP bar fill animation smooth | PROG-01 | Visual smoothness judgment | 1. Complete a session. 2. Verify XP bar animates from old value to new. 3. Check fill speed scales with XP amount. |
| Multi-level-up sequential animation | PROG-02, PROG-03 | Complex visual sequence | 1. Set profile to low level with XP near threshold for 2+ levels. 2. Complete a high-scoring session. 3. Verify each intermediate level celebration plays sequentially. |
| Locked avatars show correctly | PROG-02 | Visual rendering of lock state | 1. View profile selection with a level 1 profile. 2. Verify 3 avatars selectable, 3 grayed with lock icon and level label. |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
