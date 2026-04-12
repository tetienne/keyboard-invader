import { Application, Assets, BitmapText, Container, Graphics, Texture } from 'pixi.js'
import type { GameContext, GameMode, SessionResult, SessionSaveResult, StateName } from './types.js'
import type { DifficultyParams } from './difficulty.js'
import type { ProfileData } from '../persistence/types.js'
import type { ProfileRepository } from '../persistence/repository.js'
import { LocalStorageProfileRepository } from '../persistence/local-storage.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import {
  StateMachine,
  BootState,
  MenuState,
  PlayingState,
  PausedState,
  GameOverState,
} from './states.js'
import { ProfileState } from './profile-state.js'
import { GameLoop } from './loop.js'
import { InputManager } from './input.js'
import { ObjectPool } from './pool.js'
import { setupCanvas } from './canvas.js'
import { DebugOverlay } from './debug.js'
import { AlienContainer } from './alien-container.js'
import { ALIEN_TEXTURES_PATHS, WORD_ALIEN_TEXTURE_PATHS } from './theme.js'

/**
 * Safely retrieves a texture from the asset cache.
 * Assets.get() is typed as always returning T, but at runtime it returns
 * undefined if the asset has not been loaded yet.
 */
function safeGetTexture(path: string): Texture | undefined {
  return Assets.get<Texture>(path) as Texture | undefined
}

export class Game implements GameContext {
  readonly app: Application
  readonly gameRoot: Container
  private readonly _stateMachine: StateMachine
  private readonly _loop: GameLoop
  private readonly _input: InputManager
  private readonly _pool: ObjectPool<AlienContainer>
  private readonly _wordPool: ObjectPool<AlienContainer>
  private readonly _debug: DebugOverlay
  private _cleanupCanvas: (() => void) | null = null
  private _cleanupVisibility: (() => void) | null = null
  private _cleanupDebug: (() => void) | null = null
  private _sessionResult: SessionResult | null = null
  private _gameMode: GameMode = 'letters'
  private _pauseOverlay: Container | null = null
  private _isPaused = false
  private _currentDifficulty: DifficultyParams | null = null
  private _activeProfile: ProfileData | null = null
  private _sessionSaveResult: SessionSaveResult | null = null
  private readonly _profileRepo: ProfileRepository

  constructor() {
    this.app = new Application()
    this.gameRoot = new Container()

    // AlienContainer pool for falling letters (alien sprite + label)
    this._pool = new ObjectPool(() => {
      const paths = ALIEN_TEXTURES_PATHS
      const path = paths[Math.floor(Math.random() * paths.length)]
      const texture = path ? (safeGetTexture(path) ?? Texture.WHITE) : Texture.WHITE
      const alien = new AlienContainer(texture, 'A', 0xffffff)
      alien.visible = false
      return alien
    }, 20)
    // AlienContainer pool for falling words (alien sprite only — SplitBitmapText added at spawn)
    this._wordPool = new ObjectPool(() => {
      const paths = WORD_ALIEN_TEXTURE_PATHS
      const path = paths[Math.floor(Math.random() * paths.length)]
      const texture = path ? (safeGetTexture(path) ?? Texture.WHITE) : Texture.WHITE
      const alien = new AlienContainer(texture, '', 0xffffff)
      alien.letterLabel.visible = false
      alien.visible = false
      return alien
    }, 10)
    this._input = new InputManager()
    this._debug = new DebugOverlay()
    this._loop = new GameLoop()
    this._profileRepo = new LocalStorageProfileRepository()

    this._stateMachine = new StateMachine({
      boot: new BootState(),
      profiles: new ProfileState(),
      menu: new MenuState(),
      playing: new PlayingState(),
      paused: new PausedState(),
      gameover: new GameOverState(),
    })
  }

  async start(): Promise<void> {
    // PixiJS v8 async init (Pitfall 4 from RESEARCH)
    await this.app.init({
      background: '#1a1a3e',
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
        this._currentDifficulty,
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

  acquirePoolItem(): { item: AlienContainer; index: number } {
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

  setGameMode(mode: GameMode): void {
    this._gameMode = mode
  }

  getGameMode(): GameMode {
    return this._gameMode
  }

  acquireWordPoolItem(): { item: AlienContainer; index: number } {
    return this._wordPool.acquire()
  }

  releaseWordPoolItem(index: number): void {
    this._wordPool.release(index)
  }

  getDifficulty(): DifficultyParams | null {
    return this._currentDifficulty
  }

  setDifficulty(params: DifficultyParams | null): void {
    this._currentDifficulty = params
  }

  setActiveProfile(profile: ProfileData | null): void {
    this._activeProfile = profile
  }

  getActiveProfile(): ProfileData | null {
    return this._activeProfile
  }

  getProfileRepository(): ProfileRepository {
    return this._profileRepo
  }

  getSessionSaveResult(): SessionSaveResult | null {
    return this._sessionSaveResult
  }

  setSessionSaveResult(result: SessionSaveResult | null): void {
    this._sessionSaveResult = result
  }

  preallocatePools(): void {
    this._pool.preallocate()
    this._wordPool.preallocate()
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
    const onDebugKey = (e: KeyboardEvent): void => {
      if (e.key === 'F3') {
        e.preventDefault()
        this._debug.toggle()
      }
    }
    window.addEventListener('keydown', onDebugKey)
    this._cleanupDebug = () => {
      window.removeEventListener('keydown', onDebugKey)
    }
  }

  destroy(): void {
    this._cleanupCanvas?.()
    this._cleanupVisibility?.()
    this._cleanupDebug?.()
    this._input.detach()
    this._debug.destroy()
    this.app.destroy(true)
  }
}
