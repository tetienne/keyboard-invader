import { TAU } from '../core/math'
import { glowSprite } from './art'

export type ParticleKind = 'spark' | 'glow' | 'star' | 'confetti' | 'ring' | 'debris'

interface Particle {
  kind: ParticleKind
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  rot: number
  vr: number
  drag: number
  gravity: number
}

const MAX_PARTICLES = 1800

export class Particles {
  private list: Particle[] = []

  get count(): number {
    return this.list.length
  }

  clear(): void {
    this.list = []
  }

  add(p: Partial<Particle> & { x: number; y: number; kind: ParticleKind; color: string }): void {
    if (this.list.length >= MAX_PARTICLES) this.list.shift()
    const life = p.life ?? 0.6
    this.list.push({
      vx: 0,
      vy: 0,
      size: 4,
      rot: Math.random() * TAU,
      vr: 0,
      drag: 2,
      gravity: 0,
      ...p,
      life,
      maxLife: life,
    })
  }

  burst(
    x: number,
    y: number,
    color: string,
    count: number,
    speed: number,
    kind: ParticleKind = 'spark',
    size = 3,
  ): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * TAU
      const v = speed * (0.35 + Math.random() * 0.65)
      this.add({
        kind,
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        color,
        size: size * (0.6 + Math.random() * 0.8),
        life: 0.35 + Math.random() * 0.45,
        vr: (Math.random() - 0.5) * 12,
        drag: kind === 'confetti' ? 1.2 : 2.6,
        gravity: kind === 'confetti' || kind === 'debris' ? 380 : 0,
      })
    }
  }

  explosion(x: number, y: number, colors: readonly string[], scale: number): void {
    const main = colors[0] ?? '#ffffff'
    this.add({ kind: 'glow', x, y, color: main, size: 90 * scale, life: 0.3, drag: 0 })
    this.add({
      kind: 'ring',
      x,
      y,
      color: '#ffffff',
      size: 10 * scale,
      vx: 260 * scale,
      life: 0.4,
      drag: 0,
    })
    this.add({
      kind: 'ring',
      x,
      y,
      color: main,
      size: 6 * scale,
      vx: 160 * scale,
      life: 0.55,
      drag: 0,
    })
    for (const c of colors)
      this.burst(x, y, c, Math.round(10 * scale), 520 * scale, 'spark', 3 * scale)
    this.burst(x, y, main, Math.round(9 * scale), 300 * scale, 'debris', 5 * scale)
    this.burst(x, y, '#fff6c2', Math.round(4 * scale), 240 * scale, 'star', 7 * scale)
  }

  confetti(x: number, y: number, count: number, spread = 600): void {
    const colors = ['#ff5fa2', '#ffe066', '#7be07b', '#5fd4ff', '#c985ff', '#ffae57']
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2
      const v = spread * (0.4 + Math.random() * 0.6)
      this.add({
        kind: 'confetti',
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v,
        color: colors[i % colors.length] ?? '#ffffff',
        size: 5 + Math.random() * 5,
        life: 1.4 + Math.random() * 1.2,
        vr: (Math.random() - 0.5) * 14,
        drag: 1.4,
        gravity: 420,
      })
    }
  }

  update(dt: number): void {
    const list = this.list
    let w = 0
    for (const p of list) {
      p.life -= dt
      if (p.life <= 0) continue
      const damp = Math.exp(-p.drag * dt)
      p.vx *= damp
      p.vy = p.vy * damp + p.gravity * dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.rot += p.vr * dt
      if (p.kind === 'ring') p.size += p.vx * dt
      list[w++] = p
    }
    list.length = w
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    for (const p of this.list) {
      const k = p.life / p.maxLife
      switch (p.kind) {
        case 'glow': {
          ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha = k * k
          const s = p.size * (1.4 - k * 0.4)
          ctx.drawImage(glowSprite(p.color), p.x - s, p.y - s, s * 2, s * 2)
          break
        }
        case 'spark': {
          ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha = Math.min(1, k * 1.5)
          ctx.strokeStyle = p.color
          ctx.lineWidth = p.size * k + 0.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04)
          ctx.stroke()
          break
        }
        case 'ring': {
          ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha = k
          ctx.strokeStyle = p.color
          ctx.lineWidth = 4 * k + 1
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(0, p.size), 0, TAU)
          ctx.stroke()
          break
        }
        case 'star': {
          ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha = Math.min(1, k * 2)
          ctx.fillStyle = p.color
          drawStar(ctx, p.x, p.y, p.size * (0.5 + k * 0.5), p.rot)
          break
        }
        case 'confetti': {
          ctx.globalCompositeOperation = 'source-over'
          ctx.globalAlpha = Math.min(1, k * 3)
          ctx.fillStyle = p.color
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.scale(1, Math.abs(Math.cos(p.rot * 1.7)) + 0.15)
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
          ctx.restore()
          break
        }
        case 'debris': {
          ctx.globalCompositeOperation = 'source-over'
          ctx.globalAlpha = Math.min(1, k * 2)
          ctx.fillStyle = p.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * (0.4 + 0.6 * k), 0, TAU)
          ctx.fill()
          break
        }
      }
    }
    ctx.restore()
  }
}

export function drawStar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot = 0,
): void {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 === 0 ? r : r * 0.45
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
  ctx.fill()
}
