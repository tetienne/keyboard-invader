# Project Research Summary

**Project:** Keyboard Invader
**Domain:** Children's typing game (web, "typing invaders" style, ages 5-8)
**Researched:** 2026-03-28
**Confidence:** HIGH

## Executive Summary

Keyboard Invader is a browser-based typing game for children aged 5-8 built entirely as a static client-side application. Research confirms this domain is well-established — competitors like ZType prove the "type to destroy" mechanic works, and TypingClub/Dance Mat Typing prove that young kids need adaptive, encouraging experiences. No existing product combines the invaders mechanic with real-time adaptive difficulty specifically designed for ages 5-8. That gap is the product's core value proposition.

The recommended approach is: PixiJS 8 for canvas rendering (not DOM-based falling elements — a critical performance decision), a fixed-timestep game loop separating simulation from rendering, and a component-based architecture coordinated via an event bus. The stack is deliberately lean: Vanilla TypeScript + Vite (no UI framework), PixiJS (not Phaser — lighter, faster, actively maintained), Howler.js for audio, and a custom 30-line i18n solution instead of a heavy library. LocalStorage handles persistence from day one; Firebase cloud sync is explicitly deferred to a later phase behind an adapter interface.

The biggest risks are architectural and must be established in Phase 1 before any feature work: input handling must use `event.key` (not `event.code`) or the game is broken for French AZERTY users; the game loop must use object pooling and fixed timestep or GC jank makes the game feel broken on children's low-end laptops; and i18n must be wired in from day one or retrofitting is expensive. The adaptive difficulty system is the defining differentiator but requires working gameplay to tune — it is Phase 2, not Phase 1.

## Key Findings

### Recommended Stack

The stack is intentionally minimal. PixiJS 8 is the critical choice over Phaser (Phaser 3 is EOL, Phaser 4 is still in RC) and Kaplay (benchmarks at 3 FPS vs PixiJS at 47 FPS). Vanilla TypeScript with Vite 8 produces a fast, dependency-light static bundle with no framework overhead fighting the game loop. GSAP handles celebration animations. Howler.js abstracts browser audio quirks for 7KB. Persistence starts with LocalStorage behind an adapter interface so Firebase can slot in later without touching game code.

See `.planning/research/STACK.md` for full rationale and alternatives considered.

**Core technologies:**
- TypeScript 5.7 + Vite 8: type-safe static build, no framework overhead
- PixiJS 8.17: fastest 2D WebGL/Canvas renderer; BitmapText and SplitBitmapText are purpose-built for typing games
- GSAP 3.12: celebration animations and transitions; free for non-commercial use
- Howler.js 2.2.4: Web Audio API abstraction, 7KB, handles autoplay policy quirks
- LocalStorage (native): profiles and progress with zero dependencies
- Custom i18n (30 lines): JSON word lists + UI strings; i18next (22KB) is overkill for ~50 strings
- Cloudflare Pages: fastest free static hosting, unlimited bandwidth

### Expected Features

Research across 6 competitive products (ZType, TypingClub, Dance Mat Typing, Nitro Type, KidzType, Typing.com) identifies a clear feature hierarchy.

**Must have (table stakes):**
- Core falling letters/words gameplay loop — this IS the product
- Single-letter mode for pre-readers (age 5) — every young-kid competitor has this
- Word mode for readers (age 8) — required for the older child
- Immediate audio/visual feedback on every keypress — ZType's best feature; kids need instant reinforcement
- Difficulty speed progression (waves ramp up) — universal; without it, the game breaks in 60 seconds
- Score display and session summary — universal HUD; parents also want to see progress
- Pause/resume — kids get interrupted constantly
- Child-safe environment (no ads, no external links, no personal data) — table stakes for parent trust

**Should have (differentiators):**
- Adaptive difficulty (real-time) — THE key differentiator; no invaders game does this for ages 5-8
- Dual age-mode in one app — single household, two radically different players
- Avatar-based profiles (no passwords) — click your character to play; zero friction
- XP and leveling system — visible progression that brings kids back
- Unlockable characters — XP-gated cosmetic rewards; top kid motivator
- French + English word banks from day one — bilingual household need
- Cartoon SVG art style — age-appropriate; ZType's aesthetic is too dark for young kids
- Celebration moments (animations + sound on level-up) — Dance Mat Typing nails this

**Defer (v2+):**
- Cloud sync via Firebase — nice-to-have; single-device LocalStorage is sufficient at launch
- Advanced parent stats/analytics dashboard
- Additional languages beyond FR/EN

**Explicit anti-features (do not build):**
- Multiplayer or leaderboards — competition creates anxiety in ages 5-8
- Game-over/fail states — gentle "missed" animation when a word escapes; never game over
- WPM as primary metric — meaningless and discouraging for beginners
- Virtual on-screen keyboard for tapping — defeats the purpose of learning physical keyboard placement

### Architecture Approach

The architecture is a component-based game loop that strictly separates simulation (fixed 20Hz update rate) from rendering (display refresh rate with interpolation). All components communicate via a typed event bus rather than direct references — this keeps systems decoupled so audio, particles, and analytics can be added by subscribing to existing events with zero changes to existing code. Falling words are rendered on Canvas (not DOM elements — DOM layout thrashing with dozens of moving nodes causes jank). The game canvas layer sits behind a DOM overlay for HUD and menus. A persistence adapter interface isolates LocalStorage from the rest of the game, enabling Firebase to be swapped in later.

See `.planning/research/ARCHITECTURE.md` for full component map, data flow diagram, and code patterns.

**Major components:**
1. **Game Loop** — fixed-timestep requestAnimationFrame; orchestrates all systems
2. **Input Manager** — buffers keydown events, processes on update tick (not immediately)
3. **Word Manager** — entity pool for spawning/recycling falling words; avoids GC allocation
4. **Collision Detector** — matches input buffer against active words; emits typed events
5. **Difficulty Engine** — sliding-window performance tracking; adjusts spawn rate, speed, complexity
6. **Score/XP System** — points, XP, level-up tracking; event-driven
7. **Canvas Renderer** — layered canvases (background, game scene, effects); PixiJS
8. **State Manager** — finite state machine (BOOT → PROFILE_SELECT → PLAYING → PAUSED → GAME_OVER)
9. **Persistence Layer** — LocalStorageAdapter implementing PersistenceAdapter interface
10. **i18n Module** — JSON word lists and UI strings per language; language-aware difficulty parameters

### Critical Pitfalls

1. **`event.code` instead of `event.key`** — Using physical key codes breaks input for all AZERTY keyboard users (French children). Use `event.key` exclusively for character matching. Test with AZERTY layout from day one. This is a ship-blocking bug if missed.

2. **Dead keys / composition events on French keyboards** — Accented characters (common in French) use multi-keystroke dead key sequences. The game sees `event.key: "Dead"` and breaks. Check `event.isComposing` on every keydown; wait for `compositionend`. Simplest MVP mitigation: exclude accented characters from word lists initially.

3. **Browser audio autoplay restrictions** — AudioContext created on page load is silently suspended. Lazy-initialize AudioContext on the first user interaction (the "Start" button click). Without this, the game appears to have no audio and children think it is broken.

4. **Punishing adaptive difficulty** — A tight feedback loop (adjusting per-keystroke) makes the game feel chaotic. Children's performance is inherently inconsistent. Use a sliding window of 20-30 inputs; only adjust between waves, never mid-wave; decrease difficulty 2x faster than increasing it. Target 60-80% success rate for flow state.

5. **GC jank from in-loop allocation** — Creating objects every frame (new arrays, spread operators, string concatenation in the update loop) causes GC pauses that manifest as stuttering on children's low-end laptops. Pre-allocate word entities with an object pool; compute positions in-place. Profile with 4x CPU throttle from the start.

## Implications for Roadmap

The feature dependency chain is clear: Core gameplay must exist before difficulty can be tuned, XP requires gameplay data, leveling requires XP, unlockables require leveling. Architecture must be established before features. The recommended build order from ARCHITECTURE.md maps directly to phases.

### Phase 1: Foundation
**Rationale:** The game loop, input handling, canvas setup, and state machine are prerequisites for every other system. Without these correct, no feature can be built reliably. Input handling pitfalls (Pitfalls 1, 2, 6, 11) must be solved here — retrofitting is embarrassing, not hard.
**Delivers:** A loop that runs, captures keyboard input correctly (AZERTY-safe, dead-key-aware, keypress deprecated, repeat events filtered), renders text on canvas, and transitions between states. No gameplay yet.
**Addresses:** GC jank prevention (object pool pattern established), tab visibility handling, i18n wiring (even if only French strings exist).
**Avoids:** Pitfall 5 (GC jank), Pitfall 1 (event.code), Pitfall 6 (keypress deprecated), Pitfall 11 (key repeat), Pitfall 10 (i18n bolted on late), Pitfall 14 (tab visibility).
**Research flag:** Standard patterns. MDN game anatomy is authoritative. Skip phase research.

### Phase 2: Core Gameplay
**Rationale:** This is the product. Once the foundation is stable, the typing invader mechanic is the entire value delivered to a child. Word lists, game modes, and input/collision are all tightly coupled — build them together.
**Delivers:** Words fall, you type to destroy them, new ones spawn. Single-letter mode for pre-readers. Both FR and EN word lists. Immediate audio/visual feedback on correct and incorrect keystrokes. Basic score display. Pause/resume.
**Addresses:** All table-stakes features except difficulty progression and profiles.
**Avoids:** Pitfall 2 (dead keys/composition — decide here whether accented characters are in scope), Pitfall 3 (audio autoplay — "Start" button gesture established), Pitfall 8 (keyboard focus loss — document-level keydown gated by game state), Pitfall 9 (SVG bottleneck — validate canvas rendering performance with max elements before building assets), Pitfall 12 (no visual feedback for wrong keystroke), Pitfall 13 (mobile virtual keyboard — detect and show message).
**Research flag:** The collision detection matching algorithm (which word gets priority when multiple start with the same letter) may need a quick research spike during planning.

### Phase 3: Progression and Persistence
**Rationale:** XP, levels, and profiles need stable gameplay to attach to. Difficulty tuning requires observing real play. Persistence is needed before profiles have anything worth saving.
**Delivers:** Multiple child profiles selectable by avatar (no password). XP earned per session. Level system with visible milestones. Adaptive difficulty that responds to real-time performance. All progress saved to LocalStorage.
**Addresses:** Avatar-based profiles, XP/leveling, adaptive difficulty, LocalStorage persistence.
**Avoids:** Pitfall 4 (punishing difficulty — sliding window, between-wave only, asymmetric adjustment), Pitfall 7 (LocalStorage data loss — try/catch all writes, export/import backup, compact format).
**Research flag:** Adaptive difficulty algorithm parameters (window size, thresholds, adjustment rates) need calibration with real child testing. This is the highest-uncertainty implementation in the project.

### Phase 4: Polish and Engagement
**Rationale:** Celebration moments, unlockable characters, and full audio are pure polish. The game works and is educational without them; they make children return willingly.
**Delivers:** Over-the-top celebration animations (GSAP) on level-up. Unlockable characters at XP milestones. Full audio — SFX (Web Audio API) and background music (HTMLAudioElement). Visual effects (particles, screen shake for hits).
**Addresses:** Unlockable characters, celebration moments, word mode for older kids if not in Phase 2.
**Avoids:** Pitfall 3 (audio autoplay — AudioContext lazy-init in place from Phase 2), Pitfall 15 (child safety — audit all network requests, self-host all assets, no tracking).
**Research flag:** GSAP animation sequences are well-documented. Audio architecture patterns are well-documented via MDN. Skip phase research.

### Phase 5: Cloud Sync (Optional)
**Rationale:** Firebase deferred until the game is polished and multi-device sync becomes a real user need. The PersistenceAdapter interface makes this a contained addition.
**Delivers:** Profiles sync across devices via Firebase Firestore + anonymous auth. Export/import backup for parents who want it.
**Addresses:** Cloud sync, multi-device household use.
**Avoids:** Adding Firebase complexity before the core product is validated.
**Research flag:** Firebase v12 anonymous auth + Firestore integration for a static site will need a research spike during phase planning.

### Phase Ordering Rationale

- Architecture before features: input handling pitfalls are cheap to fix in Phase 1, expensive to retrofit in Phase 3.
- i18n in Phase 1: word lists are the gameplay content; the architecture must be language-aware from the start (Pitfall 10).
- Core gameplay before progression: XP and difficulty tuning require a working game to measure against.
- Difficulty in Phase 3, not Phase 1: you cannot tune adaptive difficulty without observing real gameplay; building it too early optimizes for the wrong parameters.
- Audio and celebration in Phase 4: they are pure polish; the game is functional and educational without them.
- Firebase explicitly last: the adapter pattern means it slots in cleanly when genuinely needed.

### Research Flags

Phases needing deeper research during planning:
- **Phase 3 (Adaptive Difficulty):** Algorithm parameters (window size, thresholds, speed ranges) need validation. Academic research gives principles but not concrete numbers for ages 5-8. Plan time for calibration testing.
- **Phase 5 (Firebase):** Firebase v12 anonymous auth + Firestore data model for child profiles needs a research spike. Authentication patterns for children's apps (no email) have specific constraints.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** MDN Game Anatomy is authoritative. Input event handling is fully documented. Fixed-timestep loop pattern is well-established.
- **Phase 2 (Core Gameplay):** PixiJS BitmapText and canvas rendering are well-documented. Audio autoplay policy is well-documented.
- **Phase 4 (Polish):** GSAP, Howler.js, and Web Audio API patterns are all well-documented. No novel integration challenges.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Technology choices backed by benchmarks, official release notes, and clear alternatives analysis. PixiJS vs Phaser rationale is particularly solid (Phaser 3 EOL is factual). |
| Features | HIGH | Six competitor products analyzed. Competitive gap (invaders mechanic + adaptive difficulty for ages 5-8) is clearly identified. Anti-features are well-reasoned against child development research. |
| Architecture | HIGH | Patterns sourced from MDN (authoritative), multiple game dev references. Fixed-timestep loop, event bus, and entity pool are industry-standard patterns with strong documentation. |
| Pitfalls | HIGH | Most pitfalls are HIGH-confidence sourced from MDN, W3C specs, Chrome DevTools documentation. AZERTY/dead-key pitfalls are especially relevant and well-documented for this project. Adaptive difficulty calibration is MEDIUM — principles are solid, specific numbers need testing. |

**Overall confidence:** HIGH

### Gaps to Address

- **Adaptive difficulty calibration numbers:** Research gives principles (sliding window, 60-80% success rate target, asymmetric adjustment) but specific parameter values (window size = 20-30, speed ranges, adjustment increments) need tuning against actual 5-year-old and 8-year-old players. Flag as "validate during Phase 3 implementation."
- **Accented characters in word mode:** The scope decision (include accented French characters or restrict to ASCII-safe French words) has significant architectural implications for the composition event handling. This must be decided before Phase 2 implementation. MVP recommendation: start ASCII-safe and add accented characters as a Phase 3 enhancement.
- **Visual performance validation:** The architecture recommends Canvas over SVG for falling words but the art direction calls for cartoon/SVG character sprites. The hybrid approach (Canvas for game scene, SVG for static sprites pre-rendered as textures) needs an early performance spike on a low-end device before building extensive SVG assets.
- **Word list curation:** Technical architecture for word lists is clear (JSON per language per difficulty tier), but the actual word curation (what words are age-appropriate, what letter frequency distributions look like for 5-year-olds vs 8-year-olds) is a content gap, not a technical gap.

## Sources

### Primary (HIGH confidence)
- [MDN: Anatomy of a Video Game](https://developer.mozilla.org/en-US/docs/Games/Anatomy) — game loop patterns
- [MDN: KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) — AZERTY input handling
- [MDN: KeyboardEvent.isComposing](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing) — dead key composition
- [MDN: Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) — audio policy
- [MDN: Audio for Web Games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games) — audio architecture
- [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — localStorage limits
- [Chrome: Web Audio autoplay policy](https://developer.chrome.com/blog/web-audio-autoplay) — AudioContext restrictions
- [PixiJS v8.17 releases](https://github.com/pixijs/pixijs/releases) — version and feature verification
- [PixiJS blog v8.11.0](https://pixijs.com/blog/8.11.0) — SplitBitmapText feature
- [Phaser v3.90 final release](https://phaser.io/download/stable) — EOL status confirmation
- [Phaser v4 RC6](https://phaser.io/news/2025/12/phaser-v4-release-candidate-6-is-out) — not production-stable
- [W3C: Dead keys in UI Events](https://github.com/w3c/uievents/issues/343) — composition event spec

### Secondary (MEDIUM confidence)
- [JS Game Rendering Benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark) — PixiJS (47 FPS) vs Kaplay (3 FPS)
- [Benton 2021: Adaptive literacy games](https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.13146) — difficulty adaptation for children
- [GSAP vs Motion comparison](https://motion.dev/docs/gsap-vs-motion) — animation library analysis
- [SVG vs Canvas vs WebGL performance 2025](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025) — rendering benchmarks
- ZType, TypingClub, Dance Mat Typing, Nitro Type, KidzType, Typing.com — competitive analysis

### Tertiary (LOW confidence)
- [ACM 2025: Towards Adaptive Difficulty and Personalized Player Experience](https://dl.acm.org/doi/10.1145/3743049.3743070) — DDA trends (not read in full)

---
*Research completed: 2026-03-28*
*Ready for roadmap: yes*
