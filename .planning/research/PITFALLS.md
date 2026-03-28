# Domain Pitfalls

**Domain:** Children's typing game (web, "typing invaders" style)
**Researched:** 2026-03-28

## Critical Pitfalls

Mistakes that cause rewrites or make the game unusable for the target audience.

### Pitfall 1: Using `event.code` Instead of `event.key` for Character Matching

**What goes wrong:** The game checks physical key positions (`event.code: "KeyA"`) instead of the character the user actually typed (`event.key: "a"`). On an AZERTY keyboard (the default in France), pressing the physical "Q" key produces "a". The game rejects correct input from French children using their standard keyboard.

**Why it happens:** Many tutorials and game examples use `event.code` because it is stable across layouts -- good for movement controls (WASD), terrible for typing games. Developers testing on QWERTY never notice.

**Consequences:** The game is completely broken for AZERTY users. Since the two target children are French, this is a ship-blocking bug.

**Prevention:**
- Use `event.key` exclusively for all character matching logic.
- `event.key` returns the character produced by the key press, respecting the user's keyboard layout and locale.
- Reserve `event.code` only for non-character actions (pause, menu navigation) if needed.
- Test with both QWERTY and AZERTY layouts in OS keyboard settings.

**Detection:** Game rejects correct keystrokes when switching OS keyboard layout to AZERTY.

**Phase relevance:** Must be correct from the very first keyboard input implementation. Retrofitting is easy but embarrassing.

**Confidence:** HIGH (MDN documentation, Chrome developer blog)

---

### Pitfall 2: Dead Keys and Composition Events Break Input on French Keyboards

**What goes wrong:** On French AZERTY keyboards, typing accented characters like "e" with a circumflex requires pressing the dead key `^` then `e`. During this sequence, the `keydown` event fires with `event.key: "Dead"` -- not the expected character. If the game processes every `keydown` immediately, it sees "Dead" as an unrecognized key, rejects it, and the composed character "e" is never matched.

**Why it happens:** Developers unfamiliar with composition events treat every `keydown` as a complete input. French keyboards produce accented characters through dead key sequences that span multiple key presses. The browser fires `compositionstart`, `compositionupdate`, and `compositionend` events around these sequences.

**Consequences:** Accented characters (e, a, u, i, o, etc.) cannot be typed in the game. Since French word lists contain many accented characters, entire word modes become unplayable.

**Prevention:**
- Check `event.isComposing` on every `keydown` -- if `true`, ignore the event and wait.
- Listen for `compositionend` events to capture the final composed character.
- Alternative: for the MVP, avoid requiring accented characters in word lists entirely (use only ASCII-safe French words). This defers the problem but limits vocabulary.
- If accented characters are included, the input pipeline must be: `keydown` -> check `isComposing` -> if composing, wait for `compositionend` -> then match the composed character.

**Detection:** Test by switching to AZERTY layout and typing any accented character (circumflex + vowel, tilde + n, etc.). If the game registers "Dead" or ignores the input, this pitfall is present.

**Phase relevance:** Must be handled when word mode with accented characters is introduced. Can be deferred if letter mode only uses unaccented letters initially.

**Confidence:** HIGH (MDN documentation, W3C UI Events spec, Firefox bug tracker)

---

### Pitfall 3: Browser Audio Autoplay Restrictions Silently Kill Sound

**What goes wrong:** The game initializes its `AudioContext` or loads background music on page load. Modern browsers (Chrome, Safari, Firefox) block audio playback until the user has interacted with the page (click, tap, or key press). The game appears to work but plays no sound. Children (and parents) think the game is broken.

**Why it happens:** Browser autoplay policies, introduced for user protection, require a user gesture before audio can play. An `AudioContext` created before user interaction starts in a "suspended" state. Calling `.play()` on an `<audio>` element silently fails or returns a rejected Promise.

**Consequences:** No sound effects, no background music, no audio feedback on correct/incorrect keystrokes. For a children's game, audio feedback is a core engagement mechanism -- losing it destroys the experience without any visible error.

**Prevention:**
- Create the `AudioContext` lazily, on the first user interaction (the "Start Game" button click or first keypress).
- If the context is already created and suspended, call `audioContext.resume()` inside a user gesture handler.
- Use the `navigator.getAutoplayPolicy()` API (where supported) to detect the current policy.
- Design the UX so the game always requires a "Play" button click before gameplay starts -- this naturally provides the required user gesture.
- Pre-load audio assets after the first interaction, not on page load.

**Detection:** Open the game in a fresh Chrome tab. If you hear no sound until you click something, autoplay was blocked. Check the browser console for "AudioContext was not allowed to start" warnings.

**Phase relevance:** Must be addressed when audio is first introduced. The "Start Game" button pattern should be established from the very first playable prototype.

**Confidence:** HIGH (Chrome developer blog, MDN Autoplay guide)

---

### Pitfall 4: Adaptive Difficulty That Punishes Instead of Encourages

**What goes wrong:** The difficulty system responds too aggressively to performance. A 5-year-old misses a few letters, the system speeds up (misinterpreting it as "too easy because they're not engaging") or slows down so much it becomes boring. Worse: difficulty adjusts per-letter, creating erratic speed changes that feel chaotic rather than supportive.

**Why it happens:** Naive adaptive systems use simple metrics (hit rate, reaction time) with tight feedback loops. Children's performance is inherently inconsistent -- a child might nail 10 letters then miss 5 because they got distracted by the dog. Short measurement windows amplify noise.

**Consequences:** The game oscillates between too hard and too easy. Children experience unpredictable difficulty, which research on adaptive learning games identifies as a primary cause of frustration and disengagement. The child quits.

**Prevention:**
- Use a sliding window of at least 20-30 inputs to measure performance, not individual inputs.
- Difficulty should only ever change between rounds/waves, never mid-wave. This gives children a stable experience within each wave.
- Asymmetric adjustment: decrease difficulty faster than increasing it. Frustration is worse than mild boredom.
- Define a "comfort zone" (e.g., 60-80% success rate) and only adjust when the average falls outside it.
- For the 5-year-old mode (single letters), difficulty = speed of falling + number of simultaneous letters. Start extremely slow (one letter at a time, very slow fall).
- For the 8-year-old mode (words), difficulty = word length + fall speed + number of simultaneous words.
- Never reduce XP or take away progress. Only positive reinforcement.

**Detection:** Watch a child play for 5 minutes. If the speed feels "jumpy" or the child says "it's not fair," the adaptation window is too short.

**Phase relevance:** Core game loop phase. Must be designed correctly from the start; retrofitting adaptive difficulty onto a fixed-difficulty game is a significant rework.

**Confidence:** MEDIUM (research papers on adaptive learning games, Prodigy game design blog, OT Toolbox recommendations)

---

### Pitfall 5: Game Loop Causing Jank on Low-End Hardware

**What goes wrong:** The game uses `requestAnimationFrame` but allocates objects every frame (new arrays, new objects for positions, string concatenation for rendering). Garbage collection pauses cause visible stutters -- falling letters "teleport" downward. On a child's older laptop or Chromebook, this makes the game feel broken.

**Why it happens:** JavaScript's garbage collector runs unpredictably. Creating objects in the hot loop (the render/update cycle) fills the young generation heap, triggering GC pauses of 5-20ms. At 60fps, a 16ms frame budget means even one GC pause drops a frame.

**Consequences:** Stuttering animations, inconsistent fall speeds, missed collision detection (a letter passes through the "kill zone" during a frame skip). Children perceive this as unfairness -- "I typed it but it didn't work!"

**Prevention:**
- Object pooling: pre-allocate letter/word entities and recycle them instead of creating new ones.
- Zero-allocation game loop: compute positions in-place, avoid `Array.map()` / `Array.filter()` / spread operators in the update loop.
- Use `performance.now()` delta time for position updates so frame drops don't cause speed inconsistency -- a letter falls the same distance regardless of frame rate.
- Profile with Chrome DevTools Performance tab early, with 4x CPU throttling enabled to simulate low-end hardware.
- If using SVG/DOM elements for falling letters (vs Canvas): limit the total number of active DOM nodes. SVG performance degrades past a few hundred animated elements.

**Detection:** Open Chrome DevTools > Performance > Enable CPU throttling 4x. Play the game for 30 seconds. If the flame chart shows frequent GC pauses or frames exceeding 16ms, the loop needs optimization.

**Phase relevance:** Architecture phase. The game loop pattern (pooling, delta time, zero-alloc update) must be established in the foundation. Bolting it on later requires rewriting the entire render pipeline.

**Confidence:** HIGH (MDN game development docs, Chrome DevTools documentation, multiple game development guides)

---

## Moderate Pitfalls

### Pitfall 6: `keypress` Event Is Deprecated and Inconsistent

**What goes wrong:** Using the `keypress` event for input detection. It is deprecated, does not fire for non-printable keys (Backspace, Escape), and behaves inconsistently across browsers, especially with dead keys on international layouts.

**Prevention:** Use `keydown` exclusively. `keypress` has been formally deprecated by the W3C. Check `event.key` on `keydown` for character matching.

**Phase relevance:** First input handling implementation.

**Confidence:** HIGH (MDN, W3C spec)

---

### Pitfall 7: LocalStorage Data Loss and Quota Surprises

**What goes wrong:** Child profiles, XP, and unlocked characters are stored in `localStorage`. A parent clears browser data, or the browser evicts storage (especially on iOS Safari in low-storage conditions). All progress is lost. The child is devastated.

**Why it happens:** `localStorage` has a ~5MB limit per origin, no expiration mechanism, and can be wiped by the user or browser without warning. On iOS, Safari in private browsing mode has historically had issues with `localStorage` writes.

**Prevention:**
- Always wrap `localStorage.setItem()` in a `try/catch` to handle `QuotaExceededError`.
- Display a visible "saved" indicator after successful saves so parents trust the system.
- Implement an export/import feature (JSON download) as a manual backup mechanism before Firebase cloud sync is built.
- Keep save data compact: store only essential state (level, XP, unlocked items), not full session history.
- When Firebase sync is added later, use localStorage as a cache/fallback, not the source of truth.

**Detection:** Test in Safari private browsing mode. Test with `localStorage` at quota (fill it with dummy data first). Verify error handling works.

**Phase relevance:** Profile and persistence phase. The try/catch and backup patterns must be in from the start.

**Confidence:** HIGH (MDN Storage quotas documentation)

---

### Pitfall 8: Keyboard Focus Lost After UI Interactions

**What goes wrong:** The child clicks on their avatar, a settings button, or an overlay menu. Focus moves to that UI element. When they return to gameplay, keystrokes are no longer captured because focus is on a button, not the game container. The game appears frozen.

**Why it happens:** DOM focus management. If the game listens for `keydown` on a specific element (the game container), clicking elsewhere moves focus away. If it listens on `document` or `window`, focus is not an issue -- but then keystrokes leak into other UI (typing into a settings input field while the game is paused).

**Consequences:** The child types frantically but nothing happens. They think the game is broken. A parent has to click back into the game area.

**Prevention:**
- Listen for `keydown` on `document` level, but gate processing on game state (only process when `gameState === "playing"`).
- After any modal/overlay closes, explicitly call `.focus()` on the game container.
- Use `tabIndex="-1"` on the game container so it can receive focus programmatically.
- During gameplay, intercept Tab key to prevent focus from leaving the game area (but release this trap when not in active gameplay -- WCAG 2.1.2 compliance).
- Prevent `keydown` events from triggering game actions when an input field is focused (check `event.target.tagName`).

**Detection:** Click on any non-game UI element during gameplay, then try typing. If the game does not respond, focus management is broken.

**Phase relevance:** UI/menu phase. Must be addressed whenever menus or overlays are added alongside the game loop.

**Confidence:** HIGH (MDN keyboard accessibility, WCAG guidelines)

---

### Pitfall 9: SVG/DOM Rendering Bottleneck with Many Falling Elements

**What goes wrong:** The project spec calls for "cartoon/SVG" visuals. Each falling letter/word is a complex SVG group (character + alien/monster sprite + animations). With 10+ simultaneous elements, the browser struggles to recompose the DOM, especially with CSS animations running in parallel.

**Why it happens:** SVG elements are DOM nodes. Each one participates in layout, style recalculation, and compositing. Unlike Canvas, where you draw pixels directly, SVG/DOM rendering scales poorly with element count.

**Prevention:**
- Keep simultaneous falling elements to a maximum of 5-8 for smooth SVG performance.
- Use CSS `transform` and `opacity` for animations (these are GPU-composited and skip layout).
- Avoid animating `top`, `left`, `width`, `height` -- these trigger layout recalculation.
- Pre-render complex SVG sprites as static assets. Animate only position (`translateY`) and simple properties.
- If performance becomes a problem, consider a hybrid approach: Canvas for the gameplay area (falling letters) + SVG/DOM for the static UI (score, avatar, menus).
- Profile on a low-end device early (Chromebook, old iPad).

**Detection:** Add 15+ falling elements simultaneously with full sprite animations. If frame rate drops below 30fps on a mid-range laptop, the SVG approach needs simplification or a Canvas fallback.

**Phase relevance:** Visual design and game loop phase. The rendering strategy choice (pure SVG vs hybrid) should be validated with a performance test before building extensive visual assets.

**Confidence:** MEDIUM (SVG vs Canvas benchmarks, game development community consensus)

---

### Pitfall 10: Multilingual Architecture Bolted On Instead of Built In

**What goes wrong:** The game is built with French strings hardcoded everywhere. When English support is added, developers do find-and-replace, duplicate templates, or create a half-hearted translation system. Word lists, UI labels, difficulty parameters (French words are longer than English on average), and audio callouts all need separate handling.

**Why it happens:** i18n feels like a "later" problem. But in a typing game, the language is the content, not just the UI chrome. The word list IS the gameplay. Difficulty curves depend on word length distributions that differ by language.

**Consequences:** Difficulty calibration breaks when switching languages. UI layout breaks with longer/shorter translations. Adding a new language requires touching dozens of files.

**Prevention:**
- From day one, all user-visible strings go through an i18n lookup (even if only French exists initially).
- Word lists are separate data files per language, loaded dynamically.
- Difficulty parameters (word length ranges, fall speed curves) are per-language configuration, not global constants.
- UI layout must accommodate ~30% text length variation (German/French tend to be longer than English).
- Letter frequency distributions differ by language -- the "which letters appear" logic must be language-aware.

**Detection:** Grep the codebase for French strings outside of i18n files. If any exist in component files, the i18n architecture is leaking.

**Phase relevance:** Foundation/architecture phase. The i18n pattern is cheap to establish early, expensive to retrofit.

**Confidence:** HIGH (standard software engineering practice, directly relevant to project requirements)

---

## Minor Pitfalls

### Pitfall 11: Key Repeat Events Causing Double-Scoring

**What goes wrong:** A child holds down a key. The OS fires repeated `keydown` events. The game scores each one, destroying multiple letters with a single held key.

**Prevention:** Check `event.repeat` on every `keydown`. If `true`, ignore the event. One physical press = one game action.

**Phase relevance:** First input handling implementation.

**Confidence:** HIGH (MDN KeyboardEvent.repeat documentation)

---

### Pitfall 12: No Visual Feedback for Wrong Keystrokes

**What goes wrong:** The child presses a wrong key and nothing happens. They don't know if the game registered the input or if they made a mistake. They press harder, more frantically.

**Prevention:** Always provide immediate feedback for every keystroke -- correct (letter explodes, positive sound) and incorrect (brief screen shake, gentle "nope" sound, letter flashes red). Never leave a keystroke unacknowledged. For wrong keys, feedback should be gentle and brief, not punishing (no loud buzzer, no loss of points).

**Phase relevance:** Core gameplay phase, alongside the scoring system.

**Confidence:** MEDIUM (educational game design best practices)

---

### Pitfall 13: Mobile/Tablet Virtual Keyboard Unreliability

**What goes wrong:** On tablets, the virtual keyboard may not fire standard `keydown`/`keyup` events reliably. Some mobile browsers use `input` events on hidden text fields instead. The game is "responsive" visually but input does not work.

**Prevention:**
- Since the project explicitly targets physical keyboard learning and excludes virtual keyboards from scope, consider showing a clear message on mobile: "This game requires a physical keyboard. Please use a computer."
- If tablet-with-bluetooth-keyboard is a supported scenario, test that `keydown` events fire correctly through virtual keyboard layers.
- Use `navigator.maxTouchPoints > 0` or similar heuristics to detect touch devices and show the message.

**Phase relevance:** Responsive design phase. A simple detection + message is sufficient for MVP.

**Confidence:** MEDIUM (known mobile keyboard limitations, project scope explicitly excludes virtual keyboards)

---

### Pitfall 14: Forgetting Browser Tab Visibility Handling

**What goes wrong:** The child switches to another tab (YouTube, obviously). The game continues running. When they switch back, 30 seconds of letters have piled up at the bottom, the game is effectively over, and the score is destroyed.

**Prevention:**
- Listen for `document.visibilitychange` events.
- Pause the game immediately when `document.hidden` becomes `true`.
- Show a "Paused" overlay when the tab regains focus, requiring a click/keypress to resume.
- Note: `requestAnimationFrame` is throttled by browsers in background tabs, but not fully paused -- entities still accumulate if the update logic runs on a timer.

**Phase relevance:** Core game loop phase.

**Confidence:** HIGH (standard web game development practice)

---

### Pitfall 15: Child Safety -- External Links and Data Leakage

**What goes wrong:** A library dependency loads an external font from Google Fonts, includes analytics tracking, or a dependency's error reporting sends data to a third-party server. Even without intentional data collection, COPPA-like regulations apply.

**Prevention:**
- Self-host all assets (fonts, images, sounds). No CDN dependencies at runtime.
- Audit all npm dependencies for network calls. Use browser DevTools Network tab to verify zero external requests during gameplay.
- Firebase (when added) must be configured with minimal permissions. No Analytics, no Crashlytics, no external data sharing.
- Add a privacy statement to the game's about/settings page.

**Phase relevance:** From the very first deployment. Must be verified before any child uses the application.

**Confidence:** HIGH (COPPA/GDPR requirements, project constraint: "aucune donnee personnelle collectee")

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Foundation / Game Loop | Pitfall 5 (GC jank), Pitfall 14 (tab visibility) | Establish object pooling and delta-time loop from day one. Add visibility handler immediately. |
| Input Handling | Pitfalls 1, 2, 6, 11 (key/code, dead keys, keypress, repeat) | Use `event.key` + `keydown` + `isComposing` check + `event.repeat` filter. Test with AZERTY layout. |
| Audio | Pitfall 3 (autoplay) | Require user gesture before first audio. Lazy-init AudioContext. |
| Adaptive Difficulty | Pitfall 4 (punishing difficulty) | Sliding window, between-wave adjustments only, asymmetric adjustment. |
| Visual Rendering | Pitfall 9 (SVG bottleneck) | Performance test with max elements on low-end hardware before committing to pure SVG. |
| i18n / Word Lists | Pitfalls 2, 10 (dead keys, i18n architecture) | i18n from day one. Decide early whether accented characters are in scope for word mode. |
| Persistence / Profiles | Pitfall 7 (localStorage) | Try/catch all writes, export/import backup, compact data format. |
| UI / Menus | Pitfall 8 (focus loss) | Document-level keydown gated by game state. Explicit focus management on overlay close. |
| Responsive / Mobile | Pitfall 13 (virtual keyboard) | Detect touch devices, show "physical keyboard required" message. |
| Deployment | Pitfall 15 (child safety) | Audit network requests. Self-host all assets. No third-party tracking. |

## Sources

- [MDN: KeyboardEvent.key](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key) -- HIGH confidence
- [MDN: KeyboardEvent.code](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code) -- HIGH confidence
- [MDN: KeyboardEvent.isComposing](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing) -- HIGH confidence
- [MDN: Autoplay guide](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) -- HIGH confidence
- [Chrome: Web Audio autoplay policy](https://developer.chrome.com/blog/web-audio-autoplay) -- HIGH confidence
- [Chrome: KeyboardEvent keys and codes](https://developer.chrome.com/blog/keyboardevent-keys-codes) -- HIGH confidence
- [MDN: Storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) -- HIGH confidence
- [MDN: Game development anatomy](https://developer.mozilla.org/en-US/docs/Games/Anatomy) -- HIGH confidence
- [MDN: Audio for web games](https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games) -- HIGH confidence
- [W3C: Dead keys in UI Events](https://github.com/w3c/uievents/issues/343) -- HIGH confidence
- [Firefox Bug 308820: Dead keys and keypress](https://bugzilla.mozilla.org/show_bug.cgi?id=308820) -- HIGH confidence
- [SVG vs Canvas vs WebGL benchmarks](https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025) -- MEDIUM confidence
- [Adaptive serious games for children (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8204245/) -- MEDIUM confidence
- [Designing for challenge in adaptive literacy games (Wiley)](https://bera-journals.onlinelibrary.wiley.com/doi/10.1111/bjet.13146) -- MEDIUM confidence
- [Andrico's blog: event.code vs event.key](https://blog.andri.co/022-should-i-use-ecode-or-ekey-when-handling-keyboard-events/) -- MEDIUM confidence
- [WCAG 2.1.2: No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html) -- HIGH confidence
