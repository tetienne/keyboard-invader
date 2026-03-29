# Phase 1: Project Scaffolding & Dev Tooling - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-29
**Phase:** 01-project-scaffolding-dev-tooling
**Areas discussed:** Hosting platform, Project structure, Pre-commit tooling, Initial deploy content, Mise tool versions, ESLint config scope, Package manager, CI/CD pipeline, Tailwind CSS setup, Testing strategy, i18n foundation, Git conventions, TypeScript path aliases, Prettier config, License & README, Editor config

---

## Hosting Platform

| Option | Description | Selected |
|--------|-------------|----------|
| Cloudflare Pages | Fastest global CDN, unlimited bandwidth on free tier, automatic HTTPS, easy GitHub integration | :heavy_check_mark: |
| GitHub Pages | Simple, free, integrated with GitHub. Slower CDN, less flexible caching | |
| Netlify | Good DX, free tier capped at 100GB/month bandwidth | |
| Vercel | Great DX, generous free tier. More oriented toward serverless/SSR | |

**User's choice:** Cloudflare Pages (Recommended)
**Notes:** None

---

## Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| By domain | src/game/, src/screens/, src/shared/. Clear separation of canvas game vs HTML/CSS UI | :heavy_check_mark: |
| By type | src/components/, src/hooks/, src/utils/. Flat structure, mixes game and UI concerns | |
| Feature-based | src/features/game/, src/features/profiles/. Self-contained features, may be overkill | |

**User's choice:** By domain (Recommended)
**Notes:** None

---

## Pre-commit Tooling

| Option | Description | Selected |
|--------|-------------|----------|
| Lefthook | Fast Go binary, zero npm dependencies, parallel task execution | |
| Husky + lint-staged | Most popular in JS ecosystem. Two packages to maintain | |
| pre-commit (Python) | Language-agnostic framework. Requires Python runtime | |
| prek (Rust) | User-suggested: Rust-based drop-in replacement for pre-commit | :heavy_check_mark: |

**User's choice:** prek (Rust) -- user provided: https://github.com/j178/prek
**Notes:** Install via mise. Compatible with .pre-commit-config.yaml format.

---

## Initial Deploy Content

| Option | Description | Selected |
|--------|-------------|----------|
| PixiJS canvas test | Colored PixiJS canvas with game title as BitmapText. Proves rendering pipeline | :heavy_check_mark: |
| Minimal HTML placeholder | Simple HTML page with project name. Proves deploy pipeline only | |
| Splash screen mockup | Styled Tailwind landing page with placeholder art | |

**User's choice:** PixiJS canvas test (Recommended)
**Notes:** None

---

## Mise Tool Versions

| Option | Description | Selected |
|--------|-------------|----------|
| Node 22 LTS | Previous LTS | |
| Node 24 LTS | Current LTS | :heavy_check_mark: |
| Node 20 LTS | Older LTS, EOL April 2026 | |

**User's choice:** Node 24 LTS (user corrected that Node 24 is the current LTS)
**Notes:** Use mise for all required binaries in the project

---

## ESLint Config Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Maximum strict | typescript-eslint strict + stylistic, no-explicit-any, naming-convention, import ordering | :heavy_check_mark: |
| Strict but pragmatic | typescript-eslint strict without stylistic rules | |
| You decide | Claude picks based on project needs | |

**User's choice:** Maximum strict (Recommended)
**Notes:** Matches DX-02 requirement

---

## Package Manager

| Option | Description | Selected |
|--------|-------------|----------|
| pnpm | Fast, disk-efficient, strict dependency resolution | :heavy_check_mark: |
| npm | Default with Node.js, slower, larger node_modules | |
| bun | Fastest installs, newer ecosystem, some edge cases | |

**User's choice:** pnpm (Recommended)
**Notes:** None

---

## CI/CD Pipeline

| Option | Description | Selected |
|--------|-------------|----------|
| Full CI + deploy | GitHub Actions: lint + typecheck + build on PR, auto-deploy to Cloudflare Pages on merge | :heavy_check_mark: |
| CI only, manual deploy | GitHub Actions for validation, manual Cloudflare deploy | |
| No CI yet | Rely on pre-commit hooks locally | |

**User's choice:** Full CI + deploy (Recommended)
**Notes:** None

---

## Tailwind CSS Setup

| Option | Description | Selected |
|--------|-------------|----------|
| Tailwind v4 | CSS-first config (@theme, @utility), no JS config file, faster builds | :heavy_check_mark: |
| Tailwind v3 | Mature, JS-based config. Will eventually be deprecated | |

**User's choice:** Tailwind v4 (Recommended)
**Notes:** None

---

## Testing Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Smoke test only | One test verifying app builds and PixiJS initializes | |
| Config + smoke tests | TypeScript strict mode, ESLint config loads, app builds | :heavy_check_mark: |
| No tests in Phase 1 | Vitest configured but no tests written | |

**User's choice:** Config + smoke tests
**Notes:** None

---

## i18n Foundation

| Option | Description | Selected |
|--------|-------------|----------|
| Full foundation | JSON locale files, t() helper, locale detection/switching | :heavy_check_mark: |
| Folder structure only | Create i18n dir with empty files and TODO | |
| Defer entirely | No i18n in Phase 1 | |

**User's choice:** Full foundation (Recommended)
**Notes:** None

---

## Git Conventions

| Option | Description | Selected |
|--------|-------------|----------|
| Enforce conventional commits | commit-msg hook via prek validates format | :heavy_check_mark: |
| Convention but no hook | Follow by habit, no enforcement | |
| No convention | Free-form commit messages | |

**User's choice:** Yes, enforce (Recommended)
**Notes:** None

---

## TypeScript Path Aliases

| Option | Description | Selected |
|--------|-------------|----------|
| @/ aliases | @/game/, @/screens/, @/shared/ -- cleaner imports | :heavy_check_mark: |
| Relative imports | Standard ../../../ paths | |

**User's choice:** Yes, use @/ aliases (Recommended)
**Notes:** None

---

## Prettier Config

| Option | Description | Selected |
|--------|-------------|----------|
| No semicolons, single quotes | Modern TS style, 2-space indent, 100 print width | :heavy_check_mark: |
| Semicolons, double quotes | Traditional JS style, 80 print width | |
| You decide | Claude picks defaults | |

**User's choice:** No semicolons, single quotes (Recommended)
**Notes:** None

---

## License & README

| Option | Description | Selected |
|--------|-------------|----------|
| MIT + basic README | MIT license, README with name, description, dev setup | :heavy_check_mark: |
| Skip for now | No license or README yet | |

**User's choice:** MIT + basic README (Recommended)
**Notes:** None

---

## Editor Config

| Option | Description | Selected |
|--------|-------------|----------|
| Both .editorconfig + .vscode/ | Universal settings + VS Code-specific integration | |
| .editorconfig only | Universal editor settings, no IDE-specific files | :heavy_check_mark: |
| Skip | No editor config | |

**User's choice:** .editorconfig only
**Notes:** None

---

## Claude's Discretion

- Specific ESLint plugin selection and rule tuning within "maximum strict" mandate
- Exact folder naming within the domain structure
- GitHub Actions workflow specifics (runner version, caching strategy)
- Specific prek hook repos for ESLint/Prettier/TypeScript validation

## Deferred Ideas

None -- discussion stayed within phase scope
