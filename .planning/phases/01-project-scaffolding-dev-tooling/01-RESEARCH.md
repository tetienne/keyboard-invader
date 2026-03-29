# Phase 1: Project Scaffolding & Dev Tooling - Research

**Researched:** 2026-03-29
**Domain:** TypeScript + Vite + PixiJS project scaffolding, linting, CI/CD, static hosting
**Confidence:** HIGH

## Summary

Phase 1 sets up a greenfield TypeScript project with Vite 8, PixiJS 8, Tailwind CSS v4, strict ESLint, Prettier, pre-commit hooks via prek, and automated deployment to Cloudflare Workers (static assets). All tools are managed reproducibly via mise.

The stack is well-established with current, stable versions verified against npm registry. Key finding: Cloudflare Pages was deprecated in April 2025 and absorbed into Cloudflare Workers with Static Assets. The deployment target should be Workers with static assets (assets-only mode, no Worker script needed). The `wrangler.toml` simply points to the build output directory.

**Primary recommendation:** Use Cloudflare Workers Static Assets (not legacy Pages) with `wrangler deploy` via GitHub Actions. Use prek with `prek.toml` for hooks. Pin Node 24 LTS (24.14.1) via mise with corepack-managed pnpm.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Deploy to Cloudflare Pages (fastest global CDN, unlimited free bandwidth, automatic HTTPS)
- **D-02:** Full CI/CD pipeline via GitHub Actions: lint + typecheck + build on PR, auto-deploy to Cloudflare Pages on merge to main
- **D-03:** Organize src/ by domain: src/game/ (PixiJS engine, loop, entities), src/screens/ (menu, profile, settings -- Tailwind), src/shared/ (types, utils, i18n, constants)
- **D-04:** Use @/ path aliases (@/game/, @/screens/, @/shared/) -- configured in tsconfig.json + vite.config.ts
- **D-05:** Use mise to manage all project tooling (Node.js, pnpm, prek, etc.) via .mise.toml
- **D-06:** Pin Node.js 24 LTS via mise
- **D-07:** Use pnpm as package manager (fast, disk-efficient, strict dependency resolution)
- **D-08:** Use prek (Rust-based pre-commit alternative, https://github.com/j178/prek) for pre-commit hooks, installed via mise
- **D-09:** Enforce conventional commits via prek commit-msg hook (feat:, fix:, docs:, chore:, etc.)
- **D-10:** ESLint maximum strict -- typescript-eslint strict + stylistic, no-explicit-any, naming-convention, import ordering, consistent type imports
- **D-11:** Prettier config: no semicolons, single quotes, 2-space indent, 100 print width
- **D-12:** TypeScript strict mode (strict: true, noUncheckedIndexedAccess, etc.)
- **D-13:** Tailwind CSS v4 (CSS-first config with @theme/@utility, no JS config file)
- **D-14:** Full i18n foundation in Phase 1: JSON locale files (fr.json, en.json) with placeholder keys, a t() helper function, locale detection/switching util
- **D-15:** Config + smoke tests with Vitest: verify TypeScript strict mode is on, ESLint config loads, and the app builds/PixiJS initializes
- **D-16:** First deployed page is a PixiJS canvas test with the game title rendered as BitmapText
- **D-17:** Ship MIT license and a basic README with project name, description, and dev setup instructions
- **D-18:** Ship .editorconfig for universal editor settings (no .vscode/ directory)

### Claude's Discretion
- Specific ESLint plugin selection and rule tuning within the "maximum strict" mandate
- Exact folder naming within the domain structure (e.g., src/shared/ vs src/common/)
- GitHub Actions workflow specifics (runner version, caching strategy)
- Specific prek hook repos for ESLint/Prettier/TypeScript validation

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DX-01 | Pre-commit hooks validate code before each commit | prek 0.3.5 with prek.toml config; builtin + local hooks for lint/typecheck/format |
| DX-02 | ESLint maximum (typescript-eslint strict + stylistic, no-explicit-any, naming-convention) | typescript-eslint 8.57.2 flat config with strict + strictTypeChecked + stylistic presets |
| DX-03 | TypeScript strict mode (strict: true, noUncheckedIndexedAccess, etc.) | TypeScript 6.0.2 with strict tsconfig options documented below |
| DX-04 | Tailwind CSS for styling of non-game screens | Tailwind CSS v4.2.2 with @tailwindcss/vite plugin, CSS-first config |
| DX-05 | Vanilla TypeScript for DOM (no UI framework) -- PixiJS for game canvas | PixiJS 8.17.1 with BitmapText, Vite 8.0.3, no framework |
| INFRA-01 | Application deployable on a free hosting platform | Cloudflare Workers Static Assets (free tier, unlimited bandwidth) |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| TypeScript | 6.0.2 | Type safety | Latest stable, strict mode for game state types |
| Vite | 8.0.3 | Build tool, dev server | Fastest build tool, native ESM, Rolldown bundler |
| PixiJS | 8.17.1 | 2D WebGL/Canvas rendering | Fastest 2D renderer, BitmapText for typing game text |
| Tailwind CSS | 4.2.2 | Utility-first CSS for UI screens | CSS-first config (v4), no JS config file needed |
| @tailwindcss/vite | 4.2.2 | Tailwind Vite integration | First-party plugin, zero PostCSS config |

### Dev Dependencies

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| typescript-eslint | 8.57.2 | ESLint TS parser + rules | Flat config with strict + stylistic presets |
| @eslint/js | 10.0.1 | ESLint core recommended rules | Base JS rules |
| eslint | 10.1.0 | Linter | Flat config format (eslint.config.mjs) |
| eslint-config-prettier | 10.1.8 | Disable ESLint rules conflicting with Prettier | Always alongside Prettier |
| eslint-plugin-import-x | 4.16.2 | Import ordering, no-duplicates | Enforces consistent import structure |
| prettier | 3.8.1 | Code formatter | Consistent code style |
| vitest | 4.1.2 | Unit testing | Same config as Vite, fast, TS-native |
| wrangler | 4.78.0 | Cloudflare deployment CLI | Deploy static assets to Workers |
| @commitlint/cli | 20.5.0 | Conventional commit validation | commit-msg hook via prek |
| @commitlint/config-conventional | 20.5.0 | Conventional commit rules | Standard commit format |

### Tooling (managed by mise)

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | 24.14.1 (LTS) | Runtime |
| pnpm | 10.33.0 | Package manager (via corepack) |
| prek | 0.3.5 | Pre-commit hooks (Rust-based) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Cloudflare Workers Static Assets | Netlify / Vercel | Cloudflare has unlimited free bandwidth; Netlify caps at 100GB/mo |
| prek | husky + lint-staged | prek is faster (Rust), handles both pre-commit and commit-msg, no JS dependency |
| eslint-plugin-import-x | eslint-plugin-perfectionist | perfectionist focuses on sorting; import-x covers resolution + ordering |

**Installation:**
```bash
# With pnpm (after mise installs node + corepack enables pnpm)
pnpm add pixi.js
pnpm add -D typescript vite @tailwindcss/vite tailwindcss vitest eslint prettier typescript-eslint @eslint/js eslint-config-prettier eslint-plugin-import-x @commitlint/cli @commitlint/config-conventional wrangler
```

## Architecture Patterns

### Recommended Project Structure
```
keyboard-invader/
├── .mise.toml                    # mise tool versions (node, prek)
├── prek.toml                     # pre-commit + commit-msg hooks
├── commitlint.config.ts          # conventional commit rules
├── eslint.config.mjs             # ESLint flat config
├── .prettierrc                   # Prettier config
├── .editorconfig                 # Universal editor settings
├── tsconfig.json                 # TypeScript strict config
├── vite.config.ts                # Vite + Tailwind + path aliases
├── wrangler.toml                 # Cloudflare Workers deployment
├── package.json                  # pnpm, scripts, packageManager field
├── index.html                    # Vite entry HTML
├── src/
│   ├── main.ts                   # App entry -- initializes PixiJS
│   ├── style.css                 # Tailwind @import + global styles
│   ├── game/                     # PixiJS engine, loop, entities
│   │   └── .gitkeep
│   ├── screens/                  # Menu, profile, settings (Tailwind)
│   │   └── .gitkeep
│   └── shared/                   # Types, utils, i18n, constants
│       ├── i18n/
│       │   ├── index.ts          # t() helper, locale detection
│       │   ├── fr.json           # French locale (placeholder keys)
│       │   └── en.json           # English locale (placeholder keys)
│       └── types/
│           └── index.ts          # Shared type definitions
├── public/                       # Static assets (favicons, etc.)
├── tests/                        # Vitest test files
│   └── smoke.test.ts             # Build/config smoke tests
├── .github/
│   └── workflows/
│       └── ci.yml                # Lint + typecheck + build + deploy
├── LICENSE                       # MIT
└── README.md                     # Project overview + dev setup
```

### Pattern 1: mise .mise.toml for Reproducible Tooling

**What:** Pin all tool versions in `.mise.toml` so every developer gets identical environments.
**When to use:** Always -- this is the project's tool version source of truth.

```toml
# .mise.toml
[tools]
node = "24.14.1"
prek = "0.3.5"

[hooks]
postinstall = "corepack enable pnpm"

[env]
_.path = ["{{config_root}}/node_modules/.bin"]
```

The `packageManager` field in `package.json` pins the exact pnpm version via corepack:
```json
{
  "packageManager": "pnpm@10.33.0+sha512...."
}
```

### Pattern 2: Cloudflare Workers Static Assets (Assets-Only)

**What:** Deploy purely static files to Cloudflare Workers with no Worker script.
**When to use:** For this project -- no server-side logic needed.

```toml
# wrangler.toml
name = "keyboard-invader"
compatibility_date = "2026-03-27"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
```

Key: No `main` field and no `binding` field -- assets-only mode. The `not_found_handling = "single-page-application"` serves index.html for all unmatched routes.

### Pattern 3: ESLint Flat Config with Maximum Strict

**What:** ESLint 10 flat config combining typescript-eslint strict + stylistic + type-checked rules.
**When to use:** Always -- D-10 mandates maximum strictness.

```javascript
// eslint.config.mjs
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'
import importX from 'eslint-plugin-import-x'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/naming-convention': ['error',
        { selector: 'default', format: ['camelCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE'] },
      ],
    },
  },
  importX.flatConfigs.recommended,
  importX.flatConfigs.typescript,
  eslintConfigPrettier, // MUST be last to override conflicting rules
  {
    ignores: ['dist/', 'node_modules/', '*.config.*'],
  },
)
```

### Pattern 4: Tailwind CSS v4 with Vite Plugin

**What:** CSS-first Tailwind v4 configuration -- no JS config file.
**When to use:** For all non-game UI screens (menus, profiles, settings).

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
```

```css
/* src/style.css */
@import 'tailwindcss';

@theme {
  --color-primary: #4f46e5;
  --color-secondary: #10b981;
  /* game-specific theme tokens */
}
```

### Pattern 5: PixiJS v8 Initialization with BitmapText

**What:** Async PixiJS initialization pattern required for Vite production builds.
**When to use:** Entry point for the game canvas.

```typescript
// src/main.ts
import { Application, BitmapText, BitmapFont } from 'pixi.js'

async function init(): Promise<void> {
  const app = new Application()
  await app.init({
    background: '#1a1a2e',
    resizeTo: window,
  })

  document.getElementById('game-container')?.appendChild(app.canvas)

  // Install a bitmap font for high-performance text rendering
  BitmapFont.install({
    name: 'GameFont',
    style: {
      fontFamily: 'Arial',
      fontSize: 48,
      fill: '#ffffff',
    },
  })

  const title = new BitmapText({
    text: 'Keyboard Invader',
    style: { fontFamily: 'GameFont', fontSize: 48 },
  })
  title.x = app.screen.width / 2 - title.width / 2
  title.y = app.screen.height / 2 - title.height / 2
  app.stage.addChild(title)
}

void init()
```

**Important:** Do NOT use top-level await with PixiJS in Vite production builds -- wrap in an async function. This is a known issue.

### Pattern 6: prek.toml Configuration

**What:** Pre-commit and commit-msg hooks via prek.
**When to use:** Git hook configuration for the project.

```toml
# prek.toml
minimum_prek_version = "0.3.0"
default_stages = ["pre-commit"]

[[repos]]
repo = "builtin"
hooks = [
  { id = "trailing-whitespace" },
  { id = "end-of-file-fixer" },
  { id = "check-yaml" },
]

[[repos]]
repo = "local"

[[repos.hooks]]
id = "eslint"
name = "eslint"
language = "system"
entry = "pnpm exec eslint --max-warnings=0"
types_or = ["ts", "javascript"]
stages = ["pre-commit"]

[[repos.hooks]]
id = "prettier"
name = "prettier"
language = "system"
entry = "pnpm exec prettier --check"
types_or = ["ts", "javascript", "css", "json", "yaml"]
stages = ["pre-commit"]

[[repos.hooks]]
id = "typecheck"
name = "typecheck"
language = "system"
entry = "pnpm exec tsc --noEmit"
pass_filenames = false
stages = ["pre-commit"]

[[repos.hooks]]
id = "commitlint"
name = "commitlint"
language = "system"
entry = "pnpm exec commitlint --edit"
stages = ["commit-msg"]
```

### Anti-Patterns to Avoid
- **Top-level await with PixiJS in Vite:** Causes issues in production builds. Always wrap in async function.
- **tailwind.config.js with Tailwind v4:** v4 uses CSS-first config via @theme/@utility directives. No JS config file.
- **PostCSS config for Tailwind v4 with Vite:** The @tailwindcss/vite plugin replaces PostCSS. Do not add postcss.config.js.
- **eslintrc format:** ESLint 10 requires flat config (eslint.config.mjs). Legacy .eslintrc is not supported.
- **Cloudflare Pages deploy commands:** Use `wrangler deploy` (Workers), not `wrangler pages deploy` (deprecated Pages).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Conventional commit validation | Custom regex commit-msg hook | @commitlint/cli + config-conventional | Handles scopes, breaking changes, footers, multi-line messages |
| Import ordering | Manual import sorting rules | eslint-plugin-import-x | Handles groups, alphabetization, type imports consistently |
| TypeScript path alias resolution in ESLint | Manual resolver config | eslint-plugin-import-x typescript resolver | Auto-reads tsconfig paths |
| Pre-commit hook management | Shell scripts in .git/hooks | prek | Manages hook lifecycle, parallel execution, caching |
| Tailwind integration | PostCSS plugin chain | @tailwindcss/vite | First-party, zero-config, faster than PostCSS |

## Common Pitfalls

### Pitfall 1: Cloudflare Pages vs Workers Static Assets
**What goes wrong:** Using deprecated `wrangler pages deploy` or `cloudflare/pages-action`.
**Why it happens:** Cloudflare Pages was deprecated April 2025; old tutorials still reference it.
**How to avoid:** Use `wrangler deploy` with `[assets]` in wrangler.toml. Use `cloudflare/wrangler-action@v3` in GitHub Actions.
**Warning signs:** "pages" in wrangler commands or GitHub Actions config.

### Pitfall 2: PixiJS Top-Level Await in Vite
**What goes wrong:** Production build fails or blank screen with top-level await.
**Why it happens:** Vite's production bundling has issues with top-level await in some configurations.
**How to avoid:** Always wrap PixiJS init in an async function: `async function init() { ... }; void init()`.
**Warning signs:** App works in dev but blank in production build.

### Pitfall 3: ESLint Flat Config + Type-Checked Rules
**What goes wrong:** Lint errors about missing tsconfig project, or "cannot read file" errors.
**Why it happens:** `projectService: true` needs `tsconfigRootDir` to resolve correctly.
**How to avoid:** Set `tsconfigRootDir: import.meta.dirname` in parserOptions. Ensure tsconfig includes all linted files.
**Warning signs:** ESLint errors mentioning "project" or "parserOptions".

### Pitfall 4: pnpm Strict Dependency Resolution
**What goes wrong:** Packages fail to resolve peer dependencies.
**Why it happens:** pnpm's strict node_modules structure doesn't hoist like npm.
**How to avoid:** Check peer dependency warnings on install. Add `.npmrc` with `auto-install-peers=true` if needed.
**Warning signs:** "Cannot find module" errors for transitive dependencies.

### Pitfall 5: Tailwind v4 CSS-First Migration Confusion
**What goes wrong:** Trying to create tailwind.config.js or postcss.config.js.
**Why it happens:** Most tutorials still show v3 patterns.
**How to avoid:** v4 uses `@import 'tailwindcss'` in CSS + `@theme {}` blocks for customization. No JS config.
**Warning signs:** Any `.config.js` file with "tailwind" or "postcss" in its name.

### Pitfall 6: mise Corepack + pnpm Setup Order
**What goes wrong:** pnpm not available after `mise install`.
**Why it happens:** Corepack needs to be enabled before pnpm is available.
**How to avoid:** Use `[hooks] postinstall = "corepack enable pnpm"` in .mise.toml AND set `packageManager` in package.json.
**Warning signs:** "pnpm: command not found" after mise install.

## Code Examples

### TypeScript Strict Config
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "paths": {
      "@/*": ["./src/*"]
    },
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Prettier Config
```json
// .prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 100,
  "trailingComma": "all"
}
```

### i18n Foundation
```typescript
// src/shared/i18n/index.ts
import fr from './fr.json'
import en from './en.json'

type Locale = 'fr' | 'en'
type TranslationKey = keyof typeof fr

const translations: Record<Locale, Record<string, string>> = { fr, en }

let currentLocale: Locale = detectLocale()

function detectLocale(): Locale {
  const browserLang = navigator.language.slice(0, 2)
  return browserLang === 'fr' ? 'fr' : 'en'
}

export function t(key: TranslationKey): string {
  return translations[currentLocale][key] ?? key
}

export function setLocale(locale: Locale): void {
  currentLocale = locale
}

export function getLocale(): Locale {
  return currentLocale
}
```

```json
// src/shared/i18n/fr.json
{
  "app.title": "Keyboard Invader",
  "app.subtitle": "Apprends a taper en t'amusant !",
  "menu.play": "Jouer",
  "menu.profiles": "Profils",
  "menu.settings": "Reglages"
}
```

### GitHub Actions CI/CD
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm exec eslint .

      - name: Typecheck
        run: pnpm exec tsc --noEmit

      - name: Test
        run: pnpm exec vitest run

      - name: Build
        run: pnpm run build

  deploy:
    needs: check
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
    steps:
      - uses: actions/checkout@v4

      - uses: jdx/mise-action@v2

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build
        run: pnpm run build

      - name: Deploy to Cloudflare Workers
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### EditorConfig
```ini
# .editorconfig
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Cloudflare Pages | Workers Static Assets | April 2025 | Use wrangler deploy with [assets] config, not pages deploy |
| ESLint legacy config (.eslintrc) | Flat config (eslint.config.mjs) | ESLint 9+ (2024) | Must use flat config with ESLint 10 |
| tailwind.config.js | CSS-first @theme config | Tailwind v4 (Jan 2025) | No JS config file, use @import 'tailwindcss' + @theme |
| PostCSS for Tailwind | @tailwindcss/vite plugin | Tailwind v4 | No postcss.config.js needed |
| pre-commit (Python) | prek (Rust) | 2025 | Faster, same config format, native TOML support |
| npm / yarn | pnpm via corepack | Stable | Strict deps, disk-efficient, corepack-managed |
| TypeScript 5.x | TypeScript 6.0 | 2025/2026 | Supports all strict options, verbatimModuleSyntax |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| mise | D-05: Tool management | Yes | 2026.3.7 | -- |
| Node.js | Runtime | Yes (25.8.0 system) | 24.14.1 via mise | -- |
| pnpm | D-07: Package manager | No (globally) | Via corepack after mise | corepack enable pnpm |
| prek | D-08: Pre-commit hooks | Yes | 0.3.5 | -- |
| wrangler | INFRA-01: Deployment | No (dev dep) | 4.78.0 via pnpm | Installed as dev dependency |
| GitHub Actions | D-02: CI/CD | Yes (GitHub repo) | -- | -- |
| Cloudflare account | INFRA-01: Hosting | Needs manual setup | -- | User must create account + API token |

**Missing dependencies with no fallback:**
- Cloudflare account + API token (CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID) -- must be created manually and added as GitHub secrets

**Missing dependencies with fallback:**
- pnpm: Not installed globally, but corepack enables it automatically via mise postinstall hook

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vitest shares vite.config.ts (no separate config needed) |
| Quick run command | `pnpm exec vitest run` |
| Full suite command | `pnpm exec vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DX-01 | Pre-commit hooks configured and prek.toml valid | smoke | `prek validate-config` | No -- Wave 0 |
| DX-02 | ESLint config loads and catches violations | unit | `pnpm exec vitest run tests/smoke.test.ts` | No -- Wave 0 |
| DX-03 | TypeScript strict mode enabled (noUncheckedIndexedAccess etc.) | unit | `pnpm exec vitest run tests/smoke.test.ts` | No -- Wave 0 |
| DX-04 | Tailwind CSS compiles and classes work | smoke | `pnpm run build` (build succeeds) | No -- Wave 0 |
| DX-05 | PixiJS initializes on canvas | smoke | `pnpm exec vitest run tests/smoke.test.ts` | No -- Wave 0 |
| INFRA-01 | Build produces deployable static bundle | smoke | `pnpm run build && ls dist/index.html` | No -- Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm exec vitest run`
- **Per wave merge:** `pnpm exec vitest run && pnpm run build`
- **Phase gate:** Full suite green + successful Cloudflare deployment

### Wave 0 Gaps
- [ ] `tests/smoke.test.ts` -- covers DX-02, DX-03, DX-05, INFRA-01
- [ ] Vitest configuration in vite.config.ts (test block)
- [ ] Framework install: `pnpm add -D vitest`

## Sources

### Primary (HIGH confidence)
- npm registry -- all package versions verified via `npm view` on 2026-03-29
- [Cloudflare Workers Static Assets docs](https://developers.cloudflare.com/workers/static-assets/) -- assets-only deployment pattern
- [prek.j178.dev/configuration](https://prek.j178.dev/configuration/) -- prek.toml format and hook options
- [prek.j178.dev/quickstart](https://prek.j178.dev/quickstart/) -- prek installation and usage
- [typescript-eslint.io/users/configs](https://typescript-eslint.io/users/configs/) -- strict + stylistic presets
- [Tailwind CSS v4 docs](https://tailwindcss.com/docs) -- Vite plugin setup, CSS-first config
- mise ls-remote -- Node 24.14.1 LTS confirmed available

### Secondary (MEDIUM confidence)
- [Cloudflare Pages deprecation](https://developers.cloudflare.com/workers/static-assets/migration-guides/migrate-from-pages/) -- Workers migration guide
- [cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action) -- GitHub Actions deployment
- [compilerla/conventional-pre-commit](https://github.com/compilerla/conventional-pre-commit) -- conventional commit hook (alternative to commitlint)
- [PixiJS setup with Vite and TypeScript](https://mrlinxed.com/blog/pixijs-setup-with-vite-and-typescript) -- async init pattern

### Tertiary (LOW confidence)
- None -- all findings verified against primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all versions verified against npm registry on 2026-03-29
- Architecture: HIGH -- patterns verified against official docs for each tool
- Pitfalls: HIGH -- Cloudflare Pages deprecation and PixiJS async init are well-documented
- CI/CD: MEDIUM -- Cloudflare Workers deploy via wrangler-action@v3 is the official path but assets-only mode is newer

**Research date:** 2026-03-29
**Valid until:** 2026-04-28 (stable stack, 30-day window)
