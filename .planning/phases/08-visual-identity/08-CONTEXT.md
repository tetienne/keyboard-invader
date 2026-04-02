# Phase 8: Visual Identity - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

The game transforms from programmer-art (plain BitmapText + Graphics primitives) into a cohesive cartoon space-invader visual identity that appeals to children ages 5-8. This includes: themed alien characters carrying letters, SVG avatar art replacing placeholders, destruction/hit visual effects, an animated starfield background, a defender spaceship, consistent color palette, rounded bubbly typography, and 60fps rendering validation. Menus and UI elements get full space-theme treatment.

</domain>

<decisions>
## Implementation Decisions

### Art Style & Theme
- **D-01:** Space invaders theme. Letters fall from space as alien invaders. Starry animated background, space-themed decorations throughout.
- **D-02:** Falling letters are carried by **cute alien creatures** (round, blobby style -- soft shapes, big eyes, no sharp edges). Each letter sits on/in an alien that reacts when hit.
- **D-03:** **6-8 different alien creature designs** that rotate randomly when spawning. Enough variety for visual interest.
- **D-04:** Aliens have **subtle idle animations** while falling: gentle bobbing/floating motion + occasional blink. Uses existing tween system.
- **D-05:** **Animated starfield background** with slowly scrolling stars and subtle parallax layers. Maybe a planet or moon in the corner.
- **D-06:** **Full space theme on all menu screens** (profile select, results, main menu): star backgrounds, alien decorations, themed buttons. Consistent immersion.
- **D-07:** Word mode aliens are **visually distinct from letter mode aliens**: bigger, possibly multi-eyed or multi-armed, showing the player it's a harder challenge.

### Avatar & Character Art
- **D-08:** Avatars are a **mix of kid characters and alien characters**, all drawn in the same round/blobby style for visual consistency.
- **D-09:** Avatar split across 6 slots (per Phase 7): **2 kids + 1 alien free, 1 kid + 2 aliens locked** (unlocked at levels 3, 5, 8).
- **D-10:** Replace current Graphics primitive avatar placeholders with proper **SVG character art**.
- **D-11:** Add **space-themed cosmetic level titles**: e.g., "Cadet", "Pilote", "Capitaine", "Commandant", etc. Displayed on profile and level-up celebration.

### Destruction & Hit Effects
- **D-12:** Correct hit: alien does a **funny surprised face**, then **pops into colorful star/sparkle particles** that scatter outward. Extends the existing celebration particle system.
- **D-13:** Wrong key (miss): targeted alien does a **quick dodge or cheeky taunt animation** (tongue out, wobble). Playful, not punitive.
- **D-14:** Letter reaching bottom: **alien escapes with animation** (waves goodbye or zips off the bottom with a trail). Playful, not punitive, consistent with Phase 3's philosophy.
- **D-15:** **Subtle background shift** as difficulty increases: stars get brighter, nebula shifts hue. Non-distracting but noticeable over time.
- **D-16:** Level-up celebration gets **space-themed upgrade**: replace generic circle particles with stars, rockets, planet confetti. Brief "warp speed" star streak effect.
- **D-17:** A **small defender spaceship** at the bottom of the screen that visually "shoots" when the kid types correctly. Gives a visual anchor for where the action originates.

### Color Palette & Typography
- **D-18:** Background shifts from dark navy (#1a1a2e) to **deep purple/indigo space**. Still dark but more playful and less serious.
- **D-19:** **Rounded/bubbly game font** (Fredoka, Baloo, or similar) replacing Arial BitmapFont. Matches the blobby art style. Requires BitmapFont generation at proper resolution.
- **D-20:** **Redesigned 8-color letter palette** harmonized with the deep purple background and blobby alien style. Ensure good contrast.
- **D-21:** UI elements (buttons, panels, XP bar, score) get **rounded corners with subtle glow/neon-ish borders**. Sci-fi control panel feel for kids.

### Visual Quality Fix
- **D-22:** Fix current **blurriness in fonts and graphics** as part of the overhaul. Proper resolution scaling for BitmapFont generation, SVG assets for crispness, PixiJS resolution settings verified.

### Claude's Discretion
- Exact alien creature designs (shapes, eye styles, color assignments)
- Specific SVG implementation details (inline vs file-loaded, complexity level)
- Exact star/particle counts and animation timings
- Defender spaceship design and "shoot" animation specifics
- Exact color hex values for the new palette (within the deep purple + bright accents direction)
- Parallax layer count and scroll speeds for starfield
- BitmapFont choice (Fredoka vs Baloo vs other rounded font)
- Exact level title names (within the space-themed direction)
- Performance optimization decisions (sprite sheets, batching, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Game Engine & Rendering
- `src/game/types.ts` -- GameContext interface, entity types, state definitions
- `src/game/game.ts` -- Game class, object pool wiring, context implementation
- `src/game/letters.ts` -- LetterEntity rendering, LETTER_COLORS palette, BitmapText 80px
- `src/game/words.ts` -- Word rendering with SplitBitmapText, per-character tint
- `src/game/pool.ts` -- ObjectPool<T> generic class (extend for effect particles)
- `src/game/canvas.ts` -- computeScale, BASE_WIDTH (1280), BASE_HEIGHT (720)
- `src/game/tween.ts` -- Tween system (extend for idle animations, hit/miss reactions)

### State Machine & Screens
- `src/game/states.ts` -- All state classes (PlayingState, GameOverState, MenuState, etc.)
- `src/game/profile-state.ts` -- ProfileState UI with avatar rendering
- `src/game/celebration.ts` -- CelebrationOverlay with 40 particles (upgrade to space theme)
- `src/game/xp-bar.ts` -- XpBar class with rounded pill graphics

### Avatar System
- `src/avatars/definitions.ts` -- AvatarDefinition interface + AVATARS array (replace with SVG art)
- `src/avatars/renderer.ts` -- drawAvatar() function (rewrite for SVG rendering)

### Difficulty (visual feedback integration)
- `src/game/difficulty.ts` -- DifficultyManager (read current difficulty level for background shift)

### Prior Phase Context
- `.planning/phases/02-game-engine-foundation/02-CONTEXT.md` -- D-13: pool effects in Phase 8
- `.planning/phases/03-letter-mode-gameplay/03-CONTEXT.md` -- Letter rendering decisions, feedback philosophy
- `.planning/phases/05-adaptive-difficulty/05-CONTEXT.md` -- Difficulty visual feedback deferred here
- `.planning/phases/06-profiles-local-persistence/06-CONTEXT.md` -- D-04: avatar placeholders to replace
- `.planning/phases/07-progression-system/07-CONTEXT.md` -- Celebration system, level titles deferred, locked avatars

### i18n
- `src/shared/i18n/fr.json` -- French translations (add level title strings)
- `src/shared/i18n/en.json` -- English translations (add level title strings)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Tween system** (`src/game/tween.ts`): Hit/miss/bottom tweens. Extend for idle bobbing, dodge/taunt reactions, escape animations.
- **Object pool** (`src/game/pool.ts`): Generic pool. Extend for star burst particles on destruction.
- **Celebration overlay** (`src/game/celebration.ts`): 40 particles with gravity physics. Upgrade to space-themed particles (stars, rockets).
- **XP bar** (`src/game/xp-bar.ts`): Rounded pill shape. Update styling to match new palette + glow borders.
- **Avatar renderer** (`src/avatars/renderer.ts`): drawAvatar() using Graphics primitives. Rewrite for SVG.
- **i18n system** (`src/shared/i18n/index.ts`): t() function for level title strings.

### Established Patterns
- **BitmapText for all text**: GameFont installed in BootState. Replace with rounded font, generate at higher resolution.
- **Container hierarchy**: Parent-child scene graph. Aliens will be Containers holding sprite + BitmapText children.
- **State lifecycle**: enter/exit/update/render on all states. Visual overhaul touches render() methods.
- **Color constants**: LETTER_COLORS in letters.ts. Centralize into a theme constants file.

### Integration Points
- **letters.ts / words.ts**: Refactor entity rendering to use alien sprite containers instead of bare BitmapText.
- **PlayingState**: Add defender spaceship, animated starfield background, difficulty-based background shift.
- **GameOverState / MenuState / ProfileState**: Full space-theme reskin.
- **BootState**: Load SVG assets, generate new BitmapFont, initialize starfield.

</code_context>

<specifics>
## Specific Ideas

- Round, blobby alien style (think Slime Rancher / Cut the Rope): soft shapes, big eyes, approachable for 5-year-olds
- Aliens show personality: funny face on hit, dodge/taunt on miss, wave goodbye when escaping bottom
- Defender spaceship at bottom gives kids a sense of agency ("I'm the pilot")
- Deep purple space background is warmer and more playful than pure dark navy
- Sci-fi glow borders on UI panels evoke a kid-friendly control panel feel
- Fix blurriness as a quality baseline before layering new art on top

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 08-visual-identity*
*Context gathered: 2026-04-02*
