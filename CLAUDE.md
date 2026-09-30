## Project

**Keyboard Invader**

Application web ludique style "typing invaders" pour apprendre la dactylographie aux enfants. Des mots et lettres tombent du haut de l'ecran, l'enfant tape pour les eliminer. Le jeu s'adapte au niveau de chaque enfant avec un systeme de progression (XP, niveaux, personnages a debloquer).

**Core Value:** Rendre l'apprentissage du clavier amusant et non frustrant pour des enfants de 5 a 8 ans, avec une difficulte qui s'adapte automatiquement a leur niveau.

### Constraints

- **Hosting**: Plateforme gratuite (static hosting) -- pas de budget serveur
- **No backend**: Tout cote client, Firebase uniquement pour la persistence cloud optionnelle
- **Accessibilite**: Doit fonctionner sur tous les navigateurs modernes
- **Performance**: Animations fluides meme sur machines modestes (laptops d'enfants)
- **Securite enfants**: Aucune donnee personnelle collectee, pas de chat, pas de liens externes

## Technology Stack

- **TypeScript (strict) + Vite** – no UI framework.
- **Canvas 2D** for the game: procedural cartoon art (`src/render/art.ts`), particles,
  parallax starfield. No image assets.
- **DOM + plain CSS** (`src/ui/styles.css`) for menus and HUD.
- **Web Audio API** for synthesised sound effects and chiptune music; **Speech
  Synthesis** reads letters aloud. No audio files.
- **localStorage** for profiles (versioned, sanitised on load). Firebase sync is not
  implemented.
- **Vitest** for unit tests, **ESLint** (typescript-eslint strict) and **Prettier**.
- Deployed as static files on Cloudflare (`wrangler.toml`).

## Architecture

- `src/game/session.ts` – pure, deterministic game simulation (spawning, targeting,
  combo, shield, bosses, power-ups, adaptive pace). Emits `GameEvent`s; knows nothing
  about rendering. Inject an `Rng` for tests.
- `src/render/game-view.ts` – draws a `Session` and turns its events into effects.
- `src/ui/screens/game.ts` – glues session + view + audio + HUD for one game.
- `src/content/campaign.ts` – levels are generated from keyboard layout rows
  (column index = finger), so AZERTY and QWERTY share the same lesson plan.
- `src/game/progression.ts` – stars, coins, XP, unlocks, daily gift, shop.
- `src/ui/app.ts` – screen router, main loop, audio unlock, modals.

## Conventions

- Keep `game/`, `state/` and `content/` free of DOM access so they stay testable.
- Every user-facing string goes through `t()` in `src/core/i18n.ts` (fr + en).
- Words must be plain a-z (no accents) so each letter is one key on any layout.
- Run `pnpm lint && pnpm typecheck && pnpm test` before committing.
