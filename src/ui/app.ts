import { AudioEngine } from '../audio/engine'
import { Music, type TrackId } from '../audio/music'
import { Sfx } from '../audio/sfx'
import { Voice } from '../audio/voice'
import { campaign } from '../content/campaign'
import { setLang } from '../core/i18n'
import { Background } from '../render/background'
import { MenuScene } from '../render/menu-scene'
import { Stage } from '../render/stage'
import type { Profile, Settings } from '../state/profile'
import { openStore, type Store } from '../state/storage'
import { h } from './dom'

export interface Screen {
  el: HTMLElement
  /** 'menu' draws drifting aliens; 'game' lets the screen draw itself. */
  scene: 'menu' | 'game'
  music?: TrackId
  /** World whose theme paints the background. */
  world?: number
  update?(dt: number): void
  draw?(ctx: CanvasRenderingContext2D, w: number, h: number): void
  onKey?(e: KeyboardEvent): void
  leave?(): void
}

export class App {
  readonly store: Store
  readonly audio = new AudioEngine()
  readonly sfx = new Sfx(this.audio)
  readonly music = new Music(this.audio)
  readonly voice = new Voice()
  readonly stage: Stage
  readonly background = new Background()
  readonly menuScene = new MenuScene()
  profile: Profile | null = null
  private screen: Screen | null = null
  private last = 0
  private lastHover = 0
  private modals: (() => void)[] = []
  /** Phone or tablet: finger is the main pointer and nothing mouse-like is attached. */
  readonly touchDevice =
    typeof window !== 'undefined' &&
    window.matchMedia('(pointer: coarse)').matches &&
    !window.matchMedia('(any-pointer: fine)').matches
  private physicalKeyboard = false

  constructor(
    canvas: HTMLCanvasElement,
    readonly root: HTMLElement,
  ) {
    this.stage = new Stage(canvas)
    this.store = openStore(safeLocalStorage(), navigator.language)
    this.applySettings()
    window.addEventListener('keydown', (e) => this.onKey(e))
    root.addEventListener('pointerover', (e) => {
      const target = e.target instanceof Element ? e.target.closest('button') : null
      if (target && !target.disabled && performance.now() - this.lastHover > 60) {
        this.lastHover = performance.now()
        this.sfx.hover()
      }
    })
    root.addEventListener('click', (e) => {
      this.unlockAudio()
      const target = e.target instanceof Element ? e.target.closest('button') : null
      if (target && !target.disabled) this.sfx.click()
    })
    requestAnimationFrame((t) => this.loop(t))
  }

  /** Touch controls replace the keyboard until a real key is pressed. */
  get touchMode(): boolean {
    return this.touchDevice && !this.physicalKeyboard
  }

  get settings(): Settings {
    return this.store.data.settings
  }

  save(): void {
    this.store.save()
  }

  applySettings(): void {
    const s = this.settings
    setLang(s.lang)
    this.audio.setVolumes(s.music, s.sfx)
    this.voice.enabled = s.voice !== 'off'
    this.voice.volume = s.voiceVolume
  }

  selectProfile(profile: Profile): void {
    this.profile = profile
    this.store.data.lastProfileId = profile.id
    this.save()
  }

  unlockAudio(): void {
    this.audio.unlock()
    const track = this.screen?.music
    if (track && this.music.current !== track) this.music.play(track)
  }

  go(screen: Screen): void {
    this.screen?.leave?.()
    this.screen = screen
    this.modals = []
    this.root.replaceChildren(screen.el)
    const worlds = campaign(this.settings.layout)
    const theme = worlds[screen.world ?? 0]?.theme ?? worlds[0]?.theme
    if (theme) this.background.setTheme(theme)
    if (screen.music && this.audio.ctx) this.music.play(screen.music)
  }

  /** Shows a modal on top of the current screen; returns a close function. */
  modal(content: HTMLElement, onClose?: () => void): () => void {
    const overlay = h('div', { class: 'overlay' }, content)
    const close = (): void => {
      if (!overlay.isConnected) return
      overlay.remove()
      this.modals = this.modals.filter((m) => m !== close)
      onClose?.()
    }
    this.modals.push(close)
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close()
    })
    this.root.append(overlay)
    return close
  }

  private onKey(e: KeyboardEvent): void {
    const typing = e.target instanceof HTMLInputElement
    if (!typing && /^[a-zA-Z]$/.test(e.key)) this.physicalKeyboard = true
    if (
      !typing &&
      (e.key === ' ' || e.key === 'Backspace' || e.key === "'" || e.key === '/' || e.key === 'Tab')
    ) {
      e.preventDefault()
    }
    this.unlockAudio()
    // An open modal owns the keyboard: Escape closes it, nothing reaches the screen.
    const top = this.modals.at(-1)
    if (top) {
      if (e.key === 'Escape') top()
      return
    }
    this.screen?.onKey?.(e)
  }

  private loop(now: number): void {
    const dtMs = this.last ? now - this.last : 16
    this.last = now
    const dt = Math.min(0.05, dtMs / 1000)
    this.stage.reportFrame(dtMs)
    const { ctx, w, h: height } = this.stage
    this.stage.begin()
    this.background.resize(w, height)
    this.background.update(dt)
    this.background.draw(ctx)
    const screen = this.screen
    screen?.update?.(dt)
    if (screen?.scene === 'game' && screen.draw) {
      screen.draw(ctx, w, height)
    } else {
      this.menuScene.update(dt)
      this.menuScene.draw(ctx, w, height)
    }
    requestAnimationFrame((t) => this.loop(t))
  }
}

function safeLocalStorage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}
