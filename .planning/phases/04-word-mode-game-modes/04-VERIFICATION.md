---
phase: 04-word-mode-game-modes
verified: 2026-03-31T23:26:00Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "Mode selection: open menu in browser, verify two buttons (A B C / Lettres and MOT / Mots) are visible and hover scale effect works"
    expected: "Two distinct mode buttons; pointerover scales to 1.1, pointerout returns to 1.0"
    why_human: "Visual layout and interactive hover cannot be verified from source code alone"
  - test: "Word mode per-character highlighting: start word mode, type the first letter of the active falling word"
    expected: "That character turns green (tint 0x4ade80); subsequent wrong key triggers red flash and shake without resetting the cursor"
    why_human: "Requires live PixiJS canvas rendering; SplitBitmapText.chars tint changes are not observable from unit tests"
  - test: "Session summary display: complete a letter-mode session and a word-mode session"
    expected: "Letter session shows '{n} lettres pratiques'; word session shows '{n} mots pratiques'; both show time in mm:ss and accuracy percentage"
    why_human: "BitmapText content rendered on canvas is not inspectable from unit tests"
  - test: "Pause during word mode: start a word session, switch browser tabs or blur the window"
    expected: "Pause overlay appears immediately; Space bar resumes gameplay; timer does not accumulate during pause"
    why_human: "Requires browser interaction to trigger blur/visibilitychange events; timer behavior during pause needs live verification"
  - test: "Replay preserves mode; Menu returns to mode selection: after a word-mode session summary, click Rejouer then click Menu"
    expected: "Rejouer starts another word session (words fall, not letters); Menu returns to two-button mode selection screen"
    why_human: "State transitions involving mode persistence require interactive browser verification"
---

# Phase 04: Word Mode and Game Modes Verification Report

**Phase Goal:** An 8-year-old can play word mode, both children can choose their mode, and sessions have a clear start/pause/end flow
**Verified:** 2026-03-31T23:26:00Z
**Status:** human_needed (all automated checks pass; 5 items require browser verification)
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Child can select between letter mode and word mode from the menu | VERIFIED | MenuState creates letterBtn (setGameMode 'letters') and wordBtn (setGameMode 'words'); states.test.ts line 243 verifies 5 addChild calls (title + 2 buttons + 2 labels) |
| 2 | In word mode, complete words fall and are typed letter-by-letter with per-character green highlight | VERIFIED | _spawnWord() uses SplitBitmapText.split() to populate chars; _processWordInput() sets chars[cursorIndex].tint = 0x4ade80 on 'correct'; states.test.ts line 287 confirms acquireWordPoolItem is called after 2500ms |
| 3 | Wrong key in word mode shows red flash and shake; child retries the same character | VERIFIED | matchWordKey returns 'wrong' -> createMissTween() applied; cursorIndex NOT incremented on miss; _updateWordTweens() restores only unmatched chars, preserving green on already-typed chars |
| 4 | Pause works identically in both letter and word mode | VERIFIED | Pause is implemented at Game class level (not state level), via blur/visibilitychange/keydown handlers; applies regardless of mode; ticker stop/start mechanism is mode-agnostic |
| 5 | Session summary shows accuracy percentage, items practiced count, and time played in mm:ss | VERIFIED | GameOverState formats timePlayed with padStart(2,'0'); itemLabel branches on mode ('mots' vs 'lettres'); states.test.ts lines 473-499 verify both letter and word mode session results are read |
| 6 | Replay button replays the same mode; Menu button returns to mode selection | VERIFIED | Replay calls ctx.transitionTo('playing') (mode preserved in _gameMode); Menu calls ctx.transitionTo('menu'); setGameMode was called by button click and persists in Game._gameMode |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/game/types.ts` | GameMode type, extended SessionResult, extended GameContext | VERIFIED | GameMode on line 9; SessionResult has timePlayed/mode (lines 23-25); GameContext has setGameMode, getGameMode, acquireWordPoolItem, releaseWordPoolItem (lines 56-59) |
| `src/game/words.ts` | WordEntity, getAvailableWords, findActiveWord, loadWordLists, matchWordKey | VERIFIED | All 5 exports present; 80 lines of substantive implementation; no stubs |
| `src/game/states.ts` | Mode-aware MenuState, PlayingState, GameOverState | VERIFIED | 771 lines; full dual-mode implementation; getGameMode called in enter(); setGameMode in button handlers |
| `src/game/game.ts` | GameContext implementation with gameMode, word pool | VERIFIED | _gameMode field, setGameMode/getGameMode, _wordPool (ObjectPool<SplitBitmapText>), acquireWordPoolItem/releaseWordPoolItem all present |
| `src/game/tween.ts` | TweenTarget extended with optional chars | VERIFIED | chars?: Array<{ tint: number }> added to TweenTarget text interface (line 15) |
| `src/shared/i18n/fr.words.json` | French word lists (short + medium) | VERIFIED | 25 short + 20 medium words present |
| `src/shared/i18n/en.words.json` | English word lists (short + medium) | VERIFIED | 25 short + 20 medium words present |
| `src/shared/i18n/fr.json` | menu.mode.letters, menu.mode.words, summary.* keys | VERIFIED | All 8 keys present (menu.mode.letters, menu.mode.words, summary.accuracy, summary.items, summary.time, summary.replay, summary.menu, summary.bravo) |
| `src/shared/i18n/en.json` | Same keys in English | VERIFIED | All 8 keys present |
| `tests/game/words.test.ts` | Unit tests for word module | VERIFIED | 16 tests covering loadWordLists, getAvailableWords, findActiveWord, matchWordKey; all pass |
| `tests/game/states.test.ts` | Tests for mode selection, word spawning, session result | VERIFIED | MenuState mode buttons test (line 243); PlayingState word mode spawn (line 287); setSessionResult timePlayed/mode (line 389); GameOverState reads both modes (lines 473-499) |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| states.ts (MenuState) | game.ts (setGameMode) | ctx.setGameMode('words') on button click | WIRED | Lines 147/176 in states.ts call ctx.setGameMode; Game class implements setGameMode at line 162 |
| states.ts (PlayingState) | words.ts | import getAvailableWords, findActiveWord, matchWordKey | WIRED | Lines 13-18 in states.ts import all four functions from ./words.js; all are called in _spawnWord and _processWordInput |
| states.ts (GameOverState) | types.ts (SessionResult) | result.timePlayed and result.mode for summary display | WIRED | Lines 628/623 in states.ts read result.timePlayed and result.mode; used in timeStr formatting and itemLabel selection |
| words.ts | fr.words.json / en.words.json | static JSON import | WIRED | Lines 2-3 in words.ts import both JSON files; loadWordLists returns the correct one by locale |
| words.ts | types.ts (GameMode) | import type LetterTween | WIRED | words.ts imports LetterTween from ./tween.js (not GameMode directly -- GameMode used in states.ts where needed) |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| states.ts PlayingState | wordLists | loadWordLists(getLocale()) called in enter() | Yes -- JSON files loaded statically, non-empty arrays verified | FLOWING |
| states.ts PlayingState | timePlayedMs | this.timePlayedMs += dt in every update() call | Yes -- dt accumulates from game loop ticks | FLOWING |
| states.ts GameOverState | result (timePlayed, mode) | ctx.getSessionResult() set by PlayingState | Yes -- setSessionResult called with real accumulated values before gameover transition | FLOWING |
| states.ts MenuState | setGameMode | ctx.setGameMode('letters'/'words') on pointertap | Yes -- immediately sets _gameMode in Game class; read back in PlayingState.enter() | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All tests pass | `mise exec -- pnpm test` | 18 test files, 194 tests passed in 1.03s | PASS |
| TypeScript compiles cleanly | `mise exec -- pnpm tsc --noEmit` | No output (zero errors) | PASS |
| words.ts exports all functions | grep on src/game/words.ts | loadWordLists, getAvailableWords, findActiveWord, matchWordKey, WordEntity, WordLists, WordMatchResult all present | PASS |
| Game class implements word pool | grep on src/game/game.ts | _wordPool, acquireWordPoolItem, releaseWordPoolItem all present | PASS |
| fr.words.json has 25 short words | checked file | 25 entries in short array | PASS |
| en.words.json has 25 short words | checked file | 25 entries in short array | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|---------|
| GAME-03 | 04-01 (primary) + 04-02 | L'enfant en mode mots (lecteur) voit des mots courts a taper en entier | SATISFIED | SplitBitmapText word entities fall in word mode; _processWordInput handles letter-by-letter typing; word lists contain 3-5 letter short words |
| GAME-06 | 04-02 | L'enfant peut mettre le jeu en pause et reprendre | SATISFIED | game.ts implements _pause()/_resume()/_unpause() via blur/visibilitychange; Space bar unpause verified in code |
| GAME-07 | 04-02 | L'enfant voit un resume de fin de session (precision, lettres/mots pratiques, temps) | SATISFIED | GameOverState renders three lines: accuracy%, items with mode label, Temps: mm:ss; Rejouer and Menu buttons wired |

No orphaned requirements detected. All three phase-04 requirement IDs (GAME-03, GAME-06, GAME-07) are claimed by plans and have implementation evidence.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | -- | -- | -- | -- |

Scanned: states.ts, game.ts, words.ts, tween.ts, types.ts. No TODO/FIXME/placeholder comments, no empty return bodies, no hardcoded empty props passed to rendering. The one `return null` in findActiveWord (words.ts line 64) is correct logic, not a stub.

Note: The i18n keys added to fr.json and en.json (menu.mode.letters, summary.bravo, etc.) are not yet consumed by states.ts -- MenuState uses hardcoded strings 'Lettres', 'Mots', 'Rejouer', 'Menu' etc. directly. This is a minor inconsistency (labels exist in JSON but are not read via getLocale/i18n lookup), but it does not block goal achievement since the correct strings are still displayed. Flagged as informational.

### Human Verification Required

The automated layer is fully passing (194/194 tests, zero type errors). The following behaviors require browser verification because they depend on PixiJS canvas rendering or real browser events.

#### 1. Mode Selection Visual Layout

**Test:** Run `mise exec -- pnpm dev`, open the game in a browser, observe the menu screen.
**Expected:** Two buttons are visible -- "A B C" with "Lettres" label below, and "MOT" with "Mots" label below. Hovering either button makes it scale up slightly (1.1x).
**Why human:** Visual layout and interactive pointer events are not testable from unit tests.

#### 2. Per-Character Green Highlight in Word Mode

**Test:** Click the "MOT / Mots" button. When a word is falling, type its first letter correctly.
**Expected:** That character turns visibly green while the others remain their original color. Continue typing; each correct letter turns green in sequence. On the last letter, the whole word briefly scales up and fades (hit tween).
**Why human:** Requires live SplitBitmapText rendering; char.tint changes are only visible on canvas.

#### 3. Wrong Key Behavior in Word Mode

**Test:** During word mode, with an active falling word, deliberately type the wrong key.
**Expected:** The word flashes red and shakes. The cursor does NOT reset -- the same letter is still expected next (green chars so far stay green).
**Why human:** Visual tint + shake animation requires canvas observation.

#### 4. Session Summary Content

**Test:** Complete a letter session (20 letters fall, session ends) and a word session (15 words fall, session ends).
**Expected:** Letter session summary shows accuracy %, a count with "lettres pratiques" label, and time in mm:ss. Word session summary shows the same with "mots pratiques". "Rejouer" starts another session in the same mode. "Menu" returns to the two-button selection screen.
**Why human:** BitmapText content on canvas is not inspectable programmatically.

#### 5. Pause During Word Mode

**Test:** Start a word session, then switch to another browser tab or click outside the window.
**Expected:** Pause overlay appears ("PAUSE" + "Appuie sur Espace pour continuer"). Pressing Space resumes gameplay. The time displayed in the final summary should NOT include the paused duration.
**Why human:** Requires real browser blur/visibilitychange events; timer accumulation during pause cannot be triggered from unit tests.

### Gaps Summary

No gaps found. All truths are verified at code level. All artifacts exist with substantive implementation. All key links are wired. Data flows from real sources (word lists, accumulated dt, session result). The 5 items above are standard human verification for visual/interactive behaviors that cannot be mechanically verified.

---

_Verified: 2026-03-31T23:26:00Z_
_Verifier: Claude (gsd-verifier)_
