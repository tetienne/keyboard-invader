---
phase: 1
slug: project-scaffolding-dev-tooling
status: draft
shadcn_initialized: false
preset: none
created: 2026-03-29
---

# Phase 1 — UI Design Contract

> Visual and interaction contract for the scaffolding phase. The only visual deliverable is a PixiJS canvas test page rendering the game title as BitmapText (D-16). This spec establishes foundational design tokens in Tailwind @theme that all subsequent phases inherit.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (Vanilla TypeScript, no React) |
| Preset | not applicable |
| Component library | none (PixiJS for canvas, Tailwind for future UI screens) |
| Icon library | none (not needed in Phase 1) |
| Font | System font stack for UI; Arial BitmapFont for PixiJS canvas |

**Note:** shadcn is not applicable -- the project uses Vanilla TypeScript with no framework (D-05). Tailwind CSS v4 handles styling for non-game screens starting in later phases.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, inline padding |
| sm | 8px | Compact element spacing |
| md | 16px | Default element spacing |
| lg | 24px | Section padding |
| xl | 32px | Layout gaps |
| 2xl | 48px | Major section breaks |
| 3xl | 64px | Page-level spacing |

Exceptions: none

**Phase 1 usage:** Only `md` (16px) is actively used -- padding around the game container in index.html. The full scale is declared in Tailwind @theme so subsequent phases inherit it without redefinition.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 (regular) | 1.5 |
| Label | 14px | 600 (semibold) | 1.4 |
| Heading | 24px | 600 (semibold) | 1.2 |
| Display | 48px | 600 (semibold) | 1.1 |

**Phase 1 usage:** The PixiJS BitmapText title renders at 48px (Display role) using a BitmapFont installed from Arial at weight 400 (BitmapFont does not support variable weights). The Tailwind @theme declares the full type scale for later phases.

**Canvas BitmapFont spec:**
- Font family: Arial (system font, zero download)
- Font size: 48px
- Fill color: #ffffff (white on dark background)

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | #1a1a2e | Canvas background, page background |
| Secondary (30%) | #16213e | Future card surfaces, nav regions |
| Accent (10%) | #e94560 | Primary CTA buttons, active indicators, score highlights |
| Destructive | #dc2626 | Destructive actions only (none in Phase 1) |

Accent reserved for: primary action buttons (future "Jouer" CTA), active navigation state, score counter highlight, level-up indicator. Never used for passive text or borders.

**Phase 1 usage:** Only `#1a1a2e` is actively rendered -- as the PixiJS `Application` background color and the HTML body background. The full palette is declared in Tailwind @theme for later phases.

**Tailwind @theme block (to be placed in src/style.css):**

```css
@import 'tailwindcss';

@theme {
  --color-dominant: #1a1a2e;
  --color-secondary: #16213e;
  --color-accent: #e94560;
  --color-destructive: #dc2626;
  --color-text-primary: #ffffff;
  --color-text-muted: #a0aec0;

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;
  --spacing-3xl: 64px;

  --font-size-body: 16px;
  --font-size-label: 14px;
  --font-size-heading: 24px;
  --font-size-display: 48px;
}
```

---

## Copywriting Contract

| Element | Copy |
|---------|------|
| Primary CTA | not applicable (no interactive UI in Phase 1) |
| Empty state heading | not applicable |
| Empty state body | not applicable |
| Error state | not applicable |
| Destructive confirmation | not applicable |

**Phase 1 visible text (canvas only):**

| Element | Copy (fr) | Copy (en) |
|---------|-----------|-----------|
| Game title (BitmapText) | Keyboard Invader | Keyboard Invader |
| i18n placeholder: app.title | Keyboard Invader | Keyboard Invader |
| i18n placeholder: app.subtitle | Apprends a taper en t'amusant ! | Learn to type while having fun! |
| i18n placeholder: menu.play | Jouer | Play |
| i18n placeholder: menu.profiles | Profils | Profiles |
| i18n placeholder: menu.settings | Reglages | Settings |

The i18n keys above are placeholders in fr.json/en.json (D-14). Only `app.title` is rendered in Phase 1 via the PixiJS BitmapText test page.

---

## Canvas Test Page Layout (D-16)

The sole visual deliverable of Phase 1:

```
+--------------------------------------------------+
|                                                  |
|                                                  |
|                                                  |
|            "Keyboard Invader"                    |
|            (BitmapText, 48px, white,             |
|             centered horizontally                |
|             and vertically)                      |
|                                                  |
|                                                  |
|                                                  |
+--------------------------------------------------+
  Background: #1a1a2e
  Canvas: resizeTo window (full viewport)
```

**Interaction:** None. The canvas test page is static -- no input handling, no animations, no state transitions.

**HTML structure:**
- `body` background: `#1a1a2e` (prevents white flash before PixiJS init)
- `#game-container` div: full viewport, no padding
- PixiJS canvas appended to `#game-container`

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable |

No third-party registries. No component blocks. Phase 1 has no component dependencies beyond PixiJS core.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
