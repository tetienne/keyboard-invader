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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-01 Task 1 | 01 | 1 | DX-02, DX-03, DX-04, DX-05 | build + lint + typecheck | `pnpm install && pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm exec prettier --check .` | ⬜ pending |
| 01-01 Task 2 | 01 | 1 | DX-05 | typecheck + lint | `pnpm exec tsc --noEmit && pnpm exec eslint src/shared/i18n/` | ⬜ pending |
| 01-02 Task 1 | 02 | 2 | INFRA-01 | build | `pnpm exec tsc --noEmit && pnpm exec eslint src/main.ts && pnpm run build && test -f dist/index.html` | ⬜ pending |
| 01-02 Task 2 | 02 | 2 | DX-02, DX-03, DX-05 | unit | `pnpm exec vitest run` | ⬜ pending |
| 01-03 Task 1 | 03 | 2 | DX-01 | hook | `test -f .git/hooks/pre-commit && prek run --all-files` | ⬜ pending |
| 01-03 Task 2 | 03 | 2 | INFRA-01 | config | `test -f wrangler.toml && grep -q "assets" wrangler.toml && test -f .github/workflows/ci.yml` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/smoke.test.ts` — stubs for build, lint, typecheck verification (created in Plan 01-02 Task 2)
- [ ] `vitest.config.ts` — test framework config (inline in vite.config.ts, configured in Plan 01-02 Task 2)
- [ ] Vitest installed as dev dependency (installed in Plan 01-01 Task 1)

*Wave 0 is handled within the plans — test infrastructure is part of Phase 1 scaffolding.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Cloudflare deployment live | INFRA-01 | Requires Cloudflare account + API token (see user_setup in Plan 01-03) | 1. Set up Cloudflare account 2. Configure API token in GitHub secrets 3. Push to main 4. Verify site loads at assigned URL |
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
