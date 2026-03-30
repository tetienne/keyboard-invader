import { BitmapFont, BitmapText, Container, Graphics } from 'pixi.js'
import type { GameState, StateName, GameContext } from './types.js'
import { TRANSITIONS, BASE_WIDTH, BASE_HEIGHT } from './types.js'
import {
  getAvailableLetters,
  findLowestMatch,
  findLowestEntity,
  LETTER_COLORS,
} from './letters.js'
import type { LetterEntity } from './letters.js'
import {
  updateTween,
  createHitTween,
  createMissTween,
  createBottomTween,
} from './tween.js'

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
 * Playing state: spawns falling BitmapText letters matched by correct keypress.
 * D-01 through D-15 from 03-CONTEXT.md.
 */
export class PlayingState implements GameState {
  private spawnTimer = 0
  private totalSpawned = 0
  private activeEntities: LetterEntity[] = []
  private hits = 0
  private misses = 0
  private scoreText: BitmapText | null = null
  private readonly SESSION_LENGTH = 20 // D-11: fixed letter count
  private readonly SPAWN_INTERVAL_MS = 1500 // D-05: constant spawn rate (gentle)
  private readonly FALL_SPEED = 80 // D-05: constant fall speed (gentle for 5yo)

  enter(ctx: GameContext): void {
    this.spawnTimer = 0
    this.totalSpawned = 0
    this.activeEntities = []
    this.hits = 0
    this.misses = 0

    // D-10: score counter at top-right
    this.scoreText = new BitmapText({
      text: 'Score: 0',
      style: { fontFamily: 'GameFont', fontSize: 24 },
    })
    this.scoreText.x = BASE_WIDTH - 200
    this.scoreText.y = 20
    ctx.gameRoot.addChild(this.scoreText)
  }

  update(ctx: GameContext, dt: number): void {
    // --- Spawn logic ---
    this.spawnTimer += dt
    while (
      this.spawnTimer >= this.SPAWN_INTERVAL_MS &&
      this.totalSpawned < this.SESSION_LENGTH
    ) {
      this.spawnTimer -= this.SPAWN_INTERVAL_MS

      // D-04: progressive letter pool
      const available = getAvailableLetters(
        this.totalSpawned,
        this.SESSION_LENGTH,
      )
      const letter =
        available[Math.floor(Math.random() * available.length)] ?? 'a'

      const { item, index } = ctx.acquirePoolItem()
      const bt = item as BitmapText

      // Pitfall 2: reset ALL properties on reused pool item
      bt.text = letter.toUpperCase()
      const colorIdx = Math.floor(Math.random() * LETTER_COLORS.length)
      bt.tint = LETTER_COLORS[colorIdx] ?? 0xffffff
      bt.scale.set(1)
      bt.alpha = 1
      bt.anchor.set(0.5)
      bt.x = 80 + Math.random() * (BASE_WIDTH - 160)
      bt.y = -40
      bt.visible = true

      ctx.gameRoot.addChild(bt)
      this.activeEntities.push({
        text: bt,
        poolIndex: index,
        letter, // lowercase for matching
        baseX: bt.x,
        originalTint: bt.tint,
        tween: null,
        markedForRemoval: false,
      })
      this.totalSpawned++
    }

    // --- Fall logic ---
    const dtSec = dt / 1000
    for (const entity of this.activeEntities) {
      if (entity.tween === null && !entity.markedForRemoval) {
        entity.text.y += this.FALL_SPEED * dtSec
      }
    }

    // --- Input processing (D-13, D-14, D-15) ---
    const keys = ctx.getInputBuffer()
    for (const key of keys) {
      const match = findLowestMatch(this.activeEntities, key)
      if (match) {
        this.hits++
        match.tween = createHitTween()
        match.markedForRemoval = true
      } else {
        this.misses++
        // D-08: red flash on lowest letter
        const lowest = findLowestEntity(this.activeEntities)
        if (lowest?.tween === null) {
          lowest.tween = createMissTween()
        }
      }
    }

    // --- Update score display (D-10) ---
    if (this.scoreText) {
      this.scoreText.text = 'Score: ' + String(this.hits)
    }

    // --- Tween updates ---
    for (const entity of this.activeEntities) {
      if (entity.tween !== null) {
        const done = updateTween(entity, dt)
        if (done) {
          if (entity.tween.type === 'miss') {
            // Restore visual after miss feedback
            entity.text.tint = entity.originalTint
            entity.text.x = entity.baseX
            entity.tween = null
          } else {
            // hit or bottom: tween complete, null it for cleanup pass
            entity.tween = null
          }
        }
      }
    }

    // --- Bottom detection (D-09) ---
    for (const entity of this.activeEntities) {
      if (
        entity.tween === null &&
        !entity.markedForRemoval &&
        entity.text.y > BASE_HEIGHT + 40
      ) {
        entity.tween = createBottomTween()
        entity.markedForRemoval = true
      }
    }

    // --- Cleanup pass (Pitfall 3: reverse iteration) ---
    for (let i = this.activeEntities.length - 1; i >= 0; i--) {
      const entity = this.activeEntities[i]
      if (entity?.markedForRemoval && entity.tween === null) {
        entity.text.visible = false
        ctx.gameRoot.removeChild(entity.text)
        ctx.releasePoolItem(entity.poolIndex)
        this.activeEntities.splice(i, 1)
      }
    }

    // --- Session end check (D-11) ---
    if (
      this.totalSpawned >= this.SESSION_LENGTH &&
      this.activeEntities.length === 0
    ) {
      ctx.setSessionResult({
        hits: this.hits,
        misses: this.misses,
        total: this.SESSION_LENGTH,
      })
      ctx.transitionTo('gameover')
    }
  }

  render(): void {
    // PixiJS auto-renders scene graph
  }

  exit(ctx: GameContext): void {
    // Release all remaining active entities
    for (const entity of this.activeEntities) {
      entity.text.visible = false
      ctx.gameRoot.removeChild(entity.text)
      ctx.releasePoolItem(entity.poolIndex)
    }
    this.activeEntities = []

    // Remove score text
    if (this.scoreText) {
      ctx.gameRoot.removeChild(this.scoreText)
      this.scoreText.destroy()
      this.scoreText = null
    }

    this.spawnTimer = 0
    this.totalSpawned = 0
    this.hits = 0
    this.misses = 0
  }
}

/**
 * Game over / results state: shows session stats and replay button (D-12, D-16).
 */
export class GameOverState implements GameState {
  private container: Container | null = null

  enter(ctx: GameContext): void {
    const result = ctx.getSessionResult()
    this.container = new Container()

    // Title -- encouraging "Bravo !" text
    const title = new BitmapText({
      text: 'Bravo !',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    title.anchor.set(0.5)
    title.x = BASE_WIDTH / 2
    title.y = BASE_HEIGHT * 0.2

    // Stats display
    const hits = result?.hits ?? 0
    const misses = result?.misses ?? 0
    const total = result?.total ?? 0
    const accuracy = total > 0 ? Math.round((hits / total) * 100) : 0

    const statsText = new BitmapText({
      text: `${String(hits)} touches  |  ${String(misses)} rates  |  ${String(accuracy)}% precision`,
      style: { fontFamily: 'GameFont', fontSize: 20 },
    })
    statsText.anchor.set(0.5)
    statsText.x = BASE_WIDTH / 2
    statsText.y = BASE_HEIGHT * 0.45

    // "Rejouer" button (D-12)
    const replayBtn = new BitmapText({
      text: 'Rejouer',
      style: { fontFamily: 'GameFont', fontSize: 28 },
    })
    replayBtn.anchor.set(0.5)
    replayBtn.x = BASE_WIDTH / 2
    replayBtn.y = BASE_HEIGHT * 0.65
    replayBtn.eventMode = 'static'
    replayBtn.cursor = 'pointer'
    replayBtn.on('pointerover', () => {
      replayBtn.scale.set(1.1)
    })
    replayBtn.on('pointerout', () => {
      replayBtn.scale.set(1.0)
    })
    replayBtn.on('pointertap', () => {
      ctx.transitionTo('playing')
    })

    // "Menu" button
    const menuBtn = new BitmapText({
      text: 'Menu',
      style: { fontFamily: 'GameFont', fontSize: 20 },
    })
    menuBtn.anchor.set(0.5)
    menuBtn.x = BASE_WIDTH / 2
    menuBtn.y = BASE_HEIGHT * 0.78
    menuBtn.eventMode = 'static'
    menuBtn.cursor = 'pointer'
    menuBtn.on('pointerover', () => {
      menuBtn.scale.set(1.1)
    })
    menuBtn.on('pointerout', () => {
      menuBtn.scale.set(1.0)
    })
    menuBtn.on('pointertap', () => {
      ctx.transitionTo('menu')
    })

    this.container.addChild(title, statsText, replayBtn, menuBtn)
    ctx.gameRoot.addChild(this.container)
  }

  exit(ctx: GameContext): void {
    if (this.container) {
      ctx.gameRoot.removeChild(this.container)
      this.container.destroy({ children: true })
      this.container = null
    }
  }

  update(): void {
    /* static screen */
  }

  render(): void {
    /* no-op */
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
