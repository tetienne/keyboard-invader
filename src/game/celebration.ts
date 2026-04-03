import { Assets, BitmapText, Container, Graphics, Sprite } from 'pixi.js'
import type { Texture } from 'pixi.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import { LETTER_COLORS, STAR_PARTICLE_PATH } from './theme.js'
import { t } from '../shared/i18n/index.js'

interface Particle {
  sprite: Sprite
  vx: number
  vy: number
  life: number
  maxLife: number
}

interface WarpLine {
  graphic: Graphics
  life: number
}

export class CelebrationOverlay {
  readonly container: Container
  private particles: Particle[] = []
  private warpLines: WarpLine[] = []
  private levelText: BitmapText
  private backdrop: Graphics
  private elapsed = 0
  private readonly DURATION = 2500
  private scalePhase = 0
  private done = false

  constructor(level: number) {
    this.container = new Container()

    // Semi-transparent backdrop
    this.backdrop = new Graphics()
    this.backdrop.rect(0, 0, BASE_WIDTH, BASE_HEIGHT)
    this.backdrop.fill({ color: 0x000000, alpha: 0.6 })
    this.container.addChild(this.backdrop)

    // Level-up text
    const text = t('progression.levelUp').replace('{level}', String(level))
    this.levelText = new BitmapText({
      text,
      style: { fontFamily: 'GameFont', fontSize: 48 },
    })
    this.levelText.tint = 0xe94560
    this.levelText.anchor.set(0.5)
    this.levelText.x = BASE_WIDTH / 2
    this.levelText.y = BASE_HEIGHT / 2
    this.levelText.scale.set(0)
    this.container.addChild(this.levelText)

    // Warp speed lines (first 200ms visual)
    for (let i = 0; i < 20; i++) {
      const g = new Graphics()
      const angle = Math.random() * Math.PI * 2
      const len = 40 + Math.random() * 80
      const cx = BASE_WIDTH / 2
      const cy = BASE_HEIGHT / 2
      const startR = 20 + Math.random() * 40
      const sx = cx + Math.cos(angle) * startR
      const sy = cy + Math.sin(angle) * startR
      const ex = cx + Math.cos(angle) * (startR + len)
      const ey = cy + Math.sin(angle) * (startR + len)

      g.moveTo(sx, sy)
      g.lineTo(ex, ey)
      g.stroke({ color: 0xffffff, width: 1, alpha: 0.8 })

      this.warpLines.push({ graphic: g, life: 1.0 })
      this.container.addChild(g)
    }

    // Spawn 40 star particles
    const starTexture = Assets.get<Texture>(STAR_PARTICLE_PATH)
    for (let i = 0; i < 40; i++) {
      const sprite = new Sprite(starTexture)
      sprite.width = 8 + Math.random() * 8
      sprite.height = sprite.width
      sprite.anchor.set(0.5)
      const colorIdx = Math.floor(Math.random() * LETTER_COLORS.length)
      sprite.tint = LETTER_COLORS[colorIdx] ?? 0xffffff
      sprite.x = BASE_WIDTH / 2
      sprite.y = BASE_HEIGHT / 2

      const angle = Math.random() * Math.PI * 2
      const speed = 100 + Math.random() * 200

      this.particles.push({
        sprite,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 2.0,
      })
      this.container.addChild(sprite)
    }
  }

  /** Update the celebration. Returns true when fully complete. */
  update(dt: number): boolean {
    if (this.done) return true

    const ds = dt / 1000
    this.elapsed += dt

    // Scale bounce animation (0-600ms)
    if (this.scalePhase < 600) {
      this.scalePhase = Math.min(this.scalePhase + dt, 600)
      const t = this.scalePhase / 600
      let scale: number
      if (t < 0.6) {
        scale = (t / 0.6) * 1.3
      } else {
        scale = 1.3 - 0.3 * ((t - 0.6) / 0.4)
      }
      this.levelText.scale.set(scale)
    }

    // Warp lines fade (first 200ms)
    for (const wl of this.warpLines) {
      wl.life -= ds * 5 // fade over ~200ms
      wl.graphic.alpha = Math.max(0, wl.life)
    }

    // Star particle physics
    for (const p of this.particles) {
      p.sprite.x += p.vx * ds
      p.sprite.y += p.vy * ds
      p.vy += 120 * ds
      p.life -= ds / p.maxLife
      p.sprite.alpha = Math.max(0, p.life)
      p.sprite.rotation += ds * 2
    }

    // Auto-dismiss
    if (this.elapsed >= this.DURATION) {
      this.done = true
      return true
    }

    return false
  }

  destroy(): void {
    this.container.destroy({ children: true })
  }
}
