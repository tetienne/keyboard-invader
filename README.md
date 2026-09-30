# Keyboard Invader

A space-invaders typing game that teaches children (ages 5–8) to type. Cute aliens
descend carrying letters or words; typing them fires the ship's laser. Levels follow
touch-typing pedagogy (home row first, one finger pair at a time), then move on to
words. Stars, coins, a ship hangar, trophies, a daily gift and an endless mode keep
kids coming back.

## Features

- **Adventure**: 6 worlds, 45 levels. Letter worlds teach the home, top and bottom
  rows finger by finger (AZERTY or QWERTY); word worlds use short, medium and long
  kid-friendly words (French or English). Every world ends with a boss mothership.
- **Endless mode**: waves that get faster, boss every 5 waves, high score per pilot.
- **Never punishing**: wrong keys only reset the combo; the shield has 5 hearts;
  speed adapts to the child in real time (faster when they are comfortable, slower
  after a miss); letters the child often misses come back more often.
- **Learning aids**: on-screen keyboard coloured by finger that highlights the next
  key, finger names on the briefing screen, optional voice reading letters aloud.
- **Rewards**: 1–3 stars per level, combo multiplier up to x5, golden aliens,
  power-ups (freeze, bomb, shield), coins to buy ships and lasers, 21 trophies,
  pilot XP and ranks, daily gift with streak bonus.
- **Profiles**: pick an avatar, no password, everything saved in `localStorage`.
- **Music**: a chiptune tune per world (plus menu and boss themes) that adds layers
  as the combo grows; a short build-up (heartbeat, rising bass, drum roll) announces
  each boss, and the boss theme speeds up when the boss is almost beaten.
- **Zero assets**: all art is drawn procedurally on a canvas, all sound effects and
  music are synthesised with the Web Audio API. No network calls, no tracking.

## Tech

Vanilla TypeScript + Vite, Canvas 2D for the game, DOM/CSS for menus, Web Audio for
sound, Speech Synthesis for the voice. The only runtime dependency is the bundled
Fredoka font.

```
src/
  core/      rng, math, i18n (fr/en)
  content/   keyboard layouts, campaign, words, ships
  game/      session (pure simulation), progression, trophies
  state/     profile model, versioned localStorage save
  audio/     engine, synthesised sfx, step-sequencer music, voice
  render/    procedural art, particles, starfield, game view
  ui/        app shell, screens, on-screen keyboard
```

`game/` and `state/` are free of DOM code and covered by unit tests.

## Development

Prerequisites: [mise](https://mise.jdx.dev/) (installs Node.js + pnpm + prek).

```bash
mise install
pnpm install
prek install --hook-type pre-commit --hook-type commit-msg
```

| Command          | Description               |
| ---------------- | ------------------------- |
| `pnpm dev`       | Start dev server          |
| `pnpm build`     | Typecheck + build to dist |
| `pnpm test`      | Run unit tests            |
| `pnpm lint`      | ESLint                    |
| `pnpm format`    | Prettier                  |
| `pnpm typecheck` | TypeScript                |

Pushes to `main` deploy `dist/` to Cloudflare Workers static assets at
https://invader.etienne.pw (see
`.github/workflows/ci.yml` and `wrangler.toml`).

## License

MIT
