# Phase 4: Word Mode & Game Modes - Research

**Researched:** 2026-03-31
**Domain:** PixiJS game state extension, word-based typing gameplay, mode selection UI
**Confidence:** HIGH

## Summary

Phase 4 extends the existing letter-mode game engine with word-mode gameplay, a mode selection menu, and an enhanced session summary. The codebase is well-structured with clear patterns (state machine, object pool, tween system, input buffer) that map directly to word-mode requirements. The primary technical challenge is per-character tinting on falling words; PixiJS v8's `SplitBitmapText` solves this cleanly.

No new dependencies are needed. All required functionality builds on PixiJS 8.17.x features already in the project. The i18n system is ready for word list JSON files, and the state machine transitions already support the required flow. Pause/resume is already implemented at the Game level (Phase 2) and needs no changes beyond verification that it works for word mode.

**Primary recommendation:** Use `SplitBitmapText` for word entities to get per-character tint control. Mirror the `letters.ts` module pattern for a new `words.ts` module. Extend `GameContext` with a `GameMode` type to make `PlayingState` mode-aware.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Each falling word is a single BitmapText entity from the existing pool, displaying the full word. Same acquire/release pattern as letter entities
- **D-02:** Letter-by-letter highlight as the child types; each correctly typed character changes tint (green) while remaining characters stay in original color. Uses PixiJS v8 character-level tint or multi-BitmapText approach
- **D-03:** Words use same kid-friendly color palette and large font size (~60-80px) as letters
- **D-04:** Word fall speed is slower than letter mode. Fixed speed for Phase 4
- **D-05:** Wrong letter: gentle red flash on current character position + small shake. No progress lost
- **D-06:** Correct letter: current character highlights green, cursor advances. When all typed, hit tween triggers
- **D-07:** Each word has internal typing cursor. Only one word active/targetable at a time (lowest on screen)
- **D-08:** Input matching uses existing InputManager buffer
- **D-09:** Word lists stored as JSON files per locale: `src/shared/i18n/fr.words.json` and `en.words.json`
- **D-10:** Words categorized by length: short (3-4 letters), medium (5-6 letters). Phase 4 uses only short and medium
- **D-11:** ASCII-only words (no accented characters)
- **D-12:** Word selection uses progressive difficulty: start with short words, introduce medium after ~40% of session
- **D-13:** Menu screen with two large, visually distinct buttons (letter mode, word mode) with icons for pre-readers
- **D-14:** Button labels use i18n: "Lettres"/"Letters" and "Mots"/"Words"
- **D-15:** Mode selection is per-session, not persisted
- **D-16:** MenuState refactored to show mode buttons instead of single "Jouer" button. Selected mode passed via GameContext
- **D-17:** Summary screen shows: accuracy percentage, items practiced count, time played
- **D-18:** Time played tracked from PlayingState enter to session end, in minutes:seconds
- **D-19:** Summary tone remains encouraging ("Bravo!")
- **D-20:** Summary actions: "Rejouer" (replay same mode) and "Menu" (return to mode selection)
- **D-21:** Pause/resume already implemented (Phase 2). Phase 4 ensures it works for both modes
- **D-22:** Pause overlay and Space/Enter unpause applies identically to word mode
- **D-23:** PlayingState becomes mode-aware: accepts game mode parameter ('letters' | 'words')
- **D-24:** Shared logic stays in PlayingState. Mode-specific logic extracted to helper modules
- **D-25:** New file `src/game/words.ts` for word list loading, word selection, matching logic
- **D-26:** GameContext extended with `getGameMode()` method

### Claude's Discretion
- Exact word list content (specific words for fr/en, count per category)
- Visual design of mode selection buttons (icon style, colors, layout)
- Whether to use SplitBitmapText or multiple BitmapText objects for per-character tint
- Internal code organization of mode-specific logic within PlayingState
- Exact word fall speed value (slower than letter mode's 80px/sec)
- Timer display format details on summary screen

### Deferred Ideas (OUT OF SCOPE)
- Accented character support (dead-key handling)
- Word difficulty based on letter frequency or phonetic complexity (Phase 5)
- Category-based word lists (animals, colors, food)
- Combo/streak bonuses (Phase 7)
- Sound effects for word completion (Phase 9)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-03 | L'enfant en mode mots (lecteur) voit des mots courts a taper en entier | SplitBitmapText for per-character rendering, WordEntity type mirroring LetterEntity, word list JSON loading, progressive word selection |
| GAME-06 | L'enfant peut mettre le jeu en pause et reprendre | Already implemented in Game class (Phase 2). Pause uses ticker.stop(), resume uses ticker.start(). Works identically for word mode since pause operates at the Game level, not state level |
| GAME-07 | L'enfant voit un resume de fin de session (precision, lettres/mots pratiques, temps) | SessionResult type extended with timePlayed, GameOverState enhanced with time display and mode-specific labels |
</phase_requirements>

## Architecture Patterns

### Current Architecture (to extend)

```
src/game/
  types.ts       -- GameState, GameContext, StateName, SessionResult
  states.ts      -- StateMachine, BootState, MenuState, PlayingState, PausedState, GameOverState
  game.ts        -- Game class (implements GameContext), pause/resume, pool
  letters.ts     -- LetterEntity, getAvailableLetters(), findLowestMatch(), findLowestEntity()
  tween.ts       -- LetterTween, createHitTween/createMissTween/createBottomTween, updateTween()
  input.ts       -- InputManager (buffer/drain pattern)
  pool.ts        -- ObjectPool<T>
  loop.ts        -- GameLoop (fixed timestep)
  canvas.ts      -- Letterbox scaling
  debug.ts       -- F3 debug overlay
src/shared/i18n/
  index.ts       -- t(), setLocale(), getLocale()
  fr.json        -- UI strings (6 keys currently)
  en.json        -- UI strings (6 keys currently)
```

### New/Modified Files

```
src/game/
  types.ts       -- ADD: GameMode type, extend SessionResult with timePlayed, extend GameContext
  words.ts       -- NEW: WordEntity, word list loading, word selection, findActiveWord()
  states.ts      -- MODIFY: MenuState (mode buttons), PlayingState (mode-aware), GameOverState (time + replay mode)
  game.ts        -- MODIFY: GameContext implementation for gameMode
  tween.ts       -- MINOR: TweenTarget may need adjustment for SplitBitmapText chars
src/shared/i18n/
  fr.json        -- ADD: mode button labels, summary labels
  en.json        -- ADD: mode button labels, summary labels
  fr.words.json  -- NEW: French word lists by category
  en.words.json  -- NEW: English word lists by category
```

### Pattern 1: Mode-Aware PlayingState

**What:** PlayingState delegates to mode-specific helpers for spawning, matching, and entity management.
**When:** Every update tick during gameplay.
**Approach:**

```typescript
// types.ts
export type GameMode = 'letters' | 'words'

export interface SessionResult {
  readonly hits: number
  readonly misses: number
  readonly total: number
  readonly timePlayed: number // NEW: milliseconds
  readonly mode: GameMode     // NEW: for summary display
}

export interface GameContext {
  // ... existing ...
  setGameMode(mode: GameMode): void
  getGameMode(): GameMode
}
```

PlayingState checks `ctx.getGameMode()` in `enter()` and branches spawning/matching logic accordingly. Shared code (fall movement, tween updates, cleanup, score display) stays in PlayingState. Mode-specific code lives in `letters.ts` and `words.ts`.

### Pattern 2: WordEntity with SplitBitmapText

**What:** Each falling word uses SplitBitmapText for per-character tint control.
**Why:** SplitBitmapText decomposes text into individual character display objects accessible via `.chars`, allowing per-character `tint` changes for typing progress feedback.

```typescript
// words.ts
import type { SplitBitmapText } from 'pixi.js'
import type { LetterTween } from './tween.js'

export interface WordEntity {
  readonly text: SplitBitmapText
  readonly poolIndex: number
  word: string           // full word lowercase
  cursorIndex: number    // which character the child must type next
  baseX: number
  originalTint: number
  tween: LetterTween | null
  markedForRemoval: boolean
}
```

**Key difference from D-01:** D-01 says "single BitmapText entity." SplitBitmapText extends BitmapText, so it IS a BitmapText entity. The pool creates SplitBitmapText instances instead of BitmapText when in word mode. This is a Claude's Discretion item.

### Pattern 3: Word Input Matching (Single Active Word)

**What:** Only the lowest word on screen is "active." Keys are matched against the active word's current character position.
**Why:** Avoids confusion for children about which word to type.

```typescript
// words.ts
export function findActiveWord(active: readonly WordEntity[]): WordEntity | null {
  let best: WordEntity | null = null
  for (const entity of active) {
    if (entity.tween === null && !entity.markedForRemoval) {
      if (!best || entity.text.y > best.text.y) {
        best = entity
      }
    }
  }
  return best
}

// In PlayingState update (word mode):
// const activeWord = findActiveWord(this.activeWordEntities)
// if (!activeWord) continue
// for (const key of keys) {
//   const expected = activeWord.word[activeWord.cursorIndex]
//   if (key === expected) {
//     // highlight char green, advance cursor
//     activeWord.text.chars[activeWord.cursorIndex].tint = 0x4ade80
//     activeWord.cursorIndex++
//     if (activeWord.cursorIndex >= activeWord.word.length) {
//       // word complete - trigger hit tween
//       activeWord.tween = createHitTween()
//       activeWord.markedForRemoval = true
//       this.hits++
//     }
//   } else {
//     // miss: red flash + shake on current char
//     this.misses++
//   }
// }
```

### Pattern 4: Progressive Word Selection

**What:** Mirror Phase 3's letter progression (HOME_ROW -> TOP_ROW -> BOTTOM_ROW) with SHORT_WORDS -> MEDIUM_WORDS.
**When:** Each spawn event picks from the available pool based on session progress.

```typescript
// words.ts
interface WordLists {
  short: string[]  // 3-4 letters
  medium: string[] // 5-6 letters
}

export function getAvailableWords(
  wordLists: WordLists,
  progress: number,
  total: number,
): string[] {
  if (total === 0) return wordLists.short
  const ratio = progress / total
  if (ratio < 0.4) return wordLists.short
  return [...wordLists.short, ...wordLists.medium]
}
```

### Anti-Patterns to Avoid
- **Separate state classes for each mode:** Do NOT create `PlayingLetterState` and `PlayingWordState`. This duplicates shared logic (fall, tweens, cleanup, scoring). Use a single PlayingState with mode delegation.
- **Pooling SplitBitmapText AND BitmapText in the same pool:** The pool factory creates one type. Either use two pools (one per mode) or use SplitBitmapText for both modes (it works for single characters too). Two pools is cleaner.
- **Modifying InputManager for word mode:** The input buffer pattern already works. Keys arrive one at a time and are processed sequentially against the active word. No changes needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-character tinting | Multiple BitmapText objects manually positioned | `SplitBitmapText` (.chars property) | SplitBitmapText handles character layout, positioning, and gives per-character display objects for free |
| Word list loading | Custom file loader | Static JSON imports (same as i18n) | Vite resolves JSON imports at build time; no async loading needed |
| Timer formatting | Manual string formatting | `Intl.DateTimeFormat` or simple math | mm:ss is simple enough with `Math.floor(ms/60000)` and `(ms/1000) % 60` |

## Per-Character Tinting: SplitBitmapText vs Multi-BitmapText

This is a Claude's Discretion item. Research recommendation:

**Use SplitBitmapText.** Reasons:
1. Built-in PixiJS v8 feature (v8.11+), purpose-built for per-character manipulation
2. `.chars` array gives direct access to each character as a display object with `.tint`
3. Handles character layout and positioning automatically
4. A single `SplitBitmapText` behaves as one display object for transforms (move, scale, alpha) during tweens
5. Performance note from docs: "Splitting text creates additional display objects" but for words of 3-6 characters this is negligible

**Alternative (multi-BitmapText):** Would require manually computing character widths and x-offsets, managing N pool items per word, and coordinating transforms. Much more code for the same result.

**Pool consideration:** The existing pool creates `BitmapText` with fontSize 80. For word mode, create a separate pool of `SplitBitmapText` with fontSize ~60 (smaller for longer text). The Game class should expose a second pool method or the mode-specific logic manages its own pool. Simplest approach: mode-specific pool created in PlayingState.enter() and destroyed in exit(), since the pool is only needed during gameplay.

## Common Pitfalls

### Pitfall 1: SplitBitmapText .chars Not Available Until Rendered
**What goes wrong:** Accessing `.chars` immediately after setting `.text` may return an empty array if the text hasn't been rendered yet.
**Why it happens:** SplitBitmapText may defer character decomposition until the render pass.
**How to avoid:** After setting `.text` on a SplitBitmapText, call `text.updateText()` or add it to the stage before accessing `.chars`. Verify in testing that chars are populated.
**Warning signs:** `text.chars.length === 0` when it should match the word length.

### Pitfall 2: Pool Item Reset for SplitBitmapText
**What goes wrong:** Reusing a pool item retains the previous word's character count and tints.
**Why it happens:** SplitBitmapText decomposes into characters; changing `.text` should re-split, but tints on old chars may persist.
**How to avoid:** On acquire: set `.text`, then iterate `.chars` to reset all tints to the default color. Same pattern as Phase 3's "reset ALL properties on reused pool item."
**Warning signs:** Green tinted characters appearing on freshly spawned words.

### Pitfall 3: Word Mode Miss Counting
**What goes wrong:** Each wrong keypress counts as a miss, but the child retries the same character. Misses could inflate rapidly for a struggling child.
**Why it happens:** Unlike letter mode where a miss is "no matching letter on screen," word mode miss is "wrong character for current position."
**How to avoid:** D-05 says "no progress lost; child retries current letter." Count misses but ensure the summary framing is encouraging. Consider whether "accuracy" for word mode should be `correct_chars / (correct_chars + wrong_keypresses)` or `words_completed / words_spawned`.
**Warning signs:** Very low accuracy percentages that could discourage children.

### Pitfall 4: Font Size for Words
**What goes wrong:** 80px font (current letter mode) makes even short words (4 chars) very wide, potentially overflowing the 1280px canvas.
**Why it happens:** 4 characters at 80px BitmapText could be ~200px wide, which is fine. But 6 characters at 80px is ~300px, still OK. The real issue is spawn x-positioning: `80 + Math.random() * (BASE_WIDTH - 160)` could place a 300px word partially off-screen.
**How to avoid:** Calculate word width after setting text, and constrain x to `[wordWidth/2, BASE_WIDTH - wordWidth/2]`. Use 60-70px for words vs 80px for letters.
**Warning signs:** Words cut off at screen edges.

### Pitfall 5: Session Timer During Pause
**What goes wrong:** Timer keeps running while the game is paused, inflating "time played."
**Why it happens:** If timer uses wall-clock time (Date.now()), pause doesn't stop it.
**How to avoid:** Accumulate time using the `dt` parameter in `update()`. Since `update()` is not called when paused (ticker is stopped), time naturally pauses. Store `this.timePlayedMs += dt` in PlayingState.
**Warning signs:** Pausing for 5 minutes then resuming shows 5+ minutes of play time for a 30-second session.

### Pitfall 6: Menu Button Centering with Variable Width
**What goes wrong:** Mode buttons appear off-center because BitmapText width isn't known until after text is set.
**Why it happens:** BitmapText.width depends on the rendered text content.
**How to avoid:** Set text first, then position using `btn.x = BASE_WIDTH / 2 - btn.width / 2` (existing pattern from MenuState).

## Word List Recommendations (Claude's Discretion)

### French (ASCII-only, no accents)
**Short (3-4 letters):** ~25 words
Examples: chat, loup, pont, four, drap, bloc, clou, flou, gros, gris, brun, long, rond, plat, flux, gant, bras, club, golf, plan, port, prix, prof, surf, tram

**Medium (5-6 letters):** ~20 words
Examples: champ, blanc, bruit, clown, sport, train, grand, front, blond, plomb, scout, stand, steak, class, flash, match, patch, snack, stock, truck

Key criteria: no accented characters, familiar to 8-year-olds, common French vocabulary, all lowercase a-z.

### English
**Short (3-4 letters):** ~25 words
Examples: cat, dog, hat, sun, run, big, red, top, cup, box, fish, milk, tree, frog, drum, king, ship, star, jump, hand, cake, bird, lion, moon, book

**Medium (5-6 letters):** ~20 words
Examples: apple, water, house, plant, beach, cloud, candy, pizza, robot, tiger, happy, bunny, train, super, mouse, green, truck, snake, plane, grass

### JSON Structure

```json
{
  "short": ["chat", "loup", "pont", "..."],
  "medium": ["champ", "blanc", "bruit", "..."]
}
```

## Session Summary Enhancement

### Current SessionResult
```typescript
interface SessionResult {
  readonly hits: number
  readonly misses: number
  readonly total: number
}
```

### Extended SessionResult
```typescript
interface SessionResult {
  readonly hits: number
  readonly misses: number
  readonly total: number
  readonly timePlayed: number  // milliseconds
  readonly mode: GameMode      // 'letters' | 'words'
}
```

### Summary Display (GAME-07)
- Accuracy: `Math.round((hits / total) * 100)` + "%" (existing pattern)
- Items practiced: `total` with mode-appropriate label ("lettres" or "mots")
- Time played: `mm:ss` format from accumulated dt
- Replay button: passes current mode back to PlayingState
- Menu button: returns to mode selection

### i18n Keys to Add

```json
{
  "menu.mode.letters": "Lettres",
  "menu.mode.words": "Mots",
  "summary.accuracy": "Precision",
  "summary.items": "Pratiques",
  "summary.time": "Temps",
  "summary.replay": "Rejouer",
  "summary.menu": "Menu",
  "summary.bravo": "Bravo !"
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Multiple BitmapText per character | SplitBitmapText | PixiJS v8.11 (2024) | Single object with per-character access |
| BitmapText only | SplitBitmapText for per-char needs | PixiJS v8.11+ | Cleaner API for typing game highlight effects |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `vite.config.ts` (inline test config) |
| Quick run command | `mise exec -- pnpm test` |
| Full suite command | `mise exec -- pnpm test` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| GAME-03 | Word mode spawns words, letter-by-letter typing, word completion | unit | `mise exec -- pnpm vitest run tests/game/words.test.ts -x` | Wave 0 |
| GAME-03 | PlayingState word mode spawning and matching | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts -x` | Exists (extend) |
| GAME-06 | Pause works in word mode | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts -x` | Exists (extend) |
| GAME-07 | Session summary shows accuracy, items, time | unit | `mise exec -- pnpm vitest run tests/game/states.test.ts -x` | Exists (extend) |

### Sampling Rate
- **Per task commit:** `mise exec -- pnpm test`
- **Per wave merge:** `mise exec -- pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/game/words.test.ts` -- covers GAME-03 (word selection, word matching, findActiveWord)
- [ ] Extend `tests/game/states.test.ts` -- covers GAME-03 (PlayingState word mode), GAME-06 (pause in word mode), GAME-07 (summary with time)

## Open Questions

1. **SplitBitmapText pool behavior on text change**
   - What we know: SplitBitmapText decomposes text into `.chars` display objects
   - What's unclear: Whether changing `.text` on a pooled SplitBitmapText correctly re-splits and recounts characters, or if we need to destroy/recreate
   - Recommendation: Test early in implementation. If pooling SplitBitmapText is problematic, create new instances per spawn and destroy on release (acceptable for 5-10 concurrent words)

2. **Word mode "total" metric for accuracy**
   - What we know: Letter mode counts `hits/total` where total = session length (number of letters spawned)
   - What's unclear: For word mode, is "total" the number of words spawned, or total characters across all words? D-17 says "items practiced count" which suggests words, not characters
   - Recommendation: Track both `wordsCompleted` and `totalCharsTyped`. Display "X mots" for items practiced. Calculate accuracy as `correctKeystrokes / totalKeystrokes`

## Sources

### Primary (HIGH confidence)
- Project codebase: `src/game/states.ts`, `src/game/letters.ts`, `src/game/types.ts`, `src/game/game.ts` -- current implementation patterns
- [SplitBitmapText Guide](https://pixijs.com/8.x/guides/components/scene-objects/text/split-text) -- per-character access via `.chars`
- [SplitBitmapText API](https://pixijs.download/release/docs/text.SplitBitmapText.html) -- official API reference

### Secondary (MEDIUM confidence)
- [PixiJS v8.17.0 blog](https://pixijs.com/blog/8.17.0) -- SplitText tagStyles support
- [PixiJS v8.16.0 blog](https://pixijs.com/blog/8.16.0) -- SplitBitmapText enhancements

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new deps, all PixiJS 8.17.x features
- Architecture: HIGH -- clear patterns from existing codebase to extend
- Pitfalls: HIGH -- derived from hands-on codebase analysis and PixiJS docs

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable, no fast-moving deps)
