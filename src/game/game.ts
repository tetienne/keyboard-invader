import { Application, Container, Graphics, GraphicsContext } from 'pixi.js'
import type { GameContext, StateName } from './types.js'
import {
  StateMachine,
  BootState,
  MenuState,
  PlayingState,
  PausedState,
} from './states.js'
import { GameLoop } from './loop.js'
import { InputManager } from './input.js'
import { ObjectPool } from './pool.js'
import { setupCanvas } from './canvas.js'
import { DebugOverlay } from './debug.js'

export class Game implements GameContext {
  readonly app: Application
  readonly gameRoot: Container
  private readonly _stateMachine: StateMachine
  private readonly _loop: GameLoop
  private readonly _input: InputManager
  private readonly _pool: ObjectPool<Graphics>
  private readonly _debug: DebugOverlay
  private _cleanupCanvas: (() => void) | null = null
  private _cleanupVisibility: (() => void) | null = null

  constructor() {
    this.app = new Application()
    this.gameRoot = new Container()

    // Create shared GraphicsContext for pooled rectangles (Pattern 6 from RESEARCH)
    const rectContext = new GraphicsContext().rect(0, 0, 40, 40).fill(0xe94560)

    this._pool = new ObjectPool(() => new Graphics(rectContext), 20)
    this._input = new InputManager()
    this._debug = new DebugOverlay()
    this._loop = new GameLoop()

    this._stateMachine = new StateMachine({
      boot: new BootState(),
      menu: new MenuState(),
      playing: new PlayingState(),
      paused: new PausedState(),
    })
  }

  async start(): Promise<void> {
    // PixiJS v8 async init (Pitfall 4 from RESEARCH)
    await this.app.init({
      background: '#1a1a2e',
      width: window.innerWidth,
      height: window.innerHeight,
      // Do NOT use resizeTo: window (breaks letterboxing)
    })

    const container = document.getElementById('game-container')
    if (!container) throw new Error('game-container element not found')
    container.appendChild(this.app.canvas)

    // Setup letterboxed canvas (D-14, D-15)
    this.app.stage.addChild(this.gameRoot)
    this._cleanupCanvas = setupCanvas(this.app, this.gameRoot)

    // Setup input (D-11)
    this._input.attach()

    // Setup visibility/blur handlers (D-16, D-17)
    this._setupVisibilityHandlers()

    // Setup F3 debug toggle (D-18)
    this._setupDebugToggle()

    // Wire game loop (D-01)
    this._loop.onUpdate = (dt) => {
      this._stateMachine.update(this, dt)
    }
    this._loop.onRender = () => {
      this._stateMachine.render(this)
      this._debug.update(
        this.app.ticker.FPS,
        this._stateMachine.current ?? 'none',
        this._pool.activeCount,
        this._pool.totalCount,
      )
    }

    this.app.ticker.add((ticker) => {
      this._loop.accumulate(ticker.elapsedMS)
      this._loop.tick()
    })

    // Start state machine at 'boot' (auto-transitions to menu)
    this._stateMachine.start('boot', this)
  }

  // --- GameContext implementation ---
  transitionTo(state: StateName): void {
    this._stateMachine.transition(state, this)
  }

  getInputBuffer(): string[] {
    return this._input.drain()
  }

  acquirePoolItem(): { item: Graphics; index: number } {
    return this._pool.acquire()
  }

  releasePoolItem(index: number): void {
    this._pool.release(index)
  }

  get poolActiveCount(): number {
    return this._pool.activeCount
  }

  get poolTotalCount(): number {
    return this._pool.totalCount
  }

  get currentStateName(): StateName {
    return this._stateMachine.current ?? 'boot'
  }

  private _setupVisibilityHandlers(): void {
    const onBlur = (): void => {
      if (this._stateMachine.current === 'playing') {
        this._stateMachine.transition('paused', this)
      }
    }
    const onFocus = (): void => {
      if (this._stateMachine.current === 'paused') {
        this._loop.resetAccumulator() // D-16: no catch-up burst
        this._stateMachine.transition('playing', this)
      }
    }
    const onVisChange = (): void => {
      if (document.hidden) {
        onBlur()
      } else {
        onFocus()
      }
    }
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisChange)
    this._cleanupVisibility = () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisChange)
    }
  }

  private _setupDebugToggle(): void {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'F3') {
        e.preventDefault()
        this._debug.toggle()
      }
    })
  }

  destroy(): void {
    this._cleanupCanvas?.()
    this._cleanupVisibility?.()
    this._input.detach()
    this._debug.destroy()
    this.app.destroy(true)
  }
}
