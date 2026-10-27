import type { WorldTheme } from '../content/campaign'
import { WORLD_THEMES } from '../content/campaign'
import { approach, clamp, easeOutCubic, lerp, TAU } from '../core/math'
import { createRng } from '../core/rng'
import { glowSprite, shade } from './art'

interface Star {
  x: number
  y: number
  depth: number
  size: number
  twinkle: number
  color: string
}

interface Shooting {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

interface Mote {
  x: number
  y: number
  /** 0..1, picks size, speed and orbit. */
  size: number
  phase: number
}

const STAR_COLORS = ['#ffffff', '#ffffff', '#cfe8ff', '#ffe9f5', '#fff4c9']
const MOTES = 36

/** Deep-space backdrop: painted nebula, parallax starfield, planet and warp effect. */
export class Background {
  /** 0 = cruising, 1 = full hyperspace streaks. */
  warp = 0
  /** Travel transition progress (0 = off): the planet grows from the centre into its spot. */
  travel = 0
  /** Lets a screen paint its own planets instead. */
  showPlanet = true
  private motes: Mote[] = []
  private warpTarget = 0
  private stars: Star[] = []
  private shooting: Shooting[] = []
  private nebula: HTMLCanvasElement | null = null
  private planet: HTMLCanvasElement | null = null
  private theme: WorldTheme = WORLD_THEMES[0] as WorldTheme
  private w = 0
  private h = 0
  private time = 0
  private scroll = 0

  constructor() {
    const rng = createRng(7)
    for (let i = 0; i < 260; i++) {
      const depth =
        i < 170 ? 0.15 + rng() * 0.25 : i < 235 ? 0.45 + rng() * 0.25 : 0.8 + rng() * 0.2
      this.stars.push({
        x: rng(),
        y: rng(),
        depth,
        size: 0.6 + depth * 1.8 * (0.6 + rng() * 0.6),
        twinkle: rng() * TAU,
        color: STAR_COLORS[Math.floor(rng() * STAR_COLORS.length)] ?? '#ffffff',
      })
    }
    for (let i = 0; i < MOTES; i++) {
      this.motes.push({ x: rng(), y: rng(), size: rng(), phase: rng() * TAU })
    }
  }

  setTheme(theme: WorldTheme): void {
    if (theme === this.theme && this.nebula) return
    this.theme = theme
    this.paint()
  }

  resize(w: number, h: number): void {
    if (w === this.w && h === this.h) return
    this.w = w
    this.h = h
    this.paint()
  }

  /** Hyperspace jump: streaks ramp up then settle. */
  jump(): void {
    this.warp = 1
    this.warpTarget = 0
  }

  setWarp(target: number): void {
    this.warpTarget = target
  }

  update(dt: number): void {
    this.time += dt
    this.warp = approach(this.warp, this.warpTarget, 1.6, dt)
    this.scroll += dt * (0.012 + this.warp * 0.9)
    if (Math.random() < dt * 0.12 && this.shooting.length < 2) {
      this.shooting.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h * 0.4,
        vx: -(300 + Math.random() * 300),
        vy: 160 + Math.random() * 120,
        life: 1,
      })
    }
    for (const s of this.shooting) {
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.life -= dt * 0.9
    }
    this.shooting = this.shooting.filter((s) => s.life > 0)
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const { w, h } = this
    if (this.nebula) {
      const drift = Math.sin(this.time * 0.05) * 20
      ctx.drawImage(this.nebula, -30 + drift, -30, w + 60, h + 60)
    } else {
      ctx.fillStyle = this.theme.nebula[0]
      ctx.fillRect(0, 0, w, h)
    }
    if (this.planet && this.showPlanet) {
      const pw = this.planet.width
      const ph = this.planet.height
      if (this.travel > 0) {
        const k = easeOutCubic(clamp((this.travel - 0.35) / 0.65, 0, 1))
        const s = lerp(0.04, 1, k)
        const x = lerp(w * 0.5, w * 0.78, k)
        const y = lerp(h * 0.42, this.planetY, k)
        if (k > 0) ctx.drawImage(this.planet, x - (pw * s) / 2, y - (ph * s) / 2, pw * s, ph * s)
      } else {
        ctx.globalAlpha = 1 - this.warp * 0.6
        ctx.drawImage(this.planet, w * 0.78 - pw / 2, this.planetY + this.warp * 80 - ph / 2)
        ctx.globalAlpha = 1
      }
    }

    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const warp = this.warp
    for (const s of this.stars) {
      const y = (((s.y + this.scroll * s.depth * 2) % 1) + 1) % 1
      const px = s.x * w
      const py = y * h
      const tw = 0.55 + 0.45 * Math.sin(this.time * (1.5 + s.depth * 2) + s.twinkle)
      ctx.globalAlpha = Math.min(1, (0.35 + s.depth * 0.65) * tw + warp * 0.4)
      ctx.fillStyle = s.color
      if (warp > 0.05) {
        const len = warp * 120 * s.depth + s.size
        ctx.fillRect(px - s.size / 2, py - len, s.size, len)
      } else {
        ctx.fillRect(px - s.size / 2, py - s.size / 2, s.size, s.size)
      }
      if (s.depth > 0.85) {
        const g = s.size * 6
        ctx.globalAlpha *= 0.35
        ctx.drawImage(glowSprite(this.theme.nebula[2]), px - g, py - g, g * 2, g * 2)
      }
    }
    for (const s of this.shooting) {
      ctx.globalAlpha = s.life
      const grad = ctx.createLinearGradient(s.x, s.y, s.x - s.vx * 0.25, s.y - s.vy * 0.25)
      grad.addColorStop(0, '#ffffff')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.strokeStyle = grad
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x - s.vx * 0.25, s.y - s.vy * 0.25)
      ctx.stroke()
    }
    ctx.restore()
    const calm = 1 - Math.max(this.warp, this.travel > 0 ? 1 : 0)
    if (calm > 0.05) this.drawAmbient(ctx, calm)
  }

  private get planetY(): number {
    return this.h * 0.62 + Math.sin(this.time * 0.1) * 6
  }

  /** Faint world particles (petals, bubbles, snow...), kept dim so letters stay readable. */
  private drawAmbient(ctx: CanvasRenderingContext2D, alpha: number): void {
    const { w, h, time } = this
    const wrap = (v: number): number => ((v % 1) + 1) % 1
    ctx.save()
    for (const m of this.motes) {
      const speed = 0.6 + m.size * 0.8
      const sway = Math.sin(time * 0.7 + m.phase) * 0.02
      switch (this.theme.style) {
        case 'meadow': {
          const x = wrap(m.x + sway) * w
          const y = wrap(m.y + time * 0.02 * speed) * h
          ctx.globalAlpha = 0.3 * alpha
          ctx.fillStyle = m.size > 0.5 ? '#ffb3d1' : '#fff2a8'
          ctx.beginPath()
          ctx.ellipse(x, y, 3 + m.size * 3, 1.6 + m.size * 1.5, time * speed + m.phase, 0, TAU)
          ctx.fill()
          break
        }
        case 'bubbles': {
          const x = wrap(m.x + sway) * w
          const y = wrap(m.y - time * 0.025 * speed) * h
          const r = 3 + m.size * 7
          ctx.globalAlpha = 0.28 * alpha
          ctx.strokeStyle = '#aef4ff'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.arc(x, y, r, 0, TAU)
          ctx.stroke()
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(x - r * 0.45, y - r * 0.45, 2, 2)
          break
        }
        case 'ice': {
          const x = wrap(m.x + sway * 1.5) * w
          const y = wrap(m.y + time * 0.035 * speed) * h
          const r = 1.2 + m.size * 2.2
          ctx.globalAlpha = 0.5 * alpha
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(x, y, r, 0, TAU)
          ctx.fill()
          break
        }
        case 'desert': {
          const x = wrap(m.x + time * 0.18 * speed) * (w + 80) - 80
          const y = wrap(m.y + Math.sin(time * 0.3 + m.phase) * 0.01) * h
          ctx.globalAlpha = 0.3 * alpha * (0.6 + 0.4 * Math.sin(time * 0.8 + m.phase))
          ctx.fillStyle = '#ffd9a0'
          ctx.fillRect(x, y, 24 + m.size * 40, 2)
          break
        }
        case 'jungle': {
          const x = wrap(m.x + Math.sin(time * 0.3 * speed + m.phase) * 0.04) * w
          const y = wrap(m.y + Math.cos(time * 0.25 * speed + m.phase * 1.3) * 0.04) * h
          const g = 8 + m.size * 10
          ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha =
            (0.08 + 0.22 * (0.5 + 0.5 * Math.sin(time * 2 * speed + m.phase))) * alpha
          ctx.drawImage(glowSprite('#d9ff6a'), x - g, y - g, g * 2, g * 2)
          break
        }
        case 'void': {
          // Accretion disk: dots orbiting the black hole planet, inner ones faster.
          const R = Math.min(w, h) * 0.21 * (1.15 + m.size * 1.3)
          const a = m.phase + (time * 0.35) / (0.5 + m.size)
          const x = w * 0.78 + Math.cos(a) * R
          const y = this.planetY + Math.sin(a) * R * 0.28
          ctx.globalCompositeOperation = 'lighter'
          ctx.globalAlpha = 0.45 * alpha
          ctx.fillStyle = m.size > 0.5 ? '#c985ff' : '#ff4d6d'
          ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
          break
        }
      }
    }
    ctx.restore()
  }

  private paint(): void {
    if (this.w === 0 || typeof document === 'undefined') return
    this.nebula = paintNebula(this.theme, Math.ceil(this.w / 3), Math.ceil(this.h / 3))
    this.planet = paintPlanet(this.theme, Math.round(Math.min(this.w, this.h) * 0.42))
  }
}

function paintNebula(theme: WorldTheme, w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')
  if (!g) return c
  const [deep, mid, hi] = theme.nebula
  const base = g.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, shade(deep, -0.3))
  base.addColorStop(0.6, deep)
  base.addColorStop(1, shade(mid, -0.5))
  g.fillStyle = base
  g.fillRect(0, 0, w, h)
  const rng = createRng(w * 31 + h + theme.accent.length)
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 26; i++) {
    const x = rng() * w
    const y = rng() * h * 0.9
    const r = (0.15 + rng() * 0.4) * Math.max(w, h)
    const color = i % 3 === 0 ? hi : mid
    const grad = g.createRadialGradient(x, y, 0, x, y, r)
    grad.addColorStop(0, hexA(color, i % 3 === 0 ? 0.13 : 0.2))
    grad.addColorStop(1, hexA(color, 0))
    g.fillStyle = grad
    g.fillRect(0, 0, w, h)
  }
  g.globalCompositeOperation = 'source-over'
  const vignette = g.createRadialGradient(
    w / 2,
    h / 2,
    Math.min(w, h) * 0.3,
    w / 2,
    h / 2,
    Math.max(w, h) * 0.75,
  )
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)')
  g.fillStyle = vignette
  g.fillRect(0, 0, w, h)
  return c
}

export function paintPlanet(theme: WorldTheme, size: number): HTMLCanvasElement {
  const pad = size * 0.5
  const c = document.createElement('canvas')
  c.width = c.height = Math.round(size + pad * 2)
  const g = c.getContext('2d')
  if (!g) return c
  const cx = c.width / 2
  const cy = c.height / 2
  const r = size / 2
  const { base, shade: dark, glow, ring } = theme.planet

  const atmo = g.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.5)
  atmo.addColorStop(0, hexA(glow, 0.35))
  atmo.addColorStop(1, hexA(glow, 0))
  g.fillStyle = atmo
  g.fillRect(0, 0, c.width, c.height)

  const drawRing = (front: boolean): void => {
    g.save()
    g.translate(cx, cy)
    g.rotate(-0.35)
    g.scale(1, 0.28)
    g.beginPath()
    g.arc(0, 0, r * 1.65, front ? 0 : Math.PI, front ? Math.PI : TAU)
    g.lineWidth = r * 0.5
    g.strokeStyle = hexA(glow, 0.35)
    g.stroke()
    g.lineWidth = r * 0.12
    g.strokeStyle = hexA('#ffffff', 0.35)
    g.stroke()
    g.restore()
  }
  if (ring) drawRing(false)

  const body = g.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.1, cx, cy, r)
  body.addColorStop(0, shade(base, 0.35))
  body.addColorStop(0.55, base)
  body.addColorStop(1, dark)
  g.beginPath()
  g.arc(cx, cy, r, 0, TAU)
  g.fillStyle = body
  g.fill()

  g.save()
  g.clip()
  const rng = createRng(size)
  for (let i = 0; i < 6; i++) {
    g.fillStyle = hexA(dark, 0.18)
    g.beginPath()
    g.ellipse(
      cx + (rng() - 0.5) * r * 1.6,
      cy + (rng() - 0.5) * r * 1.6,
      r * (0.1 + rng() * 0.3),
      r * (0.05 + rng() * 0.1),
      rng() * 0.6,
      0,
      TAU,
    )
    g.fill()
  }
  const night = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r)
  night.addColorStop(0.45, 'rgba(0,0,0,0)')
  night.addColorStop(1, 'rgba(5,0,20,0.7)')
  g.fillStyle = night
  g.fillRect(cx - r, cy - r, r * 2, r * 2)
  g.restore()

  if (ring) drawRing(true)
  return c
}

/** "#rrggbb" + alpha -> rgba() string. */
export function hexA(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`
}
