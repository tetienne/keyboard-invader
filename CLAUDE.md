<!-- GSD:project-start source:PROJECT.md -->
## Project

**Keyboard Invader**

Application web ludique style "typing invaders" pour apprendre la dactylographie aux enfants. Des mots et lettres tombent du haut de l'ecran, l'enfant tape pour les eliminer. Le jeu s'adapte au niveau de chaque enfant avec un systeme de progression (XP, niveaux, personnages a debloquer).

**Core Value:** Rendre l'apprentissage du clavier amusant et non frustrant pour des enfants de 5 a 8 ans, avec une difficulte qui s'adapte automatiquement a leur niveau.

### Constraints

- **Hosting**: Plateforme gratuite (static hosting) -- pas de budget serveur
- **No backend**: Tout cote client, Firebase uniquement pour la persistence cloud optionnelle
- **Accessibilite**: Doit fonctionner sur tous les navigateurs modernes
- **Performance**: Animations fluides meme sur machines modestes (laptops d'enfants)
- **Securite enfants**: Aucune donnee personnelle collectee, pas de chat, pas de liens externes
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework: Vanilla TypeScript + Vite
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | ~5.7 | Type safety, IDE support | Catches bugs early, great DX with game state types | HIGH |
| Vite | 8.x | Build tool, dev server, static output | Fastest build tool, native ESM, zero-config for vanilla TS, outputs static files for free hosting | HIGH |
### Rendering Engine: PixiJS
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PixiJS | 8.17.x | 2D WebGL/Canvas rendering | Fastest 2D renderer, 450KB (vs Phaser 1.2MB), excellent text/SVG support, v8 has mature BitmapText for typing games | HIGH |
- `BitmapText` for high-performance dynamic text (letters/words falling) -- avoids canvas re-rendering per frame
- `SplitBitmapText` (v8.11+) for splitting text into individual characters -- perfect for letter-by-letter typing feedback
- SVG support for cartoon character sprites
- WebGL with Canvas fallback for older machines
### Animation
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| GSAP | 3.12.x | UI animations, transitions, celebrations | Industry standard, works everywhere, timeline sequencing for "level complete" celebrations, free for non-commercial | MEDIUM |
| PixiJS built-in ticker | 8.17.x | Game loop, falling word movement | Already included, no extra dependency for core game animations | HIGH |
### Audio
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Howler.js | 2.2.4 | Sound effects, background music | 7KB gzipped, Web Audio API with HTML5 Audio fallback, sprite support for multiple SFX from one file, battle-tested | HIGH |
### Internationalization
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom JSON + Intl API | Native | French/English UI strings, word lists per language | For a game with ~50 UI strings, i18next (22KB) is overkill. Simple JSON files + native `Intl` for pluralization. Extensible to more languages. | MEDIUM |
### Persistence
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| LocalStorage | Native | Default save: profiles, progress, settings | Zero dependencies, synchronous, 5-10MB per origin, works offline | HIGH |
| Firebase (optional) | 12.x | Cloud sync between devices | Tree-shakeable SDK, Firestore for profiles + Auth Anonymous for device linking | MEDIUM |
- `firebase/firestore` -- profile data
- `firebase/auth` -- anonymous auth only (no passwords for kids)
### Graphics / Art Assets
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SVG sprites | N/A | Character art, backgrounds, UI elements | Scalable to any resolution, small file size, animatable, cartoon-friendly | HIGH |
| PixiJS SVG support | 8.17.x | Rendering SVGs on canvas | Native SVG texture support in PixiJS v8 | HIGH |
### Static Hosting
| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Cloudflare Pages | Production hosting | Fastest global CDN, generous free tier (unlimited bandwidth), automatic HTTPS, easy GitHub integration | HIGH |
- **vs GitHub Pages:** Cloudflare has faster global edge network, better caching
- **vs Netlify:** Cloudflare free tier has no bandwidth limits (Netlify caps at 100GB/mo)
- **vs Vercel:** Cloudflare is simpler for pure static sites (no serverless complexity)
### Dev Dependencies
| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | 3.x | Unit testing | Same config as Vite, fast, TS-native | HIGH |
| ESLint | 9.x | Linting | Flat config, catches bugs | HIGH |
| Prettier | 3.x | Formatting | Consistent code style | HIGH |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI Framework | Vanilla TS | React/Svelte | Game loop doesn't benefit from VDOM; adds complexity and bundle size |
| Game Engine | PixiJS 8 | Phaser 3/4 | Phaser 3 is EOL, Phaser 4 still in RC; Phaser is overkill for a typing game |
| Game Engine | PixiJS 8 | Kaplay | 3 FPS benchmark vs 47 FPS; unacceptable |
| Animation | GSAP | anime.js | Less reliable for complex timelines; GSAP is industry standard |
| Animation | GSAP | Motion | React-focused, not suitable for canvas game |
| Audio | Howler.js | Tone.js | Tone.js is for music synthesis, not game SFX |
| i18n | Custom JSON | i18next | 22KB for ~50 strings; massively over-engineered |
| i18n | Custom JSON | LinguiJS | Adds build step complexity for marginal benefit |
| Database | LocalStorage | IndexedDB | IndexedDB is async and complex; profile data is small (<100KB) |
| Hosting | Cloudflare Pages | GitHub Pages | Slower CDN, less flexible |
| Build Tool | Vite 8 | Webpack | Vite is faster, simpler, and the modern standard |
## Complete Installation
# Initialize project
# Core dependencies
# TypeScript types
# Dev tools
# Firebase (Phase 2+ ONLY, not initial install)
# npm install firebase
## Project Structure
## Version Pinning Strategy
## Sources
- [PixiJS v8.17.0 releases](https://github.com/pixijs/pixijs/releases) - Current version verified
- [PixiJS Text Overview](https://pixijs.download/v8.13.0/docs/text.html) - BitmapText for performance
- [PixiJS blog v8.11.0](https://pixijs.com/blog/8.11.0) - SplitBitmapText feature
- [Phaser v3.90 final release](https://phaser.io/download/stable) - Phaser 3 EOL confirmed
- [Phaser v4 RC6](https://phaser.io/news/2025/12/phaser-v4-release-candidate-6-is-out) - Still not stable
- [JS Game Rendering Benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark) - PixiJS vs Kaplay performance
- [Howler.js](https://howlerjs.com/) - Audio library, 7KB gzipped
- [Vite releases](https://vite.dev/releases) - Vite 8 with Rolldown
- [Firebase JS SDK npm](https://www.npmjs.com/package/firebase) - v12.x confirmed
- [GSAP vs Motion comparison](https://motion.dev/docs/gsap-vs-motion) - Animation library analysis
- [Cloudflare Pages](https://pages.cloudflare.com/) - Free static hosting
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
