# Phase 4: Word Mode & Game Modes - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-03-31
**Phase:** 04-word-mode-game-modes
**Areas discussed:** Word rendering, Word lists & categories, Mode selection UI, Session summary screen
**Mode:** --auto (all decisions auto-selected with recommended defaults)

---

## Word Rendering & Typing Progress

| Option | Description | Selected |
|--------|-------------|----------|
| Letter-by-letter highlight | Each correctly typed character changes color while remaining stay original | Y |
| Full word flash on completion | Word stays static until fully typed, then animates | |
| Underline/cursor approach | Show cursor under current letter like a text editor | |

**User's choice:** [auto] Letter-by-letter highlight (recommended default)
**Notes:** Fits existing BitmapText + tween system. Gives immediate per-character feedback matching the one-key-at-a-time rhythm of letter mode.

### Wrong letter behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Gentle flash, no progress lost | Red flash + shake on current char, child retries | Y |
| Reset word progress | Wrong letter resets to first character | |
| Skip to next word | Wrong letter marks word as missed | |

**User's choice:** [auto] Gentle flash, no progress lost (recommended default)
**Notes:** Consistent with Phase 3 non-punitive design. Core value: non-frustrating for children.

### Pool strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse existing BitmapText pool | Same pool, items display words instead of letters | Y |
| Separate word pool | New pool type for word entities | |

**User's choice:** [auto] Reuse existing BitmapText pool (recommended default)
**Notes:** Same acquire/release pattern. BitmapText can display any string length.

---

## Word Lists & Categories

| Option | Description | Selected |
|--------|-------------|----------|
| JSON files per locale in i18n/ | fr.words.json and en.words.json, loaded at boot | Y |
| Hardcoded arrays in TypeScript | Word arrays directly in source code | |
| External API fetch | Load words from a remote service | |

**User's choice:** [auto] JSON files per locale in i18n/ (recommended default)
**Notes:** Consistent with existing i18n infrastructure pattern.

### Difficulty categorization

| Option | Description | Selected |
|--------|-------------|----------|
| By word length (3-4, 5-6, 7+) | Simple, objective metric for difficulty | Y |
| By letter frequency | Words with common letters are easier | |
| By age-appropriate vocabulary lists | Curated lists per reading level | |

**User's choice:** [auto] By word length (recommended default)
**Notes:** Phase 5 (Adaptive Difficulty) will refine. Length is sufficient for initial word mode.

### Accented characters

| Option | Description | Selected |
|--------|-------------|----------|
| Defer to Phase 5+ | ASCII-only words, no dead-key handling | Y |
| Handle accents now | Implement dead-key support in Phase 4 | |

**User's choice:** [auto] Defer to Phase 5+ (recommended default)
**Notes:** STATE.md blocker acknowledged. Keeps scope manageable.

---

## Mode Selection UI

| Option | Description | Selected |
|--------|-------------|----------|
| Two big buttons on menu | Letter mode and word mode as visually distinct buttons | Y |
| Dropdown/toggle selector | Single control to switch modes | |
| Separate menu screens | Each mode has its own start screen | |

**User's choice:** [auto] Two big buttons on menu (recommended default)
**Notes:** Simple, accessible for 5-year-old who cannot read. Visual cues (icons) alongside text.

### Mode persistence

| Option | Description | Selected |
|--------|-------------|----------|
| No persistence in Phase 4 | Choose each time from menu | Y |
| LocalStorage mode preference | Remember last chosen mode | |

**User's choice:** [auto] No persistence in Phase 4 (recommended default)
**Notes:** Profiles (Phase 6) will handle persistence.

---

## Session Summary Screen

| Option | Description | Selected |
|--------|-------------|----------|
| Accuracy + items + time | Per GAME-07: accuracy%, items practiced, time played | Y |
| Detailed per-letter/word breakdown | Show which items were missed | |
| Minimal (just score) | Only show the hit count | |

**User's choice:** [auto] Accuracy + items + time (recommended default)
**Notes:** Matches GAME-07 requirement exactly. Encouraging tone preserved.

### Summary actions

| Option | Description | Selected |
|--------|-------------|----------|
| Replay same mode + Menu | "Rejouer" replays current mode, "Menu" returns to selection | Y |
| Replay + Switch mode + Menu | Three buttons including mode switch | |

**User's choice:** [auto] Replay same mode + Menu (recommended default)
**Notes:** Two buttons keeps it simple. Mode switching done via menu.

---

## Claude's Discretion

- Exact word list content (specific words, count per category)
- Visual design of mode selection buttons
- SplitBitmapText vs multiple BitmapText for per-character tint
- Internal code organization of mode-specific logic
- Exact word fall speed value
- Timer display format on summary screen

## Deferred Ideas

- Accented character support -- requires dead-key handling
- Word difficulty by letter frequency/phonetics -- Phase 5
- Category-based word lists (animals, colors) -- future enhancement
- Combo/streak bonuses -- Phase 7
- Sound effects for word completion -- Phase 9
