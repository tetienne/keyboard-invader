# Technology Stack

**Project:** Keyboard Invader
**Researched:** 2026-03-28

## Recommended Stack

### Core Framework: Vanilla TypeScript + Vite

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| TypeScript | ~5.7 | Type safety, IDE support | Catches bugs early, great DX with game state types | HIGH |
| Vite | 8.x | Build tool, dev server, static output | Fastest build tool, native ESM, zero-config for vanilla TS, outputs static files for free hosting | HIGH |

**Why NOT React/Svelte/Vue:** This is a game, not a CRUD app. A UI framework adds overhead (Virtual DOM diffing, component lifecycle) that fights against a game loop. The game canvas renders via PixiJS, not DOM. UI frameworks are useful for menus/settings overlays -- but for a kids' typing game with minimal UI chrome, vanilla TS with a few DOM elements for menus is simpler and more performant. If menu complexity grows later, Svelte (1.6KB runtime) could be added for the menu layer only.

### Rendering Engine: PixiJS

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| PixiJS | 8.17.x | 2D WebGL/Canvas rendering | Fastest 2D renderer, 450KB (vs Phaser 1.2MB), excellent text/SVG support, v8 has mature BitmapText for typing games | HIGH |

**Why PixiJS over Phaser:** Phaser is a full game engine (physics, tilemaps, cameras) -- overkill for a typing game that needs text falling down a screen. Phaser 3 is EOL (v3.90 is the last release), Phaser 4 is still in RC6 as of Dec 2025 and not production-stable. PixiJS is a focused renderer: lighter, faster, and actively maintained with monthly releases. For a typing game, we need excellent text rendering and sprite animation -- PixiJS excels at both. We build the simple "game logic" (gravity, collision with typed text) ourselves in ~100 lines.

**Why NOT Kaplay/Kaboom:** Kaplay (Kaboom successor) benchmarks at 3 FPS in rendering stress tests vs PixiJS at 47 FPS. Fun API but unacceptable performance for smooth animations that keep kids engaged.

**Key PixiJS features for this project:**
- `BitmapText` for high-performance dynamic text (letters/words falling) -- avoids canvas re-rendering per frame
- `SplitBitmapText` (v8.11+) for splitting text into individual characters -- perfect for letter-by-letter typing feedback
- SVG support for cartoon character sprites
- WebGL with Canvas fallback for older machines

### Animation

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| GSAP | 3.12.x | UI animations, transitions, celebrations | Industry standard, works everywhere, timeline sequencing for "level complete" celebrations, free for non-commercial | MEDIUM |
| PixiJS built-in ticker | 8.17.x | Game loop, falling word movement | Already included, no extra dependency for core game animations | HIGH |

**Why GSAP over anime.js/Motion:** GSAP has the most reliable cross-browser behavior and best timeline API for sequencing celebration animations (explosions, XP counters, level-up effects). anime.js is lighter but less battle-tested for complex sequences. Motion is React-focused.

**Note on GSAP licensing:** GSAP is free for projects that don't charge users. This is a free kids' game -- no licensing issue. If this changes, anime.js (lightweight, MIT) is the fallback.

### Audio

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Howler.js | 2.2.4 | Sound effects, background music | 7KB gzipped, Web Audio API with HTML5 Audio fallback, sprite support for multiple SFX from one file, battle-tested | HIGH |

**Why Howler.js over raw Web Audio API:** Howler abstracts browser quirks (autoplay policies, format support, mobile audio unlock) that would take significant effort to handle manually. 7KB is negligible overhead for massive DX improvement. TypeScript types available via `@types/howler`.

**Note:** Howler.js last published 3 years ago. This is fine -- the Web Audio API it wraps is stable, and the library is mature/complete. If it becomes unmaintained long-term, the Web Audio API directly is the fallback.

### Internationalization

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Custom JSON + Intl API | Native | French/English UI strings, word lists per language | For a game with ~50 UI strings, i18next (22KB) is overkill. Simple JSON files + native `Intl` for pluralization. Extensible to more languages. | MEDIUM |

**Pattern:**
```typescript
// locales/fr.json
{ "start": "Jouer", "score": "Score", "level": "Niveau {n}" }

// locales/en.json
{ "start": "Play", "score": "Score", "level": "Level {n}" }

// Simple loader
const t = (key: string, params?: Record<string, string | number>) => {
  let str = translations[currentLocale][key];
  if (params) Object.entries(params).forEach(([k, v]) => str = str.replace(`{${k}}`, String(v)));
  return str;
};
```

**Why NOT i18next:** 22KB bundle for ~50 strings is wasteful. The game's i18n needs are simple: static UI labels + word lists per language. No pluralization complexity, no ICU message format, no namespace loading. A 30-line custom solution covers it.

**Word lists are separate from UI i18n:** Each language needs curated word lists by difficulty (letters, simple words, complex words). These are JSON data files, not i18n strings.

### Persistence

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| LocalStorage | Native | Default save: profiles, progress, settings | Zero dependencies, synchronous, 5-10MB per origin, works offline | HIGH |
| Firebase (optional) | 12.x | Cloud sync between devices | Tree-shakeable SDK, Firestore for profiles + Auth Anonymous for device linking | MEDIUM |

**Firebase integration strategy:** Do NOT add Firebase from day one. Build with LocalStorage-only first. Firebase is Phase 2+ when cloud sync is needed. Use a `StorageAdapter` interface so the game code never knows which backend it uses.

```typescript
interface StorageAdapter {
  saveProfile(profile: PlayerProfile): Promise<void>;
  loadProfile(id: string): Promise<PlayerProfile | null>;
  listProfiles(): Promise<PlayerProfile[]>;
}
// LocalStorageAdapter implements this first
// FirebaseAdapter implements it later
```

**Firebase modules to use (tree-shake the rest):**
- `firebase/firestore` -- profile data
- `firebase/auth` -- anonymous auth only (no passwords for kids)

### Graphics / Art Assets

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| SVG sprites | N/A | Character art, backgrounds, UI elements | Scalable to any resolution, small file size, animatable, cartoon-friendly | HIGH |
| PixiJS SVG support | 8.17.x | Rendering SVGs on canvas | Native SVG texture support in PixiJS v8 | HIGH |

**Art pipeline:** Design characters and elements as SVG in Figma/Inkscape. Export as optimized SVG. Load directly into PixiJS as textures. Animate with PixiJS transforms + GSAP for complex sequences.

### Static Hosting

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| Cloudflare Pages | Production hosting | Fastest global CDN, generous free tier (unlimited bandwidth), automatic HTTPS, easy GitHub integration | HIGH |

**Why Cloudflare Pages over alternatives:**
- **vs GitHub Pages:** Cloudflare has faster global edge network, better caching
- **vs Netlify:** Cloudflare free tier has no bandwidth limits (Netlify caps at 100GB/mo)
- **vs Vercel:** Cloudflare is simpler for pure static sites (no serverless complexity)

All four work. Cloudflare Pages is the best default for a static game with zero backend.

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

```bash
# Initialize project
npm create vite@latest keyboard-invader -- --template vanilla-ts
cd keyboard-invader

# Core dependencies
npm install pixi.js howler gsap

# TypeScript types
npm install -D @types/howler

# Dev tools
npm install -D vitest eslint prettier

# Firebase (Phase 2+ ONLY, not initial install)
# npm install firebase
```

## Project Structure

```
src/
  main.ts              # Entry point, app init
  game/
    Game.ts            # Game loop, state machine
    GameScene.ts       # PixiJS scene with falling words
    InputHandler.ts    # Keyboard event handling
    WordSpawner.ts     # Spawns letters/words based on difficulty
    DifficultyEngine.ts # Adaptive difficulty algorithm
  ui/
    MenuScreen.ts      # Start screen, profile selection
    HUD.ts             # Score, level, XP display
    Celebrations.ts    # GSAP-powered level-up effects
  data/
    words/
      fr.json          # French word lists by difficulty
      en.json          # English word lists by difficulty
  audio/
    AudioManager.ts    # Howler.js wrapper
  i18n/
    index.ts           # Translation loader
    locales/
      fr.json          # French UI strings
      en.json          # English UI strings
  storage/
    StorageAdapter.ts  # Interface
    LocalAdapter.ts    # LocalStorage implementation
  models/
    PlayerProfile.ts   # Profile type definitions
    GameConfig.ts      # Game settings types
  assets/
    sprites/           # SVG character art
    audio/             # Sound effects, music
```

## Version Pinning Strategy

Pin major versions, allow minor/patch updates:
```json
{
  "pixi.js": "^8.17.0",
  "howler": "^2.2.4",
  "gsap": "^3.12.0"
}
```

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
