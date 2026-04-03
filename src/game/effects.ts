import { Container, Graphics } from 'pixi.js'
import { SPACE_PALETTE } from './theme.js'

interface ActiveParticle {
  graphic: Graphics
  vx: number
  vy: number
  life: number
}

/**
 * Star particle burst effect on letter destruction.
 * Uses Graphics circles instead of ParticleContainer for simplicity
 * (ParticleContainer API changed significantly in PixiJS v8).
 */
export class DestructionEffect {
  private readonly container: Container
  private readonly particles: ActiveParticle[] = []

  constructor(parent: Container) {
    this.container = new Container()
    parent.addChild(this.container)
  }

  /** Spawn a burst of star particles at (x, y) with given color. */
  burst(x: number, y: number, color: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5
      const speed = 80 + Math.random() * 120

      const g = new Graphics()
      g.circle(0, 0, 3)
      g.fill(color)
      g.x = x
      g.y = y
      g.alpha = 1

      this.container.addChild(g)
      this.particles.push({
        graphic: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
      })
    }
  }

  /** Update particle positions and lifetimes. */
  update(dt: number): void {
    const ds = dt / 1000
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!
      p.graphic.x += p.vx * ds
      p.graphic.y += p.vy * ds
      p.life -= ds * 2
      p.graphic.alpha = Math.max(0, p.life)
      p.graphic.scale.set(Math.max(0.2, p.life))

      if (p.life <= 0) {
        this.container.removeChild(p.graphic)
        p.graphic.destroy()
        this.particles.splice(i, 1)
      }
    }
  }

  /** Remove all active particles. */
  clear(): void {
    for (const p of this.particles) {
      this.container.removeChild(p.graphic)
      p.graphic.destroy()
    }
    this.particles.length = 0
  }

  /** Expose particle count for testing. */
  get activeCount(): number {
    return this.particles.length
  }
}

/**
 * Laser bolt visual from defender to target.
 * Simple line that fades over 200ms.
 */
export class LaserBolt {
  private readonly parent: Container
  private bolt: Graphics | null = null
  private elapsed = 0
  private readonly DURATION = 200

  constructor(parent: Container) {
    this.parent = parent
  }

  /** Fire a bolt from (fromX, fromY) to (toX, toY). */
  fire(fromX: number, fromY: number, toX: number, toY: number): void {
    // Remove any existing bolt
    if (this.bolt) {
      this.parent.removeChild(this.bolt)
      this.bolt.destroy()
    }

    this.bolt = new Graphics()
    this.bolt.moveTo(fromX, fromY)
    this.bolt.lineTo(toX, toY)
    this.bolt.stroke({ color: SPACE_PALETTE.accent, width: 4 })
    this.bolt.alpha = 1
    this.elapsed = 0

    this.parent.addChild(this.bolt)
  }

  /** Update bolt fade. Returns true when bolt animation is complete. */
  update(dt: number): boolean {
    if (!this.bolt) return true

    this.elapsed += dt
    const t = Math.min(this.elapsed / this.DURATION, 1)
    this.bolt.alpha = 1 - t

    if (t >= 1) {
      this.parent.removeChild(this.bolt)
      this.bolt.destroy()
      this.bolt = null
      return true
    }

    return false
  }

  /** Whether a bolt is currently active. */
  get isActive(): boolean {
    return this.bolt !== null
  }
}
