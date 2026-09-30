import { TAU } from '../core/math'
import { drawAlien, glowSprite, palette } from './art'
import { Particles } from './particles'

interface Floater {
  x: number
  y: number
  vx: number
  vy: number
  species: number
  palette: number
  size: number
  phase: number
}

/** Friendly aliens drifting behind the menus, plus a confetti layer for celebrations. */
export class MenuScene {
  readonly particles = new Particles()
  private floaters: Floater[] = []
  private time = 0

  constructor() {
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * TAU
      this.floaters.push({
        x: Math.random(),
        y: Math.random(),
        vx: Math.cos(a) * 0.012,
        vy: Math.sin(a) * 0.01,
        species: i % 6,
        palette: i,
        size: 0.6 + Math.random() * 0.7,
        phase: Math.random() * 10,
      })
    }
  }

  update(dt: number): void {
    this.time += dt
    for (const f of this.floaters) {
      f.x += f.vx * dt
      f.y += f.vy * dt
      if (f.x < -0.1) f.x = 1.1
      if (f.x > 1.1) f.x = -0.1
      if (f.y < -0.1) f.y = 1.1
      if (f.y > 1.1) f.y = -0.1
    }
    this.particles.update(dt)
  }

  draw(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    const unit = Math.min(w, h) * 0.035
    for (const f of this.floaters) {
      const x = f.x * w
      const y = f.y * h + Math.sin(this.time + f.phase) * 12
      const r = unit * f.size
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.sin(this.time * 0.7 + f.phase) * 0.25)
      ctx.globalAlpha = 0.25
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(glowSprite(palette(f.palette).body), -r * 3, -r * 3, r * 6, r * 6)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 0.9
      ctx.scale(r, r)
      drawAlien(ctx, f.species, palette(f.palette), {
        t: this.time + f.phase,
        lookX: Math.sin(this.time * 0.5 + f.phase),
        lookY: Math.cos(this.time * 0.4 + f.phase),
        scared: false,
        blink: (this.time + f.phase) % 4 < 0.12,
        flash: 0,
      })
      ctx.restore()
    }
    this.particles.draw(ctx)
  }
}
