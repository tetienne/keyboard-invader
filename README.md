# Keyboard Invader

A fun typing game for children ages 5-8. Letters and words fall from the top of the screen -- type them to destroy the invaders! The game adapts to each child's skill level.

## Development

### Prerequisites

- [mise](https://mise.jdx.dev/) for tool management

### Setup

```bash
mise install          # Installs Node.js 24 LTS + prek
pnpm install          # Installs dependencies
prek install --hook-type pre-commit --hook-type commit-msg   # Sets up git hooks
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests |
| `pnpm lint` | Lint with ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm typecheck` | TypeScript type check |

## License

MIT
