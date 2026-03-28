# Architecture Patterns

**Domain:** Browser-based typing game for children (typing invaders)
**Researched:** 2026-03-28

## Recommended Architecture

A **component-based game architecture** with a fixed-timestep game loop, canvas rendering, and event-driven input. The game is purely client-side (static hosting) with optional Firebase for cloud persistence.

The architecture separates **simulation** (game state updates at fixed rate) from **rendering** (visual output at display refresh rate). This is standard for browser games and critical here because falling-word physics must be deterministic regardless of device frame rate -- a child's low-end laptop must behave identically to a fast desktop.

### System Overview

```
[Keyboard Events] --> [Input Manager] --> [Game State]
                                              |
                                    [Game Loop (fixed timestep)]
                                       /           \
                              [Update]              [Render]
                                 |                     |
                      [Word Manager]           [Canvas Renderer]
                      [Difficulty Engine]       [UI Overlay (DOM)]
                      [Score/XP System]         [Audio Manager]
                      [Collision Detector]
                                 |
                          [State Manager]
                                 |
                    [Persistence Layer (LocalStorage / Firebase)]
```

### Component Boundaries

| Component | Responsibility | Communicates With | Build Phase |
|-----------|---------------|-------------------|-------------|
| **Game Loop** | Fixed-timestep update/render cycle via requestAnimationFrame | All systems (orchestrates) | 1 (foundation) |
| **Input Manager** | Captures keyboard events, normalizes to action map | Game Loop, Game State | 1 (foundation) |
| **Word Manager** | Spawns words/letters, tracks active entities, removes matched | Difficulty Engine, Renderer, Input Manager | 2 (core gameplay) |
| **Collision Detector** | Matches typed input against active words, triggers destruction | Word Manager, Score System, Audio | 2 (core gameplay) |
| **Difficulty Engine** | Adjusts spawn rate, speed, word length, complexity over time | Word Manager, Player Profile | 3 (progression) |
| **Score/XP System** | Tracks points, XP, level-ups, streaks | Game State, Difficulty Engine, UI | 3 (progression) |
| **Canvas Renderer** | Draws falling words, background, effects, animations | Game State (read-only) | 1 (foundation) |
| **UI Overlay (DOM)** | Menus, profile selection, HUD (score, level, XP bar) | State Manager, Game Loop | 2 (UI) |
| **Audio Manager** | Web Audio API for SFX, HTMLAudioElement for music | Game events (pub/sub) | 4 (polish) |
| **State Manager** | Central game state, mode transitions (menu/play/pause/gameover) | All systems | 1 (foundation) |
| **Persistence Layer** | Save/load profiles, scores, unlocks to LocalStorage or Firebase | State Manager | 3 (persistence) |
| **i18n Module** | Word lists per language, UI string translations | Word Manager, UI Overlay | 2 (content) |

## Data Flow

### Frame-by-Frame Flow (during gameplay)

```
1. requestAnimationFrame fires
2. Calculate delta time, accumulate into timestep buffer
3. While accumulated time >= FIXED_STEP (e.g., 50ms = 20Hz):
   a. Input Manager: flush queued keystrokes into action buffer
   b. Collision Detector: match buffered input against active words
      - On hit: emit "word-hit" event (letter matched or word destroyed)
      - On miss: emit "key-miss" event
   c. Word Manager: advance positions (y += speed * FIXED_STEP)
      - Check for words reaching bottom -> emit "word-escaped"
      - Spawn new words per Difficulty Engine rules
   d. Difficulty Engine: evaluate player metrics, adjust parameters
   e. Score System: process events, update XP/level
   f. State Manager: check win/lose conditions
4. Render pass:
   a. Clear canvas
   b. Draw background / scene
   c. Draw active words at interpolated positions
   d. Draw effects (explosions, particles)
   e. Update DOM HUD (score, XP bar, level)
5. Audio Manager: play queued sounds from events
```

### Input Flow (keyboard to action)

```
keydown event
  --> Input Manager captures key, adds to frame buffer
  --> Prevents default (no browser shortcuts interfering)
  --> On next update tick:
      Buffer is consumed by Collision Detector
      Detector walks active words to find match
      Best match: leftmost/lowest word starting with typed sequence
```

**Key design decision:** Input is buffered and processed on the update tick, not immediately on keydown. This prevents frame-rate-dependent input handling and ensures determinism. For a typing game at 20Hz update rate this is imperceptible (50ms max latency) and children will not notice.

### State Transitions

```
BOOT --> PROFILE_SELECT --> MODE_SELECT --> PLAYING --> GAME_OVER
                                              |            |
                                           PAUSED      PROFILE_SELECT
                                              |
                                           PLAYING
```

Each state owns:
- Which components are active
- What renders on screen
- What input is accepted

Use a **finite state machine** (simple switch/map, no library needed). States are exclusive -- only one active at a time.

## Patterns to Follow

### Pattern 1: Fixed-Timestep Game Loop

**What:** Decouple simulation from rendering. Update game logic at a fixed rate (20Hz is plenty for falling words), render at display refresh rate with interpolation.

**Why:** Deterministic behavior across devices. A word falls at the same speed whether the screen refreshes at 60Hz or 144Hz. MDN recommends this as best practice for any game with physics (source: [MDN Game Anatomy](https://developer.mozilla.org/en-US/docs/Games/Anatomy)).

**Confidence:** HIGH (MDN, multiple game dev references)

**Example:**
```typescript
const TICK_RATE = 20; // 20 updates per second
const TICK_MS = 1000 / TICK_RATE;
let lastTick = performance.now();
let accumulator = 0;

function gameLoop(timestamp: number) {
  requestAnimationFrame(gameLoop);

  const delta = Math.min(timestamp - lastTick, 1000); // clamp to 1s
  lastTick = timestamp;
  accumulator += delta;

  while (accumulator >= TICK_MS) {
    update(TICK_MS);
    accumulator -= TICK_MS;
  }

  const alpha = accumulator / TICK_MS;
  render(alpha); // interpolation factor for smooth visuals
}
```

### Pattern 2: Event Bus for Cross-System Communication

**What:** Components communicate via typed events rather than direct references. The Collision Detector does not call the Audio Manager directly -- it emits `"word-destroyed"` and Audio subscribes.

**Why:** Keeps components decoupled. Adding particles, screen shake, or analytics later requires zero changes to existing systems -- just subscribe to existing events.

**Example:**
```typescript
type GameEvent =
  | { type: "letter-hit"; letter: string; wordId: string }
  | { type: "word-destroyed"; word: string; points: number }
  | { type: "word-escaped"; word: string }
  | { type: "key-miss"; key: string }
  | { type: "level-up"; newLevel: number };

class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on(type: string, callback: Function) { /* ... */ }
  off(type: string, callback: Function) { /* ... */ }
  emit(event: GameEvent) { /* ... */ }
}
```

### Pattern 3: Entity Pool for Word Management

**What:** Pre-allocate a pool of word entities. When a word is destroyed or escapes, return it to the pool. When spawning, take from pool instead of creating new objects.

**Why:** Avoids garbage collection spikes during gameplay. Falling words are created and destroyed frequently -- GC pauses cause visible stutters on low-end machines (children's laptops).

**Example:**
```typescript
class WordPool {
  private available: WordEntity[] = [];
  private active: WordEntity[] = [];

  spawn(text: string, x: number, speed: number): WordEntity {
    const entity = this.available.pop() || new WordEntity();
    entity.reset(text, x, speed);
    this.active.push(entity);
    return entity;
  }

  release(entity: WordEntity) {
    const idx = this.active.indexOf(entity);
    if (idx >= 0) this.active.splice(idx, 1);
    this.available.push(entity);
  }
}
```

### Pattern 4: Canvas for Game, DOM for UI

**What:** Render the game scene (falling words, background, effects) on a Canvas element. Render menus, HUD, and overlays as DOM elements positioned over the canvas.

**Why:** Canvas gives pixel-perfect control and performance for the game scene. DOM gives accessibility, easy styling, and i18n support for UI. Mixing them is the standard approach for HTML5 games.

**Confidence:** HIGH (universal pattern in browser games)

## Anti-Patterns to Avoid

### Anti-Pattern 1: DOM-Based Falling Words

**What:** Using absolutely-positioned DOM elements for each falling word.

**Why bad:** DOM layout thrashing with dozens of moving elements causes jank. Each word position change triggers layout recalculation. Canvas batch-renders all words in a single draw call.

**Instead:** Render words on Canvas. Use `ctx.fillText()` for text rendering -- it handles fonts, colors, and positioning efficiently.

### Anti-Pattern 2: Immediate Input Processing

**What:** Processing keyboard input in the keydown handler itself (checking words, updating score, playing sounds).

**Why bad:** Input handlers run on the browser's event loop, not synchronized with the game loop. Causes race conditions with game state and inconsistent behavior at different frame rates.

**Instead:** Buffer input events, process them in the update tick.

### Anti-Pattern 3: Monolithic Game Object

**What:** One big `Game` class that handles input, rendering, word management, scoring, audio, and persistence.

**Why bad:** Becomes unmaintainable after 500 lines. Cannot test individual systems. Adding features requires touching everything.

**Instead:** Separate systems with clear interfaces, coordinated by the game loop and event bus.

### Anti-Pattern 4: Variable-Timestep Physics

**What:** Moving words by `speed * deltaTime` where deltaTime varies per frame.

**Why bad:** Floating-point accumulation errors cause words to drift at different rates on different machines. A word that should take exactly 5 seconds to fall might take 4.8s or 5.3s depending on frame rate fluctuations.

**Instead:** Fixed-timestep update with render interpolation. Words always take the exact same time to fall.

## Rendering Strategy

### Canvas 2D (Recommended over WebGL)

For this game, Canvas 2D is the right choice:

- **Text rendering** is a first-class citizen in Canvas 2D (`fillText`, `measureText`)
- **SVG-style visuals** can be drawn with Path2D or pre-rendered to offscreen canvases
- **WebGL is overkill** -- this game has no 3D, no complex shaders, no massive particle systems
- **Browser support** is universal; Canvas 2D works everywhere including old tablets

**Confidence:** HIGH

### Layered Canvas Approach

Use multiple stacked canvas elements for rendering optimization:

```
[Canvas: Background]   -- Static or slow-scrolling, redrawn rarely
[Canvas: Game Scene]   -- Falling words, updated every frame
[Canvas: Effects]      -- Particles, explosions, cleared frequently
[DOM: HUD Overlay]     -- Score, XP bar, level indicator
```

This avoids redrawing the background every frame. For a children's game on modest hardware, this optimization matters.

## Audio Architecture

### Hybrid Approach (Web Audio API + HTMLAudioElement)

| Audio Type | Technology | Why |
|------------|-----------|-----|
| SFX (key hit, word destroyed, miss) | Web Audio API | Low latency (<10ms), can overlap, pitch variation |
| Background music | HTMLAudioElement | Streaming, memory efficient, simple loop control |
| Celebration sounds (level up, unlock) | Web Audio API | Need to play instantly on event |

**Critical constraint:** Browsers require a user gesture before playing audio. The profile selection screen click serves as this gesture -- initialize AudioContext on that first interaction.

**Confidence:** HIGH (MDN Web Audio API docs)

### Sound Pool Pattern

Pre-decode audio buffers at load time. Keep a pool of AudioBufferSourceNodes for frequently played sounds (key hits happen multiple times per second).

## Difficulty Engine Architecture

The difficulty engine is the most important differentiator. It must handle two radically different players: a 5-year-old in letter mode and an 8-year-old in word mode.

### Parameters Controlled

| Parameter | Letter Mode Range | Word Mode Range |
|-----------|------------------|-----------------|
| Fall speed | 20-60 px/s | 30-100 px/s |
| Spawn interval | 3-6 seconds | 1.5-4 seconds |
| Max simultaneous | 1-3 entities | 2-8 entities |
| Character set | A-Z (progressive unlock) | Word list by difficulty tier |
| Word length | n/a | 2-8 characters |

### Adaptive Algorithm

Track a rolling window of recent performance (last 20 actions):

```typescript
interface PerformanceWindow {
  accuracy: number;      // hits / (hits + misses + escapes)
  avgReactionTime: number; // ms from spawn to first correct keystroke
  streakLength: number;    // current consecutive hits
}

// Adjust difficulty:
// accuracy > 0.85 && avgReaction < 2000ms --> increase difficulty
// accuracy < 0.60 || avgReaction > 4000ms --> decrease difficulty
// Otherwise --> hold steady
```

**Key insight:** For children, frustration kills engagement faster than boredom. The engine should be **biased toward decreasing difficulty** -- drop fast on failures, climb slowly on success. A 70% success rate is the sweet spot for flow state in educational games.

**Confidence:** MEDIUM (based on adaptive learning research from [Benton 2021](https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.13146) and general DDA principles)

## Persistence Architecture

### Dual-Layer Strategy

```
                [State Manager]
                      |
              [Persistence API] (abstract interface)
                  /         \
    [LocalStorageAdapter]  [FirebaseAdapter]
```

The Persistence API is a simple interface:

```typescript
interface PersistenceAdapter {
  loadProfile(id: string): Promise<PlayerProfile>;
  saveProfile(profile: PlayerProfile): Promise<void>;
  listProfiles(): Promise<ProfileSummary[]>;
  deleteProfile(id: string): Promise<void>;
}
```

LocalStorage is always available. Firebase is opt-in (user enables sync). When Firebase is active, writes go to both; reads prefer Firebase with LocalStorage as fallback.

**Save triggers:** Auto-save after each game session ends (not during gameplay -- avoid I/O during the game loop).

## Suggested Build Order

Dependencies flow downward -- each layer depends on the layers above it being stable.

### Phase 1: Foundation (no game yet, just the skeleton)

Build first because everything depends on these:

1. **Game Loop** -- fixed-timestep requestAnimationFrame loop
2. **State Manager** -- finite state machine for screen transitions
3. **Canvas Renderer** -- basic canvas setup, layered approach, text rendering
4. **Input Manager** -- keyboard event capture and buffering

Deliverable: A loop that runs, captures keys, and renders text on canvas. No gameplay yet.

### Phase 2: Core Gameplay (the typing invader mechanic)

Build second because this IS the product:

5. **Word Manager** -- entity pool, spawning, falling, position tracking
6. **Collision Detector** -- match input buffer against active words
7. **i18n Module** -- word lists (French/English), letter sets per language
8. **Game Modes** -- letter mode vs word mode selection and behavior

Deliverable: Words fall, you type to destroy them, new ones spawn. No scoring, no difficulty curve.

### Phase 3: Progression and Persistence

Build third because it needs stable gameplay to attach to:

9. **Score/XP System** -- points, XP, level calculations
10. **Difficulty Engine** -- adaptive algorithm using performance window
11. **Player Profiles** -- creation, selection, avatar system
12. **Persistence Layer** -- LocalStorage adapter, save/load cycle

Deliverable: Multiple kids can play, earn XP, level up, with difficulty that adapts.

### Phase 4: Polish and Engagement

Build last because it layers on top of working gameplay:

13. **Audio Manager** -- SFX and music system
14. **Visual Effects** -- word destruction animations, particles, screen feedback
15. **Unlockable Characters** -- reward system tied to XP/levels
16. **Firebase Adapter** -- cloud sync (optional feature)

Deliverable: The game feels good to play -- sounds, visuals, rewards.

### Build Order Rationale

- **Game Loop before everything** because all systems run inside it
- **Renderer before Word Manager** because words need to be visible to test
- **Collision before Difficulty** because difficulty tuning requires a working game
- **Persistence after Score/XP** because you need something worth saving
- **Audio last** because it is pure polish -- the game works without it

## Scalability Considerations

| Concern | MVP (2 users) | If popular (100+ users) | Notes |
|---------|--------------|------------------------|-------|
| Word lists | JSON files bundled in app | Same -- static assets | No server needed |
| Profiles | LocalStorage per browser | Firebase per family account | Migration path built in |
| Performance | Single canvas | Layered canvas + offscreen | Optimize if profiling shows need |
| Assets (SVG/audio) | Bundled, <2MB total | CDN if needed | Static hosting handles this |
| Languages | FR + EN hardcoded lists | JSON files per language, lazy loaded | Keep extensible from start |

This is a client-side game for a family. "Scalability" means adding more word lists and languages, not handling concurrent users. The architecture should optimize for **maintainability and extensibility**, not throughput.

## Sources

- [MDN: Anatomy of a Video Game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) -- HIGH confidence, authoritative game loop patterns
- [MDN: Audio for Web Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games) -- HIGH confidence, Web Audio API patterns
- [MDN: Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) -- HIGH confidence
- [Aleksandr Hovhannisyan: Performant Game Loops in JavaScript](https://www.aleksandrhovhannisyan.com/blog/javascript-game-loop/) -- MEDIUM confidence, practical implementation
- [Zeroberry: JavaScript Fixed Timestep Game Loop](https://zeroberry.me/post/javascript-fixed-timestep-game-loop/) -- MEDIUM confidence, implementation reference
- [web.dev: Developing game audio with Web Audio API](https://web.dev/webaudio-games/) -- HIGH confidence, Google developer reference
- [Benton 2021: Designing for challenge in adaptive literacy games](https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.13146) -- MEDIUM confidence, academic research on difficulty for children
- [ACM 2025: Towards Adaptive Difficulty and Personalized Player Experience](https://dl.acm.org/doi/10.1145/3743049.3743070) -- LOW confidence (not read in full, cited for DDA trends)
