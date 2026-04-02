# Phase 8: Visual Identity - Research

**Researched:** 2026-04-02
**Domain:** PixiJS v8 visual art pipeline (SVG assets, BitmapFont, particles, animation)
**Confidence:** HIGH

## Summary

Phase 8 transforms the game from programmer-art (plain BitmapText + Graphics primitives) into a cohesive cartoon space-invader visual identity. The core technical challenges are: (1) loading and rendering SVG alien/avatar sprites efficiently in PixiJS v8, (2) replacing the default Arial BitmapFont with a rounded child-friendly web font (Fredoka), (3) building particle effects for destruction/celebration using PixiJS ParticleContainer for performance, (4) adding animated starfield background with parallax layers, and (5) ensuring 60fps on a mid-range laptop with 4x CPU throttle.

The existing codebase uses BitmapText pools, a tween system, and a celebration overlay with Graphics-based circle particles. All of these need upgrading but the patterns (object pools, tween system, container hierarchy) are solid foundations. The main risk is SVG complexity causing parse/render overhead; the mitigation is to use simple SVG designs and load them as textures (not as Graphics vectors) for game entities.

**Primary recommendation:** Use SVG files loaded as textures via `Assets.load()` for alien sprites and avatars. Use `@fontsource/fredoka` for the rounded font. Use PixiJS ParticleContainer for destruction particles. Keep alien containers as regular Container (Sprite + BitmapText children) since we need ~20 max on screen, not thousands.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Space invaders theme. Letters fall from space as alien invaders. Starry animated background, space-themed decorations throughout.
- **D-02:** Falling letters are carried by cute alien creatures (round, blobby style, soft shapes, big eyes, no sharp edges). Each letter sits on/in an alien that reacts when hit.
- **D-03:** 6-8 different alien creature designs that rotate randomly when spawning.
- **D-04:** Aliens have subtle idle animations while falling: gentle bobbing/floating motion + occasional blink. Uses existing tween system.
- **D-05:** Animated starfield background with slowly scrolling stars and subtle parallax layers. Maybe a planet or moon in the corner.
- **D-06:** Full space theme on all menu screens (profile select, results, main menu): star backgrounds, alien decorations, themed buttons. Consistent immersion.
- **D-07:** Word mode aliens are visually distinct from letter mode aliens: bigger, possibly multi-eyed or multi-armed.
- **D-08:** Avatars are a mix of kid characters and alien characters, all drawn in the same round/blobby style.
- **D-09:** Avatar split across 6 slots: 2 kids + 1 alien free, 1 kid + 2 aliens locked (unlocked at levels 3, 5, 8).
- **D-10:** Replace current Graphics primitive avatar placeholders with proper SVG character art.
- **D-11:** Add space-themed cosmetic level titles: e.g., "Cadet", "Pilote", "Capitaine", "Commandant". Displayed on profile and level-up celebration.
- **D-12:** Correct hit: alien does a funny surprised face, then pops into colorful star/sparkle particles.
- **D-13:** Wrong key (miss): targeted alien does a quick dodge or cheeky taunt animation.
- **D-14:** Letter reaching bottom: alien escapes with animation (waves goodbye or zips off the bottom with a trail).
- **D-15:** Subtle background shift as difficulty increases: stars get brighter, nebula shifts hue.
- **D-16:** Level-up celebration gets space-themed upgrade: stars, rockets, planet confetti. Brief "warp speed" star streak effect.
- **D-17:** A small defender spaceship at bottom that visually "shoots" when the kid types correctly.
- **D-18:** Background shifts from dark navy (#1a1a2e) to deep purple/indigo space.
- **D-19:** Rounded/bubbly game font (Fredoka, Baloo, or similar) replacing Arial BitmapFont.
- **D-20:** Redesigned 8-color letter palette harmonized with deep purple background.
- **D-21:** UI elements get rounded corners with subtle glow/neon-ish borders.
- **D-22:** Fix current blurriness in fonts and graphics. Proper resolution scaling for BitmapFont generation.

### Claude's Discretion
- Exact alien creature designs (shapes, eye styles, color assignments)
- Specific SVG implementation details (inline vs file-loaded, complexity level)
- Exact star/particle counts and animation timings
- Defender spaceship design and "shoot" animation specifics
- Exact color hex values for the new palette
- Parallax layer count and scroll speeds for starfield
- BitmapFont choice (Fredoka vs Baloo vs other rounded font)
- Exact level title names (within space-themed direction)
- Performance optimization decisions (sprite sheets, batching, etc.)

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AV-01 | Le jeu a un style visuel cartoon/SVG avec des personnages colores et expressifs | All 22 decisions (D-01 through D-22) collectively implement this requirement. SVG alien sprites, rounded font, color palette, particle effects, space theme, and avatar art. |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| pixi.js | 8.17.1 | 2D WebGL/Canvas rendering | Already in project, provides Sprite, Container, ParticleContainer, BitmapFont, Assets.load |
| vite | 8.0.3 | Build tool, asset pipeline | Already in project, handles SVG imports and font files natively |

### New Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fontsource/fredoka | 5.2.10 | Self-hosted rounded/bubbly web font | Import in BootState before BitmapFont.install(). Provides woff2 files bundled by Vite. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @fontsource/fredoka | Google Fonts CDN | CDN adds external dependency + CORS complexity. Fontsource bundles with Vite, zero network dependency at runtime |
| @fontsource/fredoka | @fontsource/baloo-2 | Both are rounded kid-friendly fonts. Fredoka has variable weight support and slightly rounder letterforms. Either works. |
| ParticleContainer for effects | Regular Container + Graphics | Regular Container is simpler but slower for 40+ particles. ParticleContainer handles hundreds at near-zero cost. |
| SVG as Texture (Assets.load) | SVG as Graphics (.svg() method) | Graphics preserves vector scalability but complex SVGs parse slowly. For fixed-size game sprites, texture is faster and simpler. |
| GSAP | Existing tween system | GSAP is listed in CLAUDE.md stack but the game already has a working tween system. Adding GSAP (43KB) for what the existing system can handle is unnecessary overhead. Extend the existing tween system instead. |

**Installation:**
```bash
pnpm add @fontsource/fredoka
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  assets/                    # NEW: SVG files for aliens, avatars, spaceship
    aliens/
      alien-01.svg           # 6-8 letter-mode alien designs
      alien-02.svg
      ...
      word-alien-01.svg      # 2-3 word-mode alien designs (bigger, multi-eyed)
      word-alien-02.svg
    avatars/
      kid-01.svg             # 3 kid avatar designs
      kid-02.svg
      kid-03.svg
      alien-avatar-01.svg    # 3 alien avatar designs
      alien-avatar-02.svg
      alien-avatar-03.svg
    spaceship.svg            # Defender spaceship
    star.svg                 # Star particle shape (tiny, reusable)
    planet.svg               # Optional background decoration
  game/
    theme.ts                 # NEW: Color palette, constants, shared visual config
    starfield.ts             # NEW: Animated parallax star background
    alien-container.ts       # NEW: AlienContainer class wrapping sprite + letter text
    effects.ts               # NEW: Destruction particles, shoot effect, escape trail
    defender.ts              # NEW: Defender spaceship at bottom
  avatars/
    definitions.ts           # MODIFY: Update AvatarDefinition with svgPath, remove shape
    renderer.ts              # REWRITE: SVG-based rendering instead of Graphics primitives
```

### Pattern 1: Alien Container Composition
**What:** Each falling letter/word is a Container holding an alien Sprite + BitmapText child.
**When to use:** All letter and word entities in PlayingState.
**Example:**
```typescript
// Source: PixiJS v8 Container + Sprite pattern
import { Container, Sprite, BitmapText, Texture } from 'pixi.js'

class AlienContainer extends Container {
  readonly sprite: Sprite
  readonly label: BitmapText
  private bobPhase = Math.random() * Math.PI * 2 // randomize start
  private blinkTimer = 2000 + Math.random() * 3000

  constructor(texture: Texture, letter: string, tint: number) {
    super()
    this.sprite = new Sprite(texture)
    this.sprite.anchor.set(0.5)
    this.label = new BitmapText({
      text: letter,
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    this.label.anchor.set(0.5)
    this.label.tint = tint
    this.addChild(this.sprite)
    this.addChild(this.label)
  }

  updateIdle(dt: number): void {
    // Gentle bobbing
    this.bobPhase += dt * 0.003
    this.sprite.y = Math.sin(this.bobPhase) * 3

    // Occasional blink (swap texture or scale eyes)
    this.blinkTimer -= dt
    if (this.blinkTimer <= 0) {
      this.blinkTimer = 2000 + Math.random() * 3000
      // Trigger blink animation (brief squash of sprite)
    }
  }
}
```

### Pattern 2: SVG Asset Loading in BootState
**What:** Load all SVG textures during boot using Assets.load(), then install BitmapFont with Fredoka.
**When to use:** BootState.enter() becomes async.
**Example:**
```typescript
// Source: PixiJS v8 Assets guide
import '@fontsource/fredoka/400.css'
import '@fontsource/fredoka/700.css'
import { Assets, BitmapFont } from 'pixi.js'

// In BootState.enter():
// 1. Wait for font CSS to be ready
await document.fonts.load('400 48px Fredoka')
await document.fonts.load('700 48px Fredoka')

// 2. Install BitmapFont with Fredoka at proper resolution
BitmapFont.install({
  name: 'GameFont',
  style: {
    fontFamily: 'Fredoka',
    fontSize: 80,
    fill: '#ffffff',
  },
  resolution: 2, // Fix blurriness (D-22)
})

// 3. Load SVG textures
const alienTextures = await Assets.load([
  'src/assets/aliens/alien-01.svg',
  'src/assets/aliens/alien-02.svg',
  // ...
])
```

### Pattern 3: Animated Starfield with Parallax
**What:** Multiple layers of stars scrolling at different speeds for depth illusion.
**When to use:** Background of PlayingState and all menu states.
**Example:**
```typescript
// Three parallax layers: far (slow, dim), mid, near (fast, bright)
class Starfield {
  private layers: StarLayer[]

  constructor(container: Container) {
    this.layers = [
      new StarLayer(container, { count: 40, speed: 10, alpha: 0.3, size: 1 }),
      new StarLayer(container, { count: 25, speed: 25, alpha: 0.6, size: 2 }),
      new StarLayer(container, { count: 15, speed: 45, alpha: 1.0, size: 3 }),
    ]
  }

  update(dt: number): void {
    for (const layer of this.layers) layer.update(dt)
  }

  // D-15: Difficulty-based visual shift
  setIntensity(level: number): void {
    // Increase star brightness and count based on difficulty
  }
}
```

### Pattern 4: Destruction Particle Burst
**What:** When an alien is hit, spawn a burst of star-shaped particles using ParticleContainer.
**When to use:** On correct hit (D-12), replacing the current simple tween fade.
**Example:**
```typescript
import { ParticleContainer, Particle, Texture } from 'pixi.js'

class DestructionEffect {
  private pc: ParticleContainer
  private particles: { p: Particle; vx: number; vy: number; life: number }[] = []

  constructor(starTexture: Texture) {
    this.pc = new ParticleContainer({
      dynamicProperties: { position: true, scale: true, alpha: true },
    })
  }

  burst(x: number, y: number, color: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3
      const speed = 80 + Math.random() * 120
      const p = new Particle({ texture: this.starTexture, x, y, tint: color })
      this.pc.addParticle(p)
      this.particles.push({
        p, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1.0,
      })
    }
  }

  update(dt: number): void {
    const ds = dt / 1000
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const item = this.particles[i]!
      item.p.x += item.vx * ds
      item.p.y += item.vy * ds
      item.life -= ds * 2
      item.p.alpha = Math.max(0, item.life)
      item.p.scaleX = item.p.scaleY = 0.5 + item.life * 0.5
      if (item.life <= 0) {
        this.pc.removeParticle(item.p)
        this.particles.splice(i, 1)
      }
    }
  }
}
```

### Anti-Patterns to Avoid
- **Loading SVGs as Graphics for game entities:** Graphics.svg() parses the SVG path each time. For repeated sprites, load as texture once and create Sprites. Graphics is for one-off decorative elements only.
- **Creating new BitmapText per frame:** The pool pattern is already in place. Keep it. AlienContainer should be pooled too.
- **Using GSAP alongside the existing tween system:** The project already has a lightweight tween system in `tween.ts`. Adding GSAP (43KB gzipped) for the same job adds bundle bloat and two animation systems. Extend the existing one.
- **Over-complex SVGs:** Each alien SVG should be under 2KB. Simple paths, no gradients, no filters, no text elements. PixiJS SVG texture support is limited on complex features.
- **Forgetting `resolution: 2` on BitmapFont:** This is the #1 cause of blurry text in PixiJS. The current code uses default resolution (1), which looks fuzzy on HiDPI displays.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web font loading | Manual @font-face + fetch | `@fontsource/fredoka` + `document.fonts.load()` | Handles FOIT/FOUT, provides woff2, works with Vite bundling |
| Particle effects (high count) | Custom Graphics circles in Container | `ParticleContainer` + `Particle` | PixiJS built-in, 50x faster than Container+Graphics for 40+ particles |
| Asset loading/caching | Manual fetch + texture creation | `Assets.load()` | Built-in caching, format detection, error handling |
| Parallax scrolling | Manual layer management | Simple class wrapping PixiJS Container + tiling | But DO hand-roll the class itself; no library needed for 3 layers |
| SVG rendering | Canvas 2D SVG drawing | PixiJS `Assets.load('file.svg')` -> Sprite | Automatic texture conversion with resolution control |

**Key insight:** PixiJS v8 has mature asset loading, particle systems, and text rendering built in. The art pipeline is: SVG files -> Vite static assets -> Assets.load() at boot -> Sprite textures. No external rendering libraries needed.

## Common Pitfalls

### Pitfall 1: BitmapFont Installed Before Web Font Loads
**What goes wrong:** BitmapFont.install() generates a texture atlas from the specified fontFamily. If the web font CSS hasn't finished loading, it falls back to a system font (often serif), producing ugly glyphs baked permanently into the atlas.
**Why it happens:** CSS @font-face loading is async. Import order doesn't guarantee the font is ready.
**How to avoid:** Use `document.fonts.load('400 48px Fredoka')` and await the promise before calling BitmapFont.install(). This is the standard Web Fonts API.
**Warning signs:** Text looks like Times New Roman or has wrong letter spacing.

### Pitfall 2: Blurry BitmapFont on HiDPI Displays
**What goes wrong:** Text looks fuzzy/smeared, especially on retina screens.
**Why it happens:** BitmapFont default resolution is 1. On a 2x display, the texture atlas is rendered at half the needed pixel density.
**How to avoid:** Pass `resolution: 2` (or `window.devicePixelRatio`) to `BitmapFont.install()`. This is decision D-22.
**Warning signs:** Text looks fine at 100% zoom but blurry at native resolution. Compare with a regular HTML text element.

### Pitfall 3: SVG Texture Size Explosion
**What goes wrong:** Large SVGs create oversized textures that consume GPU memory and cause frame drops.
**Why it happens:** PixiJS rasterizes SVGs at load time. A 1000x1000 SVG at resolution 2 becomes a 2000x2000 texture.
**How to avoid:** Keep alien SVGs small (64x64 to 128x128 viewBox). Use simple paths, no embedded images. Set explicit `width`/`height` attributes on the SVG root element.
**Warning signs:** GPU memory spikes on asset load. FPS drops when many entities visible.

### Pitfall 4: Pool Architecture Mismatch After Refactor
**What goes wrong:** Current pools create bare BitmapText items. After the visual overhaul, entities are Container (Sprite + BitmapText). The pool factory and GameContext interface must change.
**Why it happens:** The pool's generic type and the GameContext interface both reference BitmapText directly.
**How to avoid:** Change pool factory to create AlienContainers. Update GameContext.acquirePoolItem() return type. This is a breaking interface change that touches game.ts, states.ts, letters.ts, words.ts.
**Warning signs:** TypeScript errors on pool acquire/release. Entities render without alien sprites.

### Pitfall 5: BootState.enter() Is Currently Synchronous
**What goes wrong:** Adding async asset loading (font + SVGs) to BootState breaks the current synchronous enter() -> transitionTo() flow.
**Why it happens:** GameState.enter() is typed as `void`, not `Promise<void>`. BootState immediately transitions to 'profiles' after installing the font.
**How to avoid:** Either (a) change the enter() signature to allow Promise returns and await in the state machine, or (b) show a loading indicator and transition after assets load via a callback/timer pattern. Option (b) is safer since it doesn't change the GameState interface.
**Warning signs:** Game transitions to profiles before assets are loaded. Missing textures. Font falls back to system font.

### Pitfall 6: Parallax Stars Accumulating Without Cleanup
**What goes wrong:** If star objects are created/destroyed each frame, GC pressure causes micro-stutters.
**Why it happens:** Allocating objects in the game loop triggers garbage collection.
**How to avoid:** Pre-allocate all star objects. Recycle stars that scroll off-screen by repositioning them at the top. This is the same pool pattern used for letter entities.
**Warning signs:** FPS drops every few seconds in a regular pattern (GC pauses).

### Pitfall 7: Container.addChild Order = Z-Order
**What goes wrong:** Background stars render on top of aliens, or UI renders behind game entities.
**Why it happens:** PixiJS renders children in addChild order (first added = bottom).
**How to avoid:** Use explicit z-layers: background container (starfield) -> game entities container -> HUD/UI container. Add them in that order to gameRoot.
**Warning signs:** Visual elements overlap incorrectly.

## Code Examples

### Loading Fredoka and Installing BitmapFont
```typescript
// Source: PixiJS v8 BitmapFont docs + fontsource docs
// In BootState or a preload function:

// 1. Import font CSS (Vite bundles the woff2 files)
import '@fontsource/fredoka/400.css'
import '@fontsource/fredoka/700.css'

// 2. Wait for browser to parse and load the font files
await document.fonts.load('400 80px Fredoka')

// 3. Install BitmapFont with high resolution
BitmapFont.install({
  name: 'GameFont',
  style: {
    fontFamily: 'Fredoka',
    fontSize: 80,
    fill: '#ffffff',
  },
  resolution: 2,
  chars: BitmapFont.ASCII, // generate ASCII range
})
```

### Loading SVG Alien Textures
```typescript
// Source: PixiJS v8 Assets guide, SVG section
import { Assets, Sprite, Texture } from 'pixi.js'

// Load all alien textures at boot
const ALIEN_PATHS = [
  '/assets/aliens/alien-01.svg',
  '/assets/aliens/alien-02.svg',
  // ... 6-8 total
]

// Assets.load returns Texture objects for SVGs
const alienTextures: Texture[] = await Promise.all(
  ALIEN_PATHS.map((path) => Assets.load<Texture>(path))
)

// Use in spawn:
const texture = alienTextures[Math.floor(Math.random() * alienTextures.length)]!
const sprite = new Sprite(texture)
```

### Extending Tween System for New Animation Types
```typescript
// Extend existing LetterTween type in tween.ts
export interface LetterTween {
  elapsed: number
  duration: number
  type: 'hit' | 'miss' | 'bottom' | 'dodge' | 'escape' | 'idle-bob'
}

// New tween types for D-13 (dodge) and D-14 (escape):
export function createDodgeTween(): LetterTween {
  return { elapsed: 0, duration: 400, type: 'dodge' }
}

export function createEscapeTween(): LetterTween {
  return { elapsed: 0, duration: 600, type: 'escape' }
}
```

### Color Theme Constants
```typescript
// src/game/theme.ts
export const SPACE_PALETTE = {
  background: 0x1a1a3e,       // Deep purple/indigo (D-18)
  backgroundLight: 0x2a2a5e,  // Lighter variant for difficulty shift
  accent: 0xe94560,           // Keep existing accent
  glow: 0x6b8bf5,             // Neon blue for UI borders (D-21)
  starDim: 0x555577,          // Far stars
  starBright: 0xffffff,       // Near stars
} as const

// Redesigned 8-color letter palette (D-20)
// Harmonized with deep purple background for contrast
export const LETTER_COLORS = [
  0xff7b7b, // coral red (warmer)
  0x5eedd4, // bright teal
  0xfff07d, // vivid yellow
  0xb89bff, // lavender
  0x77f8ff, // electric cyan
  0xffa24c, // warm orange
  0x96ffbc, // bright mint
  0xffb8e4, // rose pink
] as const

export const LEVEL_TITLES = {
  1: 'Cadet',
  2: 'Apprenti',
  3: 'Pilote',
  5: 'Capitaine',
  8: 'Commandant',
  10: 'Amiral',
} as const
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| BitmapFont from Arial at resolution 1 | BitmapFont from Fredoka at resolution 2 | This phase | Fixes blurriness, matches art style |
| Graphics primitives for avatars | SVG textures loaded via Assets.load() | This phase | Proper character art, scalable pipeline |
| Bare BitmapText as entities | AlienContainer (Sprite + BitmapText) | This phase | Enables alien visual identity, idle animations |
| Graphics circles for celebration particles | ParticleContainer with star-shaped particles | This phase | Better performance, space-themed visuals |
| Flat background (#1a1a2e) | Animated parallax starfield | This phase | Immersive space atmosphere |

## Open Questions

1. **BitmapFont resolution bug in v8**
   - What we know: There is a reported PixiJS v8 bug (#11392) where reinstalling BitmapFont with a resolution option causes incorrect display.
   - What's unclear: Whether this affects our use case (we install once at boot, never reinstall).
   - Recommendation: Install once at boot with resolution:2. If buggy, try `Math.ceil(window.devicePixelRatio)` instead. Test early in Wave 0.

2. **SVG complexity threshold**
   - What we know: PixiJS SVG-as-texture works well for simple SVGs. Text elements and filters are unsupported.
   - What's unclear: Exact complexity ceiling before performance degrades. Depends on SVG path count and viewBox size.
   - Recommendation: Keep aliens under 2KB SVG each, 64x64 to 128x128 viewBox. Test first alien early and measure load time.

3. **BootState async transition**
   - What we know: Current BootState.enter() is synchronous. Asset loading needs to be async.
   - What's unclear: Whether changing enter() to return a Promise will break the state machine.
   - Recommendation: Keep enter() synchronous. Start asset loading, show a loading indicator, and transition after the promise resolves using a pattern like `Assets.load(...).then(() => ctx.transitionTo('profiles'))`.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | vite.config.ts (inline test config) |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AV-01 (theme constants) | Color palette and level titles exported correctly | unit | `pnpm vitest run tests/game/theme.test.ts -x` | Wave 0 |
| AV-01 (alien container) | AlienContainer creates sprite + text children | unit | `pnpm vitest run tests/game/alien-container.test.ts -x` | Wave 0 |
| AV-01 (starfield) | Starfield creates parallax layers, update moves stars | unit | `pnpm vitest run tests/game/starfield.test.ts -x` | Wave 0 |
| AV-01 (effects) | Destruction burst creates particles at correct position | unit | `pnpm vitest run tests/game/effects.test.ts -x` | Wave 0 |
| AV-01 (avatar SVG) | Updated avatar definitions have svgPath field | unit | `pnpm vitest run tests/game/avatar-definitions.test.ts -x` | Wave 0 |
| AV-01 (tween extensions) | New tween types (dodge, escape) produce correct animations | unit | `pnpm vitest run tests/game/tween.test.ts -x` | Exists (extend) |
| AV-01 (60fps) | Performance under 4x CPU throttle | manual-only | Chrome DevTools Performance tab, CPU 4x slowdown | N/A |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green + manual 60fps validation before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/game/theme.test.ts` -- covers theme constants, color palette, level titles
- [ ] `tests/game/alien-container.test.ts` -- covers AlienContainer composition
- [ ] `tests/game/starfield.test.ts` -- covers Starfield parallax layers
- [ ] `tests/game/effects.test.ts` -- covers DestructionEffect particle burst
- [ ] `tests/game/avatar-definitions.test.ts` -- covers updated AvatarDefinition with SVG paths
- [ ] Extend `tests/game/tween.test.ts` -- covers new dodge/escape tween types

## Sources

### Primary (HIGH confidence)
- [PixiJS v8 SVG Guide](https://pixijs.com/8.x/guides/components/assets/svg) - SVG loading methods, texture vs graphics, resolution control
- [PixiJS v8 ParticleContainer](https://pixijs.com/8.x/guides/components/scene-objects/particle-container) - Particle API, dynamic properties, performance characteristics
- [PixiJS v8 Assets Guide](https://pixijs.com/8.x/guides/components/assets) - Assets.load() API, font loading, caching
- [PixiJS BitmapFont API](https://pixijs.download/v8.10.0/docs/text.BitmapFont.html) - BitmapFont.install() options including resolution
- [Fontsource Fredoka](https://fontsource.org/fonts/fredoka) - npm package, CSS import usage
- [@fontsource/fredoka npm](https://www.npmjs.com/package/@fontsource/fredoka) - Version 5.2.10 verified
- Existing codebase: `src/game/states.ts`, `src/game/tween.ts`, `src/game/pool.ts`, `src/game/celebration.ts`, `src/avatars/`

### Secondary (MEDIUM confidence)
- [PixiJS BitmapFont resolution bug #11392](https://github.com/pixijs/pixijs/issues/11392) - Known issue with reinstalling BitmapFont with resolution option
- [PixiJS blurry discussion #8507](https://github.com/pixijs/pixijs/discussions/8507) - HiDPI resolution fix patterns
- [PixiJS v8.12.0 changelog](https://pixijs.com/blog/8.12.0) - Parser naming changes (loadWebFont -> web-font)

### Tertiary (LOW confidence)
- GSAP version 3.14.2 verified via npm registry (not recommending use, just confirming availability if needed)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PixiJS v8.17.1 already installed, @fontsource/fredoka well-documented
- Architecture: HIGH - Patterns derived from PixiJS official guides and existing codebase patterns
- Pitfalls: HIGH - BitmapFont resolution and async loading are well-documented issues
- SVG complexity limits: MEDIUM - depends on specific alien designs, need empirical testing

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable; PixiJS v8 API is mature)
