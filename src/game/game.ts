import { Application, BitmapText, Container, Graphics } from 'pixi.js'
import type { GameContext, SessionResult, StateName } from './types.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import {
  StateMachine,
  BootState,
  MenuState,
  PlayingState,
  PausedState,
  GameOverState,
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
  private readonly _pool: ObjectPool<BitmapText>
  private readonly _debug: DebugOverlay
  private _cleanupCanvas: (() => void) | null = null
  private _cleanupVisibility: (() => void) | null = null
  private _sessionResult: SessionResult | null = null
  private _pauseOverlay: Container | null = null
  private _isPaused = false

  constructor() {
    this.app = new Application()
    this.gameRoot = new Container()

    // BitmapText pool for falling letters (D-01, D-02)
    this._pool = new ObjectPool(() => {
      const bt = new BitmapText({
        text: 'A',
        style: { fontFamily: 'GameFont', fontSize: 80 },
      })
      bt.anchor.set(0.5)
      bt.visible = false
      return bt
    }, 20)
    this._input = new InputManager()
    this._debug = new DebugOverlay()
    this._loop = new GameLoop()

    this._stateMachine = new StateMachine({
      boot: new BootState(),
      menu: new MenuState(),
      playing: new PlayingState(),
      paused: new PausedState(),
      gameover: new GameOverState(),
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

  acquirePoolItem(): { item: BitmapText; index: number } {
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

  setSessionResult(result: SessionResult): void {
    this._sessionResult = result
  }

  getSessionResult(): SessionResult | null {
    return this._sessionResult
  }

  private _showPauseOverlay(): void {
    if (this._pauseOverlay) return
    this._pauseOverlay = new Container()
    const bg = new Graphics()
    bg.rect(0, 0, BASE_WIDTH, BASE_HEIGHT)
    bg.fill({ color: 0x000000, alpha: 0.5 })
    this._pauseOverlay.addChild(bg)
    const text = new BitmapText({
      text: 'PAUSE',
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    text.x = BASE_WIDTH / 2 - text.width / 2
    text.y = BASE_HEIGHT / 2 - text.height / 2
    this._pauseOverlay.addChild(text)
    const hint = new BitmapText({
      text: 'Appuie sur Espace pour continuer',
      style: { fontFamily: 'GameFont', fontSize: 20 },
    })
    hint.x = BASE_WIDTH / 2 - hint.width / 2
    hint.y = BASE_HEIGHT / 2 + 40
    this._pauseOverlay.addChild(hint)
    this.gameRoot.addChild(this._pauseOverlay)
  }

  private _hidePauseOverlay(): void {
    if (this._pauseOverlay) {
      this.gameRoot.removeChild(this._pauseOverlay)
      this._pauseOverlay.destroy({ children: true })
      this._pauseOverlay = null
    }
  }

  private _pause(): void {
    if (this._isPaused || this._stateMachine.current !== 'playing') return
    this._isPaused = true
    this.app.ticker.stop()
    this._showPauseOverlay()
    // Force one render so the overlay is visible while ticker is stopped
    this.app.renderer.render(this.app.stage)
  }

  private _resume(): void {
    if (!this._isPaused) return
    // On focus return: keep overlay visible, force render so user sees it
    this.app.renderer.render(this.app.stage)
  }

  private _unpause(): void {
    if (!this._isPaused) return
    this._isPaused = false
    this._hidePauseOverlay()
    this._input.drain() // Clear any buffered keys from the unpause press
    this._loop.resetAccumulator()
    this.app.ticker.start()
  }

  private _setupVisibilityHandlers(): void {
    const onBlur = (): void => {
      this._pause()
    }
    const onFocus = (): void => {
      this._resume()
    }
    const onVisChange = (): void => {
      if (document.hidden) {
        this._pause()
      } else {
        this._resume()
      }
    }
    const onUnpauseKey = (e: KeyboardEvent): void => {
      if (this._isPaused && (e.key === ' ' || e.key === 'Enter')) {
        e.preventDefault()
        this._unpause()
      }
    }
    window.addEventListener('blur', onBlur)
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisChange)
    window.addEventListener('keydown', onUnpauseKey)
    this._cleanupVisibility = () => {
      window.removeEventListener('blur', onBlur)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisChange)
      window.removeEventListener('keydown', onUnpauseKey)
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
