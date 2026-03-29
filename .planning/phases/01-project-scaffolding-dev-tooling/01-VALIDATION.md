---
phase: 1
slug: project-scaffolding-dev-tooling
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | `vitest.config.ts` (or inline in `vite.config.ts`) |
| **Quick run command** | `pnpm vitest run` |
| **Full suite command** | `pnpm vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run`
- **After every plan wave:** Run `pnpm vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | DX-01 | build | `pnpm build` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | DX-02 | lint | `pnpm lint` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 1 | DX-03 | typecheck | `pnpm tsc --noEmit` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 1 | DX-04 | unit | `pnpm vitest run` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 1 | DX-05 | hook | `prek run` | ❌ W0 | ⬜ pending |
| 01-01-06 | 01 | 1 | INFRA-01 | deploy | `wrangler deploy --dry-run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/smoke.test.ts` — stubs for build, lint, typecheck verification
- [ ] `vitest.config.ts` — test framework config (or inline in vite.config.ts)
- [ ] Vitest installed as dev dependency

*Wave 0 is handled within the plans — test infrastructure is part of Phase 1 scaffolding.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cloudflare deployment live | INFRA-01 | Requires Cloudflare account + API token | 1. Set up Cloudflare account 2. Configure API token in GitHub secrets 3. Push to main 4. Verify site loads at assigned URL |
| Pre-commit hook rejects bad code | DX-05 | Requires actual git commit attempt | 1. Introduce a lint error 2. Run `git commit` 3. Verify commit is rejected |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
