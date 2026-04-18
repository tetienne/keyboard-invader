---
phase: 8
slug: visual-identity
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 8 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | vite.config.ts (inline test config) |
| **Quick run command** | `pnpm test` |
| **Full suite command** | `pnpm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | AV-01 | unit | `pnpm vitest run tests/game/theme.test.ts -x` | W0 | pending |
| 08-01-02 | 01 | 1 | AV-01 | unit | `pnpm vitest run tests/game/alien-container.test.ts -x` | W0 | pending |
| 08-01-03 | 01 | 1 | AV-01 | unit | `pnpm vitest run tests/game/starfield.test.ts -x` | W0 | pending |
| 08-01-04 | 01 | 1 | AV-01 | unit | `pnpm vitest run tests/game/effects.test.ts -x` | W0 | pending |
| 08-02-01 | 02 | 1 | AV-01 | unit | `pnpm vitest run tests/game/avatar-definitions.test.ts -x` | W0 | pending |
| 08-02-02 | 02 | 1 | AV-01 | unit | `pnpm vitest run tests/game/tween.test.ts -x` | Exists | pending |
| 08-xx-xx | xx | x | AV-01 | manual-only | Chrome DevTools Performance tab, CPU 4x slowdown | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `tests/game/theme.test.ts` -- covers theme constants, color palette, level titles
- [ ] `tests/game/alien-container.test.ts` -- covers AlienContainer composition
- [ ] `tests/game/starfield.test.ts` -- covers Starfield parallax layers
- [ ] `tests/game/effects.test.ts` -- covers DestructionEffect particle burst
- [ ] `tests/game/avatar-definitions.test.ts` -- covers updated AvatarDefinition with SVG paths
- [ ] Extend `tests/game/tween.test.ts` -- covers new dodge/escape tween types

*Existing infrastructure covers framework setup. Wave 0 adds test stubs for new modules.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps under 4x CPU throttle | AV-01 | Performance requires real browser rendering pipeline | Open Chrome DevTools > Performance tab > Enable CPU 4x slowdown > Record 30s gameplay > Verify no frames above 16.7ms |
| Visual coherence of art style | AV-01 | Subjective visual quality assessment | Play full session, verify alien art style is consistent, colors harmonize, no visual jarring |

---

## Validation Sign-Off

- [ ] All tasks have automated verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
