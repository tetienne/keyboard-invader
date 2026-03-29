# Phase 1: Project Scaffolding & Dev Tooling - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Set up a fully configured TypeScript + Vite + PixiJS project with strict linting, pre-commit hooks, CI/CD pipeline, and auto-deployment to Cloudflare Pages. The deployed artifact is a PixiJS canvas test page proving the full rendering pipeline works.

</domain>

<decisions>
## Implementation Decisions

### Hosting & Deployment
- **D-01:** Deploy to **Cloudflare Pages** (fastest global CDN, unlimited free bandwidth, automatic HTTPS)
- **D-02:** **Full CI/CD pipeline** via GitHub Actions: lint + typecheck + build on PR, auto-deploy to Cloudflare Pages on merge to main

### Project Structure
- **D-03:** Organize `src/` **by domain**: `src/game/` (PixiJS engine, loop, entities), `src/screens/` (menu, profile, settings -- Tailwind), `src/shared/` (types, utils, i18n, constants)
- **D-04:** Use **`@/` path aliases** (`@/game/`, `@/screens/`, `@/shared/`) -- configured in tsconfig.json + vite.config.ts

### Tooling
- **D-05:** Use **mise** to manage all project tooling (Node.js, pnpm, prek, etc.) via `.mise.toml`
- **D-06:** Pin **Node.js 24 LTS** via mise
- **D-07:** Use **pnpm** as package manager (fast, disk-efficient, strict dependency resolution)
- **D-08:** Use **prek** (Rust-based pre-commit alternative, https://github.com/j178/prek) for pre-commit hooks, installed via mise
- **D-09:** Enforce **conventional commits** via prek commit-msg hook (feat:, fix:, docs:, chore:, etc.)

### Code Quality
- **D-10:** **ESLint maximum strict** -- typescript-eslint strict + stylistic, no-explicit-any, naming-convention, import ordering, consistent type imports
- **D-11:** **Prettier** config: no semicolons, single quotes, 2-space indent, 100 print width
- **D-12:** **TypeScript strict mode** (strict: true, noUncheckedIndexedAccess, etc.)

### CSS & Styling
- **D-13:** **Tailwind CSS v4** (CSS-first config with @theme/@utility, no JS config file)

### i18n
- **D-14:** **Full i18n foundation** in Phase 1: JSON locale files (fr.json, en.json) with placeholder keys, a `t()` helper function, locale detection/switching util. Ready for Phase 3+ to populate.

### Testing
- **D-15:** **Config + smoke tests** with Vitest: verify TypeScript strict mode is on, ESLint config loads, and the app builds/PixiJS initializes

### Initial Deploy Content
- **D-16:** First deployed page is a **PixiJS canvas test** with the game title rendered as BitmapText -- proves the rendering pipeline works end-to-end

### Project Files
- **D-17:** Ship **MIT license** and a **basic README** with project name, description, and dev setup instructions
- **D-18:** Ship **.editorconfig** for universal editor settings (no .vscode/ directory)

### Claude's Discretion
- Specific ESLint plugin selection and rule tuning within the "maximum strict" mandate
- Exact folder naming within the domain structure (e.g., `src/shared/` vs `src/common/`)
- GitHub Actions workflow specifics (runner version, caching strategy)
- Specific prek hook repos for ESLint/Prettier/TypeScript validation

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Specs
- `.planning/PROJECT.md` -- Core value, constraints, key decisions
- `.planning/REQUIREMENTS.md` -- DX-01 through DX-05, INFRA-01 requirements for this phase
- `.planning/ROADMAP.md` -- Phase 1 success criteria and dependencies

### External Tools
- `https://github.com/j178/prek` -- prek documentation for pre-commit hook configuration (.pre-commit-config.yaml format)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None -- this is a greenfield project with no existing code

### Established Patterns
- None -- Phase 1 establishes all patterns

### Integration Points
- None -- this is the foundation phase

</code_context>

<specifics>
## Specific Ideas

- Use mise for reproducible tooling across all developers (`.mise.toml` checked into repo)
- prek chosen specifically as a faster, Rust-based alternative to Python's pre-commit framework
- Tailwind v4 CSS-first approach (no tailwind.config.js) -- modern and cleaner

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 01-project-scaffolding-dev-tooling*
*Context gathered: 2026-03-29*
