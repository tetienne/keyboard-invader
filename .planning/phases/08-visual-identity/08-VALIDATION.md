---
phase: 8
slug: visual-identity
status: approved
nyquist_compliant: true
wave_0_complete: true
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
| **Estimated runtime** | ~1 second |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test`
- **After every plan wave:** Run `pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 1 second

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | AV-01 | unit | `pnpm vitest run tests/game/theme.test.ts -x` | ✅ | ✅ green |
| 08-01-02 | 01 | 1 | AV-01 | unit | `pnpm vitest run tests/game/states.test.ts -x` | ✅ | ✅ green |
| 08-02-01 | 02 | 2 | AV-01 | unit | `pnpm vitest run tests/game/alien-container.test.ts -x` | ✅ | ✅ green |
| 08-02-02 | 02 | 2 | AV-01 | unit | `pnpm vitest run tests/game/starfield.test.ts -x` | ✅ | ✅ green |
| 08-02-03 | 02 | 2 | AV-01 | unit | `pnpm vitest run tests/game/effects.test.ts -x` | ✅ | ✅ green |
| 08-02-04 | 02 | 2 | AV-01 | unit | `pnpm vitest run tests/game/tween.test.ts -x` | ✅ | ✅ green |
| 08-02-05 | 02 | 2 | AV-01 | unit | `pnpm vitest run tests/game/letters.test.ts -x` | ✅ | ✅ green |
| 08-02-06 | 02 | 2 | AV-01 | unit | `pnpm vitest run tests/game/words.test.ts -x` | ✅ | ✅ green |
| 08-03-01 | 03 | 3 | AV-01 | unit | `pnpm vitest run tests/game/avatar-definitions.test.ts -x` | ✅ | ✅ green |
| 08-03-02 | 03 | 3 | AV-01 | suite | `pnpm test` | ✅ | ✅ green |
| 08-04-01 | 04 | 4 | AV-01 | manual | Chrome DevTools visual verification | N/A | ✅ green |
| 08-05-01 | 05 | 1 | AV-01 | suite | `pnpm test` | ✅ | ✅ green |
| 08-xx-01 | -- | -- | AV-01 | manual-only | Chrome DevTools Performance tab, CPU 4x slowdown | N/A | ✅ green |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements.

- [x] `tests/game/theme.test.ts` -- covers theme constants, color palette, level titles (10 tests)
- [x] `tests/game/states.test.ts` -- covers BootState async loading, font and asset preloading (32 tests)
- [x] `tests/game/alien-container.test.ts` -- covers AlienContainer composition, idle animation (7 tests)
- [x] `tests/game/starfield.test.ts` -- covers Starfield parallax layers, intensity (5 tests)
- [x] `tests/game/effects.test.ts` -- covers DestructionEffect particle burst, LaserBolt (8 tests)
- [x] `tests/game/tween.test.ts` -- covers all 5 tween types including dodge/escape (22 tests)
- [x] `tests/game/avatar-definitions.test.ts` -- covers AvatarDefinition with SVG paths, legacy migration (9 tests)
- [x] `tests/game/letters.test.ts` -- covers LetterEntity with AlienContainer (13 tests)
- [x] `tests/game/words.test.ts` -- covers WordEntity with AlienContainer (16 tests)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps under 4x CPU throttle | AV-01 | Performance requires real browser rendering pipeline | Open Chrome DevTools > Performance tab > Enable CPU 4x slowdown > Record 30s gameplay > Verify no frames above 16.7ms |
| Visual coherence of art style | AV-01 | Subjective visual quality assessment | Play full session, verify alien art style is consistent, colors harmonize, no visual jarring |

---

## Validation Sign-Off

- [x] All tasks have automated verify or manual-only justification
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all requirements
- [x] No watch-mode flags
- [x] Feedback latency < 1s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved 2026-04-12

---

## Validation Audit 2026-04-12

| Metric | Count |
|--------|-------|
| Gaps found | 1 |
| Resolved | 1 |
| Escalated | 0 |

**Details:** `tests/__mocks__/pixi.ts` was missing a `Text` mock, causing an unhandled error in the BootState error path test. Added `MockText` class to the pixi mock file. Full suite now passes with 237 tests, 0 errors.
