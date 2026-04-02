import { BitmapText, Container, Graphics } from 'pixi.js'
import { BASE_WIDTH, BASE_HEIGHT } from './types.js'
import { t } from '../shared/i18n/index.js'

const CELEBRATION_COLORS = [
  0xff6b6b, 0x4ecdc4, 0xffe66d, 0xa78bfa, 0xfb923c, 0xf9a8d4,
]

interface Particle {
  graphic: Graphics
  vx: number
  vy: number
  life: number
  maxLife: number
}

export class CelebrationOverlay {
  readonly container: Container
  private particles: Particle[] = []
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

    // Spawn 40 particles
    for (let i = 0; i < 40; i++) {
      const g = new Graphics()
      const radius = 3 + Math.random() * 3
      const colorIdx = Math.floor(Math.random() * CELEBRATION_COLORS.length)
      const color = CELEBRATION_COLORS[colorIdx] ?? 0xffffff
      g.circle(0, 0, radius)
      g.fill(color)
      g.x = BASE_WIDTH / 2
      g.y = BASE_HEIGHT / 2

      const angle = Math.random() * Math.PI * 2
      const speed = 100 + Math.random() * 200

      this.particles.push({
        graphic: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 2.0,
      })
      this.container.addChild(g)
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

    // Particle physics
    for (const p of this.particles) {
      p.graphic.x += p.vx * ds
      p.graphic.y += p.vy * ds
      p.vy += 120 * ds
      p.life -= ds / p.maxLife
      p.graphic.alpha = Math.max(0, p.life)
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
