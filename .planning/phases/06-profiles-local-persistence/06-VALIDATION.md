---
phase: 6
slug: profiles-local-persistence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.x |
| **Config file** | vite.config.ts (inline vitest config) |
| **Quick run command** | `pnpm vitest run --reporter=verbose` |
| **Full suite command** | `pnpm vitest run --reporter=verbose` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run --reporter=verbose`
- **After every plan wave:** Run `pnpm vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | PROF-02 | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | PROF-02 | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | PROF-01 | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | PROF-01 | manual | browser test | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/game/__tests__/profile-repository.test.ts` -- stubs for PROF-02 (persistence)
- [ ] `src/game/__tests__/profile-state.test.ts` -- stubs for PROF-01 (profile selection)

*Existing vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Profile selection screen displays on app open | PROF-01 | Visual/interactive UI | Open app, verify profile screen shows before menu |
| Browser close/reopen preserves data | PROF-02 | Requires browser restart | Create profile, close tab, reopen, verify data persists |
| Avatar click loads correct progress | PROF-01 | Visual verification | Create 2 profiles with different progress, switch between them |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
