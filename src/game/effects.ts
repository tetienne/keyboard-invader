import { Container, Graphics } from 'pixi.js'

interface EffectParticle {
  graphic: Graphics
  vx: number
  vy: number
  life: number
}

export class DestructionEffect {
  private particles: EffectParticle[] = []
  private parent: Container

  constructor(parent: Container) {
    this.parent = parent
  }

  burst(x: number, y: number, color: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const g = new Graphics()
      const size = 2 + Math.random() * 3
      g.circle(0, 0, size)
      g.fill(color)
      g.x = x
      g.y = y

      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 160

      this.particles.push({
        graphic: g,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
      })
      this.parent.addChild(g)
    }
  }

  update(dt: number): void {
    const ds = dt / 1000
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]!
      p.graphic.x += p.vx * ds
      p.graphic.y += p.vy * ds
      p.vy += 200 * ds // gravity
      p.life -= ds * 1.5
      p.graphic.alpha = Math.max(0, p.life)

      if (p.life <= 0) {
        p.graphic.destroy()
        this.particles.splice(i, 1)
      }
    }
  }

  clear(): void {
    for (const p of this.particles) {
      p.graphic.destroy()
    }
    this.particles = []
  }
}

export class LaserBolt {
  private parent: Container
  private bolt: Graphics | null = null
  private progress = 0
  private fromX = 0
  private fromY = 0
  private toX = 0
  private toY = 0
  private active = false
  private readonly DURATION = 150 // ms

  constructor(parent: Container) {
    this.parent = parent
  }

  fire(fromX: number, fromY: number, toX: number, toY: number): void {
    if (this.bolt) {
      this.bolt.destroy()
    }
    this.bolt = new Graphics()
    this.fromX = fromX
    this.fromY = fromY
    this.toX = toX
    this.toY = toY
    this.progress = 0
    this.active = true

    this.bolt.moveTo(fromX, fromY)
    this.bolt.lineTo(toX, toY)
    this.bolt.stroke({ color: 0x6b8bf5, width: 2, alpha: 0.9 })
    this.parent.addChild(this.bolt)
  }

  update(dt: number): boolean {
    if (!this.active || !this.bolt) return false
    this.progress += dt
    const t = Math.min(this.progress / this.DURATION, 1)
    this.bolt.alpha = 1 - t

    if (t >= 1) {
      this.bolt.destroy()
      this.bolt = null
      this.active = false
      return false
    }
    return true
  }
}
