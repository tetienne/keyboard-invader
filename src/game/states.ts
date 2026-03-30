import { BitmapFont, BitmapText, Container, Graphics } from 'pixi.js'
import type { GameState, StateName, GameContext } from './types.js'
import { TRANSITIONS, BASE_WIDTH, BASE_HEIGHT } from './types.js'

export class StateMachine {
  private states: Map<StateName, GameState>
  private _current: StateName | null = null

  constructor(states: Record<StateName, GameState>) {
    this.states = new Map(Object.entries(states) as [StateName, GameState][])
  }

  get current(): StateName | null {
    return this._current
  }

  get currentState(): GameState | undefined {
    return this._current ? this.states.get(this._current) : undefined
  }

  start(initial: StateName, ctx: GameContext): void {
    this._current = initial
    this.states.get(initial)?.enter(ctx)
  }

  transition(target: StateName, ctx: GameContext): void {
    if (this._current === null) {
      throw new Error('StateMachine not started')
    }

    const allowed = TRANSITIONS[this._current]
    if (!allowed.includes(target)) {
      throw new Error(
        `Invalid transition: ${this._current} -> ${target}. Allowed: ${allowed.join(', ')}`,
      )
    }

    const oldState = this.states.get(this._current)
    oldState?.exit(ctx)

    this._current = target
    const newState = this.states.get(target)
    newState?.enter(ctx)
  }

  update(ctx: GameContext, dt: number): void {
    this.currentState?.update(ctx, dt)
  }

  render(ctx: GameContext): void {
    this.currentState?.render(ctx)
  }
}

// --- Concrete State Classes ---

/**
 * Boot state: installs BitmapFont and transitions to menu immediately.
 */
export class BootState implements GameState {
  enter(ctx: GameContext): void {
    try {
      BitmapFont.install({
        name: 'GameFont',
        style: {
          fontFamily: 'Arial',
          fontSize: 48,
          fill: '#ffffff',
        },
      })
    } catch {
      // Font install may fail in test environments without canvas
    }
    ctx.transitionTo('menu')
  }

  exit(): void {
    // no-op
  }

  update(): void {
    // no-op
  }

  render(): void {
    // no-op
  }
}

/**
 * Menu state: shows game title and interactive "Jouer" button.
 */
export class MenuState implements GameState {
  private title: BitmapText | null = null
  private button: BitmapText | null = null

  enter(ctx: GameContext): void {
    this.title = new BitmapText({
      text: 'Keyboard Invader',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    this.title.x = BASE_WIDTH / 2 - this.title.width / 2
    this.title.y = BASE_HEIGHT * 0.35

    this.button = new BitmapText({
      text: 'Jouer',
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    this.button.x = BASE_WIDTH / 2 - this.button.width / 2
    this.button.y = BASE_HEIGHT * 0.55
    this.button.eventMode = 'static'
    this.button.cursor = 'pointer'

    this.button.on('pointerover', () => {
      if (this.button) this.button.scale.set(1.1)
    })
    this.button.on('pointerout', () => {
      if (this.button) this.button.scale.set(1.0)
    })
    this.button.on('pointertap', () => {
      ctx.transitionTo('playing')
    })

    ctx.gameRoot.addChild(this.title)
    ctx.gameRoot.addChild(this.button)
  }

  exit(ctx: GameContext): void {
    if (this.title) {
      ctx.gameRoot.removeChild(this.title)
      this.title.destroy()
      this.title = null
    }
    if (this.button) {
      ctx.gameRoot.removeChild(this.button)
      this.button.destroy()
      this.button = null
    }
  }

  update(): void {
    // Menu is static
  }

  render(): void {
    // no-op
  }
}

/**
 * Playing state: spawns falling placeholder rectangles destroyed by any keypress.
 */
export class PlayingState implements GameState {
  private spawnTimer = 0
  private totalSpawned = 0
  private activeItems: { item: Graphics; index: number }[] = []
  private readonly maxSpawns = 10
  private readonly spawnIntervalMs = 1000
  private readonly fallSpeed = 120 // px/sec

  enter(): void {
    this.spawnTimer = 0
    this.totalSpawned = 0
    this.activeItems = []
  }

  update(ctx: GameContext, dt: number): void {
    // Spawn logic
    this.spawnTimer += dt
    while (
      this.spawnTimer >= this.spawnIntervalMs &&
      this.totalSpawned < this.maxSpawns
    ) {
      this.spawnTimer -= this.spawnIntervalMs
      const { item, index } = ctx.acquirePoolItem()
      const gfx = item as Graphics
      gfx.x = Math.random() * (BASE_WIDTH - 40)
      gfx.y = -40
      gfx.visible = true
      ctx.gameRoot.addChild(gfx)
      this.activeItems.push({ item: gfx, index })
      this.totalSpawned++
    }

    // Move active items down
    const dtSec = dt / 1000
    for (const entry of this.activeItems) {
      entry.item.y += this.fallSpeed * dtSec
    }

    // Process input: destroy the lowest (highest y) active item per keypress
    const keys = ctx.getInputBuffer()
    for (const _key of keys) {
      if (this.activeItems.length === 0) break
      // Find item with highest y (lowest on screen)
      let maxIdx = 0
      for (let i = 1; i < this.activeItems.length; i++) {
        const current = this.activeItems[i]
        const best = this.activeItems[maxIdx]
        if (current && best && current.item.y > best.item.y) {
          maxIdx = i
        }
      }
      const entry = this.activeItems[maxIdx]
      if (entry) {
        entry.item.visible = false
        ctx.gameRoot.removeChild(entry.item)
        ctx.releasePoolItem(entry.index)
        this.activeItems.splice(maxIdx, 1)
      }
    }

    // Remove items that fell below canvas
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const entry = this.activeItems[i]
      if (entry && entry.item.y > BASE_HEIGHT) {
        entry.item.visible = false
        ctx.gameRoot.removeChild(entry.item)
        ctx.releasePoolItem(entry.index)
        this.activeItems.splice(i, 1)
      }
    }

    // Check if all spawned and all cleared
    if (this.totalSpawned >= this.maxSpawns && this.activeItems.length === 0) {
      ctx.transitionTo('menu')
    }
  }

  render(): void {
    // PixiJS auto-renders scene graph
  }

  exit(ctx: GameContext): void {
    for (const entry of this.activeItems) {
      entry.item.visible = false
      ctx.gameRoot.removeChild(entry.item)
      ctx.releasePoolItem(entry.index)
    }
    this.activeItems = []
    this.spawnTimer = 0
    this.totalSpawned = 0
  }
}

/**
 * Paused state: shows semi-transparent overlay with "PAUSE" text.
 */
export class PausedState implements GameState {
  private overlay: Container | null = null

  enter(ctx: GameContext): void {
    this.overlay = new Container()

    const bg = new Graphics()
    bg.rect(0, 0, BASE_WIDTH, BASE_HEIGHT)
    bg.fill({ color: 0x000000, alpha: 0.5 })
    this.overlay.addChild(bg)

    const text = new BitmapText({
      text: 'PAUSE',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    text.x = BASE_WIDTH / 2 - text.width / 2
    text.y = BASE_HEIGHT / 2 - text.height / 2
    this.overlay.addChild(text)

    ctx.gameRoot.addChild(this.overlay)
  }

  exit(ctx: GameContext): void {
    if (this.overlay) {
      ctx.gameRoot.removeChild(this.overlay)
      this.overlay.destroy({ children: true })
      this.overlay = null
    }
  }

  update(): void {
    // no-op
  }

  render(): void {
    // no-op
  }
}
