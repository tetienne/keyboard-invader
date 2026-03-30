# Phase 3: Letter Mode Gameplay - Research

**Researched:** 2026-03-30
**Domain:** PixiJS BitmapText gameplay, input matching, simple animations, state machine extension
**Confidence:** HIGH

## Summary

Phase 3 transforms the Phase 2 placeholder rectangles into actual letter-matching gameplay. The existing codebase provides a solid foundation: PlayingState already has spawn/fall/destroy logic, ObjectPool handles entity recycling, and InputManager buffers keydown events normalized to lowercase. The primary work is (1) switching from Graphics rectangles to BitmapText letters with color tinting, (2) implementing key-to-letter matching instead of "any key destroys lowest", (3) adding visual feedback animations (scale/tint/alpha tweens), (4) adding a score counter HUD, (5) adding a results/gameover state, and (6) extending the state machine transitions.

PixiJS v8 BitmapText inherits `tint`, `alpha`, `scale`, and `visible` from Container, making per-letter color and animation straightforward. The existing BitmapFont 'GameFont' installed in BootState needs to be reinstalled with white fill for tinting to work correctly. Animations can be done with simple per-frame interpolation in the update loop -- no external tween library is needed for the 3 simple effects required (scale-up+fade, shake, fade-out).

**Primary recommendation:** Refactor PlayingState to use BitmapText pooling with tint-based coloring, implement letter-specific key matching against the lowest matching letter, and add lightweight inline tweening for feedback effects. Add GameOverState for the results screen.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Each falling letter is a BitmapText entity using the existing GameFont installed in BootState
- **D-02:** Letters are large (~80px) for visibility by young children
- **D-03:** Letters use a cycling kid-friendly color palette (bright, distinct colors) -- each letter gets a random color from the palette on spawn
- **D-04:** Letters start from the home row (ASDF JKL;) and gradually introduce more letters as the session progresses (row by row: home -> top -> bottom)
- **D-05:** Fixed gentle difficulty for Phase 3 -- constant fall speed, constant spawn rate. Adaptive difficulty is Phase 5
- **D-06:** ASCII-only letters (a-z) -- no accented characters in Phase 3
- **D-07:** Correct hit: letter scales up briefly + flashes green + fades out
- **D-08:** Wrong key: gentle red flash on the targeted letter + small horizontal shake. No punishment sound, no scary effect
- **D-09:** Letter reaching bottom: letter fades out silently -- no game over, no life lost
- **D-10:** Simple hit counter displayed at top-right of screen, increments per correct hit
- **D-11:** Fixed letter count per session (e.g., 20 letters), then automatic transition to results screen
- **D-12:** Results screen shows hits, misses, and accuracy percentage -- brief and encouraging. Provides a "Rejouer" button
- **D-13:** Each falling letter has an assigned key (the letter itself). Only that key destroys it
- **D-14:** When multiple letters are on screen, the keypress matches the lowest (closest to bottom) letter with that character. If no matching letter exists, it's a miss
- **D-15:** Input matching uses the existing InputManager buffer (Phase 2 D-09), processing all buffered keys per tick
- **D-16:** Add a 'gameover' state to StateName and TRANSITIONS for the results screen. Transition: playing -> gameover, gameover -> menu or gameover -> playing (replay)
- **D-17:** The existing PlayingState is refactored to use letter entities instead of placeholder rectangles

### Claude's Discretion
- Exact color palette values for letters
- Specific animation timing/easing for hit/miss effects
- Results screen layout and styling details
- Letter spawn position randomization (across full width or lanes)
- Exact session letter count (20 is suggested but can be adjusted)

### Deferred Ideas (OUT OF SCOPE)
- Accented character support (dead-key handling) -- word mode / future phase
- Sound effects on hit/miss -- Phase 9
- Particle effects on letter destruction -- Phase 8
- Adaptive difficulty -- Phase 5
- Streak counter or combo system -- Phase 7+
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-02 | L'enfant en mode lettres (pre-lecteur) voit des lettres individuelles avec gros visuels | BitmapText at ~80px with tint-based coloring; kid-friendly palette; home row start (D-01 through D-04) |
| GAME-04 | L'enfant recoit un feedback visuel immediat a chaque frappe (correct ou incorrect) | Inline tween system for scale+green flash+fade (correct) and red tint+shake (incorrect); PixiJS Container tint/alpha/scale properties (D-07, D-08) |
| GAME-05 | L'enfant voit son score affiche pendant la partie | BitmapText HUD element at top-right, incremented on correct hit (D-10) |
| GAME-01 | L'enfant voit des lettres/mots tomber du haut de l'ecran et tape pour les eliminer | Already partially complete from Phase 2 (falling entities). Phase 3 replaces rectangles with letter BitmapText, adds key matching (D-13, D-14, D-17) |
</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PixiJS | 8.17.1 | BitmapText rendering, Container tint/alpha/scale | Already installed, BitmapText supports dynamic tinting via fill style |
| TypeScript | 6.0.2 | Type safety for letter entities, state types | Already installed |
| Vitest | 4.1.2 | Unit testing new gameplay logic | Already installed |

### No New Dependencies
This phase requires zero new npm packages. All animations are simple enough to implement with per-frame interpolation in the game loop. GSAP is not needed for 3 basic tweens (scale+fade, shake, fade-out).

## Architecture Patterns

### Recommended File Structure
```
src/game/
  types.ts          # Add StateName 'gameover', update TRANSITIONS, add LetterEntity type
  states.ts         # Refactor PlayingState, add GameOverState
  game.ts           # Update pool factory from Graphics to BitmapText, add 'gameover' to StateMachine
  input.ts          # No changes needed
  pool.ts           # No changes needed (generic)
  canvas.ts         # No changes needed
  loop.ts           # No changes needed
  index.ts          # Export new GameOverState
  letters.ts        # NEW: letter selection, color palette, letter pool configuration
  tween.ts          # NEW: lightweight inline tween system for animations
```

### Pattern 1: LetterEntity Type
**What:** A typed interface for active falling letters, extending the pool pattern.
**When to use:** Every letter on screen needs position, assigned character, color, and animation state.
**Example:**
```typescript
// Source: project codebase analysis
interface LetterEntity {
  readonly text: BitmapText    // The PixiJS display object
  readonly poolIndex: number   // For releasing back to ObjectPool
  letter: string               // The character ('a', 's', 'd', etc.)
  // Animation state
  tween: LetterTween | null    // Active animation (hit/miss/bottom)
}
```

### Pattern 2: BitmapFont with White Fill for Tinting
**What:** Install GameFont with white fill so that `tint` property produces correct colors.
**When to use:** BootState font installation must change to enable per-letter coloring.
**Example:**
```typescript
// Source: PixiJS v8 docs - BitmapFont tinting pattern
BitmapFont.install({
  name: 'GameFont',
  style: {
    fontFamily: 'Arial',
    fontSize: 80,        // D-02: large for kids
    fill: 0xffffff,      // White base -- REQUIRED for tint to work correctly
  },
})

// Then each letter uses tint for color:
const letter = new BitmapText({
  text: 'A',
  style: { fontFamily: 'GameFont', fontSize: 80 },
})
letter.tint = 0xff6b6b  // Red from kid-friendly palette
```

### Pattern 3: Inline Tween System (No External Library)
**What:** A minimal tween data structure processed in the update loop.
**When to use:** For the 3 animation effects needed: hit (scale+green+fade), miss (red+shake), bottom (fade).
**Example:**
```typescript
// Source: standard game dev pattern
interface Tween {
  elapsed: number
  duration: number
  type: 'hit' | 'miss' | 'bottom'
}

function updateTween(entity: LetterEntity, dt: number): boolean {
  if (!entity.tween) return false
  entity.tween.elapsed += dt
  const t = Math.min(entity.tween.elapsed / entity.tween.duration, 1)

  switch (entity.tween.type) {
    case 'hit':
      // Scale up 1.0 -> 1.3, tint green, alpha 1.0 -> 0.0
      entity.text.scale.set(1 + 0.3 * t)
      entity.text.tint = 0x4ade80  // green
      entity.text.alpha = 1 - t
      break
    case 'miss':
      // Red flash + horizontal shake (sine wobble)
      entity.text.tint = 0xef4444  // red
      entity.text.x += Math.sin(t * Math.PI * 6) * 3 * (1 - t) // dampened shake
      break
    case 'bottom':
      // Simple fade out
      entity.text.alpha = 1 - t
      break
  }
  return t >= 1  // true = complete, remove entity
}
```

### Pattern 4: Key Matching -- Lowest Letter Priority
**What:** When a key is pressed, find the lowest on-screen letter matching that character.
**When to use:** Every frame when processing input buffer.
**Example:**
```typescript
// Source: CONTEXT.md D-14
function findLowestMatch(active: LetterEntity[], key: string): LetterEntity | null {
  let best: LetterEntity | null = null
  for (const entity of active) {
    if (entity.letter === key && entity.tween === null) {
      if (!best || entity.text.y > best.text.y) {
        best = entity
      }
    }
  }
  return best
}
```

### Pattern 5: Letter Selection by Row Progression
**What:** Start with home row keys and gradually add rows as the session progresses.
**When to use:** Letter spawning logic.
**Example:**
```typescript
// Source: CONTEXT.md D-04
const HOME_ROW = ['a', 's', 'd', 'f', 'j', 'k', 'l']
const TOP_ROW = ['q', 'w', 'e', 'r', 'u', 'i', 'o', 'p']
const BOTTOM_ROW = ['z', 'x', 'c', 'v', 'b', 'n', 'm']

function getAvailableLetters(progress: number, total: number): string[] {
  const ratio = progress / total
  if (ratio < 0.4) return HOME_ROW
  if (ratio < 0.7) return [...HOME_ROW, ...TOP_ROW]
  return [...HOME_ROW, ...TOP_ROW, ...BOTTOM_ROW]
}
```

### Pattern 6: ObjectPool with BitmapText
**What:** Replace the Graphics pool factory with a BitmapText factory.
**When to use:** Game class constructor.
**Example:**
```typescript
// Current (Phase 2):
const rectContext = new GraphicsContext().rect(0, 0, 40, 40).fill(0xe94560)
this._pool = new ObjectPool(() => new Graphics(rectContext), 20)

// Phase 3 replacement:
this._pool = new ObjectPool(() => {
  const bt = new BitmapText({
    text: 'A',
    style: { fontFamily: 'GameFont', fontSize: 80 },
  })
  bt.anchor?.set(0.5)  // Center anchor for scale animations
  bt.visible = false
  return bt
}, 20)
```

**Important:** The `GameContext` interface currently types pool items as `unknown`. This is intentional (Phase 2 decision) and works well -- PlayingState casts to the concrete type. The pool factory change in Game class is transparent to the interface.

### Anti-Patterns to Avoid
- **Creating/destroying BitmapText per letter:** Use the pool. Creating PixiJS objects is expensive. Reconfigure pooled instances by changing `.text` and `.tint`.
- **Using Canvas Text instead of BitmapText:** BitmapText is pre-rendered to texture, much faster for dynamic text that changes often.
- **Animating with setTimeout/setInterval:** Use the game loop dt for all animations. External timers desync from the game tick.
- **Using GSAP for 3 simple tweens:** Adds 25KB+ for effects achievable with 30 lines of code in the update loop.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text rendering | Custom canvas text drawing | PixiJS BitmapText | Pre-rendered glyphs, GPU-batched, handles scaling |
| Object recycling | Manual create/destroy cycle | Existing ObjectPool<T> | Already built, tested, handles grow-on-demand |
| Input buffering | Custom keyboard handler | Existing InputManager | Already handles AZERTY, repeat filtering, modifier filtering |
| State transitions | Manual if/else state tracking | Existing StateMachine | Already validates transitions, handles enter/exit lifecycle |

**Key insight:** Phase 2 built all the infrastructure. Phase 3 is about gameplay logic on top of it, not new infrastructure.

## Common Pitfalls

### Pitfall 1: BitmapFont Tint Requires White Base Fill
**What goes wrong:** Letters appear as the original fill color and tint has no visible effect, or colors look muddy.
**Why it happens:** PixiJS tint multiplies with the texture color. If the font is installed with a non-white fill (e.g., the current `#ffffff` string in BootState -- which is actually fine), tinting works. But if it were installed with a colored fill, tint would multiply against that color.
**How to avoid:** Ensure BitmapFont.install uses `fill: 0xffffff` (white). The current BootState uses `fill: '#ffffff'` which is equivalent and correct. Then apply color via `bitmapText.tint = desiredColor`.
**Warning signs:** All letters appear the same color regardless of tint value.

### Pitfall 2: Pool Item State Not Reset on Reuse
**What goes wrong:** A letter acquired from the pool retains the previous letter's scale, alpha, tint, or position from its last animation.
**Why it happens:** ObjectPool.release() only marks the slot as available. It does not reset the display object properties.
**How to avoid:** On acquire, always reset: `text.scale.set(1)`, `text.alpha = 1`, `text.tint = newColor`, `text.x = spawnX`, `text.y = -80`, `text.visible = true`, `text.text = newLetter`. Create a `resetLetterEntity()` helper.
**Warning signs:** Letters appearing mid-screen, or with transparency, or at wrong scale.

### Pitfall 3: Tween Completion Race with Pool Release
**What goes wrong:** A letter's hit animation finishes and the entity is released to the pool, but it's still in the gameRoot or the activeItems array is corrupted.
**Why it happens:** If release logic is split between the tween completion callback and the main update loop, ordering bugs appear.
**How to avoid:** Handle all entity removal in a single pass at the end of update(). Tweens just mark entities for removal; the main loop does the actual cleanup.
**Warning signs:** Ghost letters on screen, pool count mismatches, entities double-released.

### Pitfall 4: StateName Type Union Update Forgotten
**What goes wrong:** Adding 'gameover' to StateName but forgetting to update TRANSITIONS, or forgetting to register the new state in Game class constructor.
**Why it happens:** Multiple files reference StateName: types.ts, states.ts, game.ts, index.ts, tests.
**How to avoid:** TypeScript will catch missing cases in the `Record<StateName, ...>` types -- the TRANSITIONS record and the StateMachine constructor states record will both error if 'gameover' is missing. Follow the compiler errors.
**Warning signs:** TypeScript compile errors about missing keys in Record types.

### Pitfall 5: Miss Detection Ambiguity
**What goes wrong:** A keypress that matches no on-screen letter is supposed to be a "miss" (D-08), but the code needs to decide which letter gets the red flash/shake.
**Why it happens:** D-08 says "red flash on the targeted letter" but there's no targeted letter if the key doesn't match anything.
**How to avoid:** Clarify: if a keypress matches no on-screen letter, it's simply a global miss (increment miss counter only, no visual on any specific letter). The red flash + shake only applies when there IS a matching letter but the player presses the wrong key (i.e., there's a letter on screen and they press something else). Actually re-reading D-08 more carefully: "Wrong key: gentle red flash on the targeted letter" -- this likely means when the player presses a key that doesn't match the lowest letter they're "targeting." A simpler interpretation: flash the lowest overall letter briefly red when the pressed key doesn't match it. This is Claude's discretion for exact behavior.
**Warning signs:** Confusing UX where nothing happens on wrong press, or wrong letter flashes.

### Pitfall 6: BitmapText anchor Property
**What goes wrong:** Scale animations scale from top-left corner instead of center, making letters fly off to one side.
**Why it happens:** PixiJS default anchor is (0, 0) -- top-left.
**How to avoid:** Set `bitmapText.anchor.set(0.5)` for center-origin scaling. Account for this in positioning (x becomes center instead of left edge).
**Warning signs:** Letters visually jumping or scaling asymmetrically.

## Code Examples

### Complete Letter Spawn Flow
```typescript
// Source: project codebase analysis + PixiJS v8 API
const LETTER_COLORS = [
  0xff6b6b, // red
  0x4ecdc4, // teal
  0xffe66d, // yellow
  0xa78bfa, // purple
  0x67e8f9, // cyan
  0xfb923c, // orange
  0x86efac, // green
  0xf9a8d4, // pink
] as const

function spawnLetter(
  ctx: GameContext,
  pool: ObjectPool<BitmapText>,
  letter: string,
  activeEntities: LetterEntity[],
): void {
  const { item: bt, index } = pool.acquire()

  // Reset all properties (Pitfall 2)
  bt.text = letter.toUpperCase()  // Display uppercase for kids
  bt.tint = LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)]!
  bt.scale.set(1)
  bt.alpha = 1
  bt.anchor.set(0.5)
  bt.x = 80 + Math.random() * (BASE_WIDTH - 160)  // Margin from edges
  bt.y = -40
  bt.visible = true

  ctx.gameRoot.addChild(bt)
  activeEntities.push({
    text: bt,
    poolIndex: index,
    letter: letter,
    tween: null,
  })
}
```

### Complete Input Processing Flow
```typescript
// Source: CONTEXT.md D-13, D-14, D-15
function processInput(
  keys: string[],
  active: LetterEntity[],
  stats: { hits: number; misses: number },
): void {
  for (const key of keys) {
    // Find lowest matching letter (D-14)
    const match = findLowestMatch(active, key)
    if (match) {
      // Correct hit (D-07)
      match.tween = { elapsed: 0, duration: 300, type: 'hit' }
      stats.hits++
    } else {
      // No matching letter on screen -- miss
      stats.misses++
      // Optional: flash the lowest overall letter red (D-08)
      const lowest = findLowestEntity(active)
      if (lowest && lowest.tween === null) {
        lowest.tween = { elapsed: 0, duration: 200, type: 'miss' }
      }
    }
  }
}
```

### Results Screen Pattern
```typescript
// Source: CONTEXT.md D-12
export class GameOverState implements GameState {
  private container: Container | null = null

  enter(ctx: GameContext): void {
    this.container = new Container()

    // Title
    const title = new BitmapText({
      text: 'Bravo !',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    title.x = BASE_WIDTH / 2 - title.width / 2
    title.y = BASE_HEIGHT * 0.2

    // Stats: hits, misses, accuracy
    // ... BitmapText elements for each stat

    // "Rejouer" button (same pattern as MenuState "Jouer" button)
    const replayBtn = new BitmapText({
      text: 'Rejouer',
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    replayBtn.eventMode = 'static'
    replayBtn.cursor = 'pointer'
    replayBtn.on('pointertap', () => ctx.transitionTo('playing'))

    // ... addChild all elements
    ctx.gameRoot.addChild(this.container)
  }

  exit(ctx: GameContext): void {
    if (this.container) {
      ctx.gameRoot.removeChild(this.container)
      this.container.destroy({ children: true })
      this.container = null
    }
  }

  update(): void { /* static screen */ }
  render(): void { /* no-op */ }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Graphics rectangles (Phase 2 placeholder) | BitmapText letters (Phase 3) | Now | Real gameplay vs demo |
| Any-key destroys lowest entity | Specific key matches specific letter | Now | Actual typing practice |
| Session ends -> menu | Session ends -> results screen | Now | Feedback loop for learning |

## Open Questions

1. **Miss visual feedback target**
   - What we know: D-08 says "red flash on the targeted letter" + shake
   - What's unclear: When no letter matches the pressed key, which letter (if any) gets the red flash?
   - Recommendation: Flash the lowest overall letter (the one the child is most likely "aiming at"). If no letters on screen, do nothing visual. This is within Claude's discretion.

2. **Session data passing to GameOverState**
   - What we know: GameOverState needs hits, misses, accuracy from PlayingState
   - What's unclear: How to pass data between states (GameContext has no mechanism for this)
   - Recommendation: Add a simple `sessionData` property to GameContext (or use a module-level variable). Simplest approach: add `setSessionResult(data)` and `getSessionResult()` to GameContext interface.

3. **Pool type change: Graphics -> BitmapText**
   - What we know: Game class currently creates `ObjectPool<Graphics>`. GameContext types pool items as `unknown`.
   - What's unclear: Whether to change the pool type in Game to `ObjectPool<BitmapText>` or keep it flexible
   - Recommendation: Change to `ObjectPool<BitmapText>` in Game class. The `unknown` typing in GameContext already decouples the interface. PlayingState will cast as `BitmapText` instead of `Graphics`.

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
| GAME-02 | Letters spawn as BitmapText with large size and colors | unit | `pnpm vitest run tests/game/states.test.ts -t "PlayingState"` | Exists (needs update) |
| GAME-04 | Correct key triggers hit animation, wrong key triggers miss animation | unit | `pnpm vitest run tests/game/tween.test.ts` | Wave 0 |
| GAME-04 | Key matching finds lowest matching letter | unit | `pnpm vitest run tests/game/letters.test.ts` | Wave 0 |
| GAME-05 | Score counter increments on hit | unit | `pnpm vitest run tests/game/states.test.ts -t "score"` | Wave 0 |
| GAME-01 | Letters fall and can be destroyed by matching key | unit | `pnpm vitest run tests/game/states.test.ts -t "PlayingState"` | Exists (needs update) |
| D-16 | GameOverState renders results and allows replay | unit | `pnpm vitest run tests/game/states.test.ts -t "GameOverState"` | Wave 0 |
| D-16 | StateName includes 'gameover', transitions are valid | unit | `pnpm vitest run tests/game/states.test.ts -t "StateMachine"` | Exists (needs update) |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test && pnpm typecheck && pnpm lint`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `tests/game/tween.test.ts` -- covers tween update logic (hit/miss/bottom animations)
- [ ] `tests/game/letters.test.ts` -- covers letter selection, findLowestMatch, color palette
- [ ] Update `tests/game/states.test.ts` -- add GameOverState tests, update PlayingState tests for letter entities, add score tracking tests
- [ ] Update `tests/game/states.test.ts` mock -- add BitmapText anchor mock to vi.mock('pixi.js')

## Sources

### Primary (HIGH confidence)
- PixiJS 8.17.1 installed source (`node_modules/pixi.js/lib/scene/text-bitmap/BitmapText.d.ts`) -- BitmapText API, inherits tint/alpha/scale from Container
- PixiJS 8.17.1 installed source (`node_modules/pixi.js/lib/scene/container/Container.d.ts`) -- Container tint, alpha, scale, visible properties
- Project codebase: `src/game/states.ts`, `src/game/types.ts`, `src/game/game.ts`, `src/game/pool.ts`, `src/game/input.ts` -- existing patterns

### Secondary (MEDIUM confidence)
- [PixiJS BitmapText docs](https://pixijs.download/dev/docs/scene.BitmapText.html) -- BitmapText constructor, rendering modes
- [PixiJS BitmapFont install docs](https://pixijs.download/dev/docs/text.BitmapFontInstallOptions.html) -- White fill + tint pattern
- [PixiJS v8 BitmapFont tinting issue](https://github.com/pixijs/pixijs/issues/10912) -- Confirms dynamic font fill/tint interaction

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all APIs verified in installed PixiJS source
- Architecture: HIGH - patterns follow directly from existing Phase 2 code
- Pitfalls: HIGH - verified against PixiJS type definitions and existing codebase patterns

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (stable -- PixiJS 8.17.x is mature, no breaking changes expected)
