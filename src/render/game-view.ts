import type { LaserDef, ShipDef } from '../content/ships'
import { approach, clamp, easeOutBack, lerp, TAU } from '../core/math'
import { t } from '../core/i18n'
import type { Enemy, GameEvent, Session } from '../game/session'
import {
  drawAlien,
  drawBoss,
  drawPowerup,
  drawShip,
  glowSprite,
  GOLDEN,
  palette,
  type AlienPose,
  type Palette,
} from './art'
import { hexA } from './background'
import { Particles } from './particles'

export interface Layout {
  w: number
  h: number
  left: number
  width: number
  top: number
  shieldY: number
  shipY: number
  /** Alien radius in px. */
  unit: number
}

interface Popup {
  text: string
  x: number
  y: number
  age: number
  color: string
  size: number
}

interface Callout {
  text: string
  age: number
  duration: number
  colors: readonly [string, string]
  size: number
}

export const FONT = 'Fredoka, "Baloo 2", system-ui, sans-serif'
const INK = '#1b1033'

export function computeLayout(w: number, h: number, bottomReserve: number): Layout {
  const width = Math.min(w - 32, h * 1.7)
  const shipY = h - bottomReserve - Math.max(44, h * 0.07)
  const top = Math.max(70, h * 0.09)
  return {
    w,
    h,
    left: (w - width) / 2,
    width,
    top,
    shipY,
    shieldY: shipY - Math.max(40, h * 0.06),
    unit: clamp(Math.min(width, h) * 0.044, 20, 54),
  }
}

/** Draws a running Session and turns its events into juicy visual effects. */
export class GameView {
  bottomReserve = 0
  /** Slow motion factor applied to the simulation (hit-stop on big moments). */
  timeScale = 1
  readonly particles = new Particles()
  private popups: Popup[] = []
  private callout: Callout | null = null
  private shake = 0
  private flash = 0
  private flashColor = '#ffffff'
  private redAlert = 0
  private shieldFlash = 0
  private shieldColor = '#5fd4ff'
  private shipX = -1
  private shipAngle = 0
  private recoil = 0
  private aimId: number | null = null
  private slowmo = 0
  /** Seconds left in the boss build-up, and its total length. */
  private tension = 0
  private tensionTotal = 1
  private shotOrigins = new Map<number, { x: number; y: number }>()
  private layout: Layout = computeLayout(1, 1, 0)
  private clock = 0
  private shotCount = 0

  constructor(
    private ship: ShipDef,
    private laser: LaserDef,
  ) {}

  setLoadout(ship: ShipDef, laser: LaserDef): void {
    this.ship = ship
    this.laser = laser
  }

  showCallout(
    text: string,
    colors: readonly [string, string] = ['#fff27a', '#ff9f1c'],
    duration = 1.1,
    size = 1,
  ): void {
    this.callout = { text, age: 0, duration, colors, size }
  }

  private pos(e: Enemy): { x: number; y: number } {
    const L = this.layout
    return { x: L.left + e.x * L.width, y: L.top + e.y * (L.shieldY - L.top) }
  }

  private nose(): { x: number; y: number } {
    const L = this.layout
    const s = L.unit * 1.1
    return {
      x: this.shipX + Math.sin(this.shipAngle) * s,
      y: L.shipY - Math.cos(this.shipAngle) * s,
    }
  }

  private laserColor(i: number): string {
    const c = this.laser.colors
    return c[i % c.length] ?? '#5fd4ff'
  }

  private popup(text: string, x: number, y: number, color: string, size = 1): void {
    this.popups.push({ text, x, y, age: 0, color, size })
    if (this.popups.length > 30) this.popups.shift()
  }

  private colorsOf(e: Enemy): readonly string[] {
    const p = e.kind === 'golden' ? GOLDEN : palette(e.palette)
    return [p.body, p.light, '#ffffff']
  }

  handle(event: GameEvent): void {
    const L = this.layout
    switch (event.type) {
      case 'spawn': {
        const p = this.pos(event.enemy)
        this.particles.add({
          kind: 'ring',
          x: p.x,
          y: Math.max(p.y, L.top * 0.6),
          color: this.colorsOf(event.enemy)[0] ?? '#fff',
          size: 4,
          vx: 90,
          life: 0.4,
          drag: 0,
        })
        if (event.enemy.kind === 'golden')
          this.popup(t('callout.golden'), p.x, L.top + 30, '#ffd23f', 0.8)
        break
      }
      case 'shot': {
        const n = this.nose()
        this.shotOrigins.set(event.projectile.id, n)
        this.aimId = event.enemy.id
        this.recoil = 1
        const c = this.laserColor(this.shotCount++)
        this.particles.add({
          kind: 'glow',
          x: n.x,
          y: n.y,
          color: c,
          size: L.unit * 1.2,
          life: 0.12,
          drag: 0,
        })
        break
      }
      case 'hit': {
        const p = this.pos(event.enemy)
        this.particles.burst(
          p.x,
          p.y,
          this.colorsOf(event.enemy)[0] ?? '#fff',
          6,
          260,
          'spark',
          2.5,
        )
        this.particles.add({
          kind: 'glow',
          x: p.x,
          y: p.y,
          color: '#ffffff',
          size: L.unit * 1.2,
          life: 0.12,
          drag: 0,
        })
        break
      }
      case 'kill': {
        const e = event.enemy
        const p = this.pos(e)
        const boss = e.kind === 'boss'
        const scale = boss ? 3.2 : event.byBomb ? 0.8 : e.text.length > 1 ? 1.3 : 1.1
        this.particles.explosion(p.x, p.y, this.colorsOf(e), scale * (L.unit / 32))
        if (e.kind === 'golden') this.particles.confetti(p.x, p.y, 40, 500)
        if (boss) {
          this.particles.confetti(p.x, p.y, 120, 900)
          this.shake = Math.max(this.shake, 1)
          this.flash = 0.9
          this.flashColor = '#ffffff'
          this.slowmo = 0.9
        } else {
          this.shake = Math.max(
            this.shake,
            event.byBomb ? 0.15 : 0.18 + Math.min(0.25, e.text.length * 0.03),
          )
        }
        this.popup(
          `+${event.points}`,
          p.x,
          p.y - L.unit,
          e.kind === 'golden' ? '#ffd23f' : '#ffffff',
          boss ? 1.8 : 1,
        )
        break
      }
      case 'mistake': {
        this.shake = Math.max(this.shake, 0.12)
        this.popup(
          event.key.toUpperCase(),
          this.shipX + (Math.random() - 0.5) * 30,
          L.shipY - L.unit * 1.8,
          '#ff6b8a',
          1.1,
        )
        break
      }
      case 'combo': {
        const words = [
          'callout.nice',
          'callout.great',
          'callout.awesome',
          'callout.incredible',
        ] as const
        const word = words[Math.min(words.length - 1, event.multiplier - 2)] ?? 'callout.great'
        this.showCallout(`${t(word)}  x${event.multiplier}`, comboColors(event.multiplier), 1.2)
        this.particles.confetti(L.w / 2, L.h * 0.45, 30 + event.multiplier * 10, 700)
        break
      }
      case 'comboBreak':
        this.popup(`x${event.combo}…`, this.shipX, L.shipY - L.unit * 2.4, '#b9a8ff', 0.8)
        break
      case 'breach': {
        const p = this.pos(event.enemy)
        this.shake = Math.max(this.shake, 0.65)
        this.redAlert = 1
        this.shieldFlash = 1
        this.particles.explosion(p.x, L.shieldY, ['#ff4d6d', '#ffae57', '#ffffff'], L.unit / 30)
        break
      }
      case 'powerup': {
        const p = this.pos(event.enemy)
        if (event.power === 'freeze') {
          this.showCallout(t('callout.freeze'), ['#e6fbff', '#5fd4ff'])
          this.flash = 0.5
          this.flashColor = '#aef4ff'
          this.particles.burst(p.x, p.y, '#dff9ff', 60, 900, 'star', 5)
        } else if (event.power === 'bomb') {
          this.showCallout(t('callout.bomb'), ['#fff27a', '#ff5a2e'])
          this.flash = 0.8
          this.flashColor = '#fff2d0'
          this.shake = 1
          for (let i = 0; i < 4; i++) {
            this.particles.add({
              kind: 'ring',
              x: p.x,
              y: p.y,
              color: i % 2 ? '#ffae57' : '#ffffff',
              size: 10,
              vx: 900 + i * 350,
              life: 0.7,
              drag: 0,
            })
          }
        } else {
          this.showCallout(t('callout.heal'), ['#ffd6e5', '#ff3d7f'])
          this.shieldColor = '#7be07b'
          this.shieldFlash = 1
        }
        break
      }
      case 'bossIncoming':
        this.tension = event.delay
        this.tensionTotal = event.delay
        this.showCallout(t('callout.bossIncoming'), ['#f3e6ff', '#b58cff'], event.delay - 0.6, 0.9)
        break
      case 'bossSpawn': {
        this.tension = 0
        this.showCallout(t('callout.boss'), ['#fff27a', '#ff7a3d'], 1.6, 1.1)
        this.redAlert = 0.35
        this.shake = 0.6
        this.flash = 0.45
        this.flashColor = '#f3e6ff'
        const p = this.pos(event.enemy)
        for (let i = 0; i < 3; i++) {
          this.particles.add({
            kind: 'ring',
            x: p.x,
            y: L.top + (L.shieldY - L.top) * 0.3,
            color: i === 1 ? '#ffffff' : '#c985ff',
            size: 20,
            vx: 500 + i * 300,
            life: 0.8,
            drag: 0,
          })
        }
        break
      }
      case 'bossHit': {
        const p = this.pos(event.enemy)
        this.particles.explosion(p.x, p.y + L.unit, this.colorsOf(event.enemy), 1.6 * (L.unit / 32))
        this.shake = Math.max(this.shake, 0.45)
        this.flash = 0.25
        this.flashColor = '#ffffff'
        break
      }
      case 'wave':
        if (!event.boss) {
          this.showCallout(t('wave', { n: event.wave }), ['#e6fbff', '#5fd4ff'], 1.6, 1.1)
        }
        break
      case 'victory':
        this.showCallout(t('callout.victory'), ['#fff27a', '#ff9f1c'], 2, 1.2)
        for (let i = 0; i < 4; i++)
          this.particles.confetti(L.left + L.width * (0.2 + i * 0.2), L.h * 0.6, 50, 800)
        break
      case 'defeat':
        this.showCallout(t('callout.defeat'), ['#ffd6e5', '#ff6b8a'], 2, 1.1)
        break
      case 'lock':
      case 'escape':
        break
    }
  }

  update(dt: number, session: Session): void {
    this.clock += dt
    this.layout = computeLayout(this.layout.w, this.layout.h, this.bottomReserve)
    const L = this.layout
    if (this.shipX < 0) this.shipX = L.left + L.width / 2

    // Aim at the locked target, or the invader the child should type next.
    const target =
      session.enemies.find((e) => e.id === this.aimId) ?? session.locked ?? lowest(session.enemies)
    const tx = target
      ? clamp(this.pos(target).x, L.left + L.unit, L.left + L.width - L.unit)
      : L.left + L.width / 2
    this.shipX = approach(this.shipX, tx, target ? 7 : 2, dt)
    let angle = 0
    if (target) {
      const p = this.pos(target)
      angle = clamp(Math.atan2(p.x - this.shipX, L.shipY - p.y), -0.9, 0.9)
    }
    this.shipAngle = approach(this.shipAngle, angle, 14, dt)
    this.recoil = approach(this.recoil, 0, 14, dt)

    this.shake = Math.max(0, this.shake - dt * 1.8)
    this.flash = Math.max(0, this.flash - dt * 2.5)
    this.redAlert = Math.max(0, this.redAlert - dt * 1.4)
    if (this.tension > 0) {
      this.tension = Math.max(0, this.tension - dt)
      // A gentle rumble that builds up as the mothership approaches.
      this.shake = Math.max(this.shake, 0.05 + 0.2 * this.tensionProgress)
    }
    this.shieldFlash = Math.max(0, this.shieldFlash - dt * 2)
    if (this.shieldFlash === 0) this.shieldColor = '#5fd4ff'
    if (this.slowmo > 0) {
      this.slowmo -= dt
      this.timeScale = 0.3
    } else this.timeScale = 1

    for (const p of this.popups) {
      p.age += dt
      p.y -= dt * 60
    }
    this.popups = this.popups.filter((p) => p.age < 1)
    if (this.callout) {
      this.callout.age += dt
      if (this.callout.age > this.callout.duration) this.callout = null
    }
    for (const id of this.shotOrigins.keys()) {
      if (!session.projectiles.some((p) => p.id === id)) this.shotOrigins.delete(id)
    }

    // Engine exhaust
    if (Math.random() < 0.8) {
      this.particles.add({
        kind: 'glow',
        x: this.shipX + (Math.random() - 0.5) * L.unit * 0.3,
        y: L.shipY + L.unit * 0.8,
        vy: 160 + Math.random() * 80,
        vx: (Math.random() - 0.5) * 30,
        color: this.ship.accent,
        size: L.unit * 0.35,
        life: 0.3,
        drag: 1,
      })
    }
    if (session.frozen && Math.random() < 0.5) {
      this.particles.add({
        kind: 'star',
        x: L.left + Math.random() * L.width,
        y: L.top + Math.random() * (L.shieldY - L.top),
        vy: 30,
        color: '#dff9ff',
        size: 3 + Math.random() * 3,
        life: 0.8,
        drag: 0,
      })
    }
    this.particles.update(dt)
  }

  draw(ctx: CanvasRenderingContext2D, session: Session, w: number, h: number): void {
    this.layout = computeLayout(w, h, this.bottomReserve)
    ctx.save()
    const s = this.shake * this.shake * 16
    if (s > 0.1) ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s)

    this.drawTension(ctx)
    this.drawShield(ctx, session)
    const hint = session.locked ? null : lowest(session.enemies)
    for (const e of session.enemies) {
      if (e.kind === 'boss') this.drawBossEnemy(ctx, session, e)
      else this.drawEnemy(ctx, session, e, e === hint)
    }
    this.drawProjectiles(ctx, session)
    this.drawShipSprite(ctx)
    this.particles.draw(ctx)
    this.drawPopups(ctx)
    ctx.restore()

    if (session.frozen) {
      ctx.fillStyle = 'rgba(140, 220, 255, 0.08)'
      ctx.fillRect(0, 0, w, h)
    }
    if (this.redAlert > 0) {
      const g = ctx.createRadialGradient(
        w / 2,
        h / 2,
        Math.min(w, h) * 0.35,
        w / 2,
        h / 2,
        Math.max(w, h) * 0.7,
      )
      g.addColorStop(0, 'rgba(255,40,80,0)')
      g.addColorStop(1, `rgba(255,40,80,${0.45 * this.redAlert})`)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
    if (this.flash > 0) {
      ctx.globalAlpha = this.flash * 0.6
      ctx.fillStyle = this.flashColor
      ctx.fillRect(0, 0, w, h)
      ctx.globalAlpha = 1
    }
    this.drawCallout(ctx)
  }

  private get tensionProgress(): number {
    return this.tension > 0 ? 1 - this.tension / this.tensionTotal : 0
  }

  /** Boss build-up: the sky dims, a spotlight opens and a big shadow grows. */
  private drawTension(ctx: CanvasRenderingContext2D): void {
    if (this.tension <= 0) return
    const L = this.layout
    const k = this.tensionProgress
    const fade = Math.min(1, this.tension / 0.4, (this.tensionTotal - this.tension) / 0.6)
    const cx = L.left + L.width / 2
    const cy = L.top + (L.shieldY - L.top) * 0.3
    ctx.save()
    const dim = ctx.createRadialGradient(
      cx,
      cy,
      L.unit * (1 + k * 3),
      cx,
      cy,
      Math.max(L.w, L.h) * 0.8,
    )
    dim.addColorStop(0, 'rgba(40, 10, 70, 0)')
    dim.addColorStop(1, `rgba(20, 5, 45, ${0.55 * fade})`)
    ctx.fillStyle = dim
    ctx.fillRect(0, 0, L.w, L.h)

    // Shadow of the mothership, drifting down and growing.
    const r = L.unit * 3 * (0.3 + 0.7 * k)
    const sy = L.top - r + (cy - L.top + r) * k
    ctx.globalAlpha = 0.35 * fade
    ctx.fillStyle = '#0d0420'
    ctx.beginPath()
    ctx.ellipse(cx, sy, r * 1.3, r * 0.45, 0, 0, TAU)
    ctx.fill()

    // Soft pulsing purple beams from the top, faster as it gets close.
    ctx.globalCompositeOperation = 'lighter'
    const pulse = 0.5 + 0.5 * Math.sin(this.clock * (4 + k * 10))
    ctx.globalAlpha = (0.08 + 0.12 * pulse) * fade
    const beam = ctx.createLinearGradient(0, 0, 0, L.shieldY)
    beam.addColorStop(0, '#c985ff')
    beam.addColorStop(1, 'rgba(201,133,255,0)')
    ctx.fillStyle = beam
    ctx.beginPath()
    ctx.moveTo(cx - r * 0.6, 0)
    ctx.lineTo(cx + r * 0.6, 0)
    ctx.lineTo(cx + r * 2.2, L.shieldY)
    ctx.lineTo(cx - r * 2.2, L.shieldY)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  private drawShield(ctx: CanvasRenderingContext2D, session: Session): void {
    const L = this.layout
    const ratio = session.hearts / session.maxHearts
    const base = ratio > 0.6 ? '#5fd4ff' : ratio > 0.3 ? '#ffd23f' : '#ff4d6d'
    const color =
      this.shieldFlash > 0 ? (this.shieldColor === '#7be07b' ? '#7be07b' : '#ff4d6d') : base
    const pulse = 0.55 + 0.25 * Math.sin(this.clock * 3) + this.shieldFlash * 0.4
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    const y = L.shieldY
    const grad = ctx.createLinearGradient(0, y - 30, 0, y + 12)
    grad.addColorStop(0, hexA(color, 0))
    grad.addColorStop(0.8, hexA(color, 0.18 * pulse))
    grad.addColorStop(1, hexA(color, 0))
    ctx.fillStyle = grad
    ctx.fillRect(L.left, y - 30, L.width, 42)
    ctx.globalAlpha = pulse
    ctx.strokeStyle = color
    ctx.lineWidth = 2.5
    ctx.beginPath()
    const segs = 40
    for (let i = 0; i <= segs; i++) {
      const x = L.left + (i / segs) * L.width
      const yy = y + Math.sin(i * 0.9 + this.clock * 4) * 1.5 * (1 + this.shieldFlash * 4)
      if (i === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()
    ctx.fillStyle = color
    for (let i = 0; i < 24; i++) {
      const x = L.left + ((i + 0.5) / 24) * L.width
      ctx.globalAlpha = pulse * (0.4 + 0.6 * Math.abs(Math.sin(this.clock * 2 + i)))
      ctx.fillRect(x - 1.5, y - 1.5, 3, 3)
    }
    ctx.restore()
  }

  private pose(session: Session, e: Enemy, scared: boolean): AlienPose {
    const p = this.pos(e)
    const dx = this.shipX - p.x
    const dy = this.layout.shipY - p.y
    const d = Math.hypot(dx, dy) || 1
    const since = session.time - e.lastHit
    return {
      t: session.time + e.id * 0.7,
      lookX: dx / d,
      lookY: dy / d,
      scared,
      blink: (session.time * 0.6 + e.id * 0.37) % 3 < 0.1,
      flash: e.lastHit >= 0 && since < 0.15 ? 1 - since / 0.15 : 0,
    }
  }

  private drawEnemy(
    ctx: CanvasRenderingContext2D,
    session: Session,
    e: Enemy,
    hinted: boolean,
  ): void {
    const L = this.layout
    const { x, y } = this.pos(e)
    const age = session.time - e.born
    const grow = easeOutBack(clamp(age / 0.45, 0, 1))
    const r = L.unit * (e.kind === 'powerup' ? 0.85 : e.text.length > 1 ? 1 : 1.05) * grow
    const locked = session.lockId === e.id
    const pal: Palette = e.kind === 'golden' ? GOLDEN : palette(e.palette)
    const jitter = e.lastHit >= 0 && session.time - e.lastHit < 0.15 ? (Math.random() - 0.5) * 6 : 0

    ctx.save()
    ctx.translate(x + jitter, y)
    ctx.globalCompositeOperation = 'lighter'
    const danger = e.y > 0.72 && !e.doomed
    const glowColor = danger ? '#ff4d6d' : pal.body
    ctx.globalAlpha = danger
      ? 0.35 + 0.3 * Math.sin(session.time * 12)
      : e.kind === 'golden'
        ? 0.6
        : 0.28
    const g = r * 3.2
    ctx.drawImage(glowSprite(glowColor), -g, -g, g * 2, g * 2)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'

    ctx.save()
    ctx.scale(r, r)
    if (e.kind === 'powerup' && e.power) drawPowerup(ctx, e.power, session.time)
    else drawAlien(ctx, e.species, pal, this.pose(session, e, locked || e.y > 0.75))
    ctx.restore()

    if (e.kind === 'golden') {
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < 3; i++) {
        const a = session.time * 2 + (i * TAU) / 3
        ctx.globalAlpha = 0.8
        ctx.drawImage(
          glowSprite('#fff27a'),
          Math.cos(a) * r * 1.3 - 8,
          Math.sin(a) * r * 1.3 - 8,
          16,
          16,
        )
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }
    if (session.frozen) {
      ctx.globalAlpha = 0.35
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(glowSprite('#aef4ff'), -r * 1.4, -r * 1.4, r * 2.8, r * 2.8)
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    if (e.text.length === 1) this.drawLetterBadge(ctx, e, pal, r, locked, hinted, session.time)
    else this.drawWordLabel(ctx, e, pal, r * 1.25, locked, hinted, session.time)
    if (locked) drawReticle(ctx, r * 1.45, session.time)
    ctx.restore()
  }

  private drawLetterBadge(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    pal: Palette,
    r: number,
    locked: boolean,
    hinted: boolean,
    time: number,
  ): void {
    const by = r * 0.95
    const br = Math.max(16, r * 0.62)
    if (hinted) {
      ctx.beginPath()
      ctx.arc(0, by, br + 5 + Math.sin(time * 6) * 3, 0, TAU)
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'
      ctx.lineWidth = 3
      ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, by, br, 0, TAU)
    ctx.fillStyle = e.doomed ? '#fff27a' : '#ffffff'
    ctx.fill()
    ctx.lineWidth = Math.max(3, br * 0.16)
    ctx.strokeStyle = locked ? '#ffd23f' : pal.dark
    ctx.stroke()
    ctx.fillStyle = INK
    ctx.font = `700 ${Math.round(br * 1.35)}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(e.text.toUpperCase(), 0, by + br * 0.06)
  }

  private drawWordLabel(
    ctx: CanvasRenderingContext2D,
    e: Enemy,
    pal: Palette,
    offset: number,
    locked: boolean,
    hinted: boolean,
    time: number,
  ): void {
    const L = this.layout
    const size = clamp(L.unit * 0.8, 18, 32)
    ctx.font = `700 ${Math.round(size)}px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'left'
    const text = e.text
    const full = ctx.measureText(text).width
    const padX = size * 0.5
    const hH = size * 0.75
    const y = offset
    const x0 = -full / 2
    ctx.beginPath()
    ctx.roundRect(x0 - padX, y - hH, full + padX * 2, hH * 2, hH)
    ctx.fillStyle = locked ? 'rgba(40, 20, 70, 0.92)' : 'rgba(18, 10, 42, 0.82)'
    ctx.fill()
    ctx.lineWidth = locked ? 3 : 2
    ctx.strokeStyle = locked
      ? '#ffd23f'
      : hinted
        ? `rgba(255,255,255,${0.5 + 0.3 * Math.sin(time * 6)})`
        : pal.body
    ctx.stroke()
    let x = x0
    for (let i = 0; i < text.length; i++) {
      const ch = text[i] ?? ''
      const cw = ctx.measureText(ch).width
      if (i < e.typed) ctx.fillStyle = '#ffd23f'
      else if (i === e.typed && locked) ctx.fillStyle = '#ffffff'
      else ctx.fillStyle = locked ? 'rgba(255,255,255,0.75)' : '#ffffff'
      ctx.fillText(ch, x, y + size * 0.04)
      if (i === e.typed && locked) {
        ctx.fillRect(x, y + size * 0.5, cw, 3)
      }
      x += cw
    }
  }

  private drawBossEnemy(ctx: CanvasRenderingContext2D, session: Session, e: Enemy): void {
    const L = this.layout
    const { x, y } = this.pos(e)
    const r = L.unit * 3
    const pal = palette(e.palette)
    const locked = session.lockId === e.id
    ctx.save()
    const jitter = e.lastHit >= 0 && session.time - e.lastHit < 0.2 ? (Math.random() - 0.5) * 10 : 0
    ctx.translate(x + jitter, y)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.35
    ctx.drawImage(glowSprite(pal.body), -r * 2, -r * 1.6, r * 4, r * 3.2)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.save()
    ctx.scale(r, r)
    drawBoss(ctx, pal, this.pose(session, e, locked), e.hp / e.maxHp)
    ctx.restore()

    // HP bar
    const bw = r * 1.9
    const bh = Math.max(8, r * 0.1)
    const by = -r * 1.05
    ctx.beginPath()
    ctx.roundRect(-bw / 2 - 3, by - 3, bw + 6, bh + 6, bh)
    ctx.fillStyle = 'rgba(10,5,25,0.85)'
    ctx.fill()
    for (let i = 0; i < e.maxHp; i++) {
      const sw = bw / e.maxHp
      ctx.beginPath()
      ctx.roundRect(-bw / 2 + i * sw + 1, by, sw - 2, bh, bh / 2)
      ctx.fillStyle =
        i < e.hp ? (e.hp / e.maxHp > 0.35 ? '#ff4d6d' : '#ffd23f') : 'rgba(255,255,255,0.12)'
      ctx.fill()
    }

    // Code to type
    const size = clamp(L.unit * 1.05, 24, 44)
    ctx.font = `700 ${Math.round(size)}px ${FONT}`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    const letters = e.text.length <= 3
    const text = letters ? e.text.toUpperCase() : e.text
    const ty = r * 0.62 + size
    if (letters) {
      const gap = size * 1.5
      for (let i = 0; i < text.length; i++) {
        const cx = (i - (text.length - 1) / 2) * gap
        ctx.beginPath()
        ctx.arc(cx, ty, size * 0.66, 0, TAU)
        ctx.fillStyle = i < e.typed ? '#ffd23f' : '#ffffff'
        ctx.fill()
        ctx.lineWidth = 4
        ctx.strokeStyle = i === e.typed ? '#ff4d6d' : pal.dark
        ctx.stroke()
        ctx.fillStyle = INK
        ctx.fillText(text[i] ?? '', cx, ty + size * 0.05)
      }
    } else {
      const fake: Enemy = { ...e }
      this.drawWordLabel(ctx, fake, pal, ty, locked || e.typed > 0, false, session.time)
    }
    ctx.restore()
  }

  private drawProjectiles(ctx: CanvasRenderingContext2D, session: Session): void {
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    for (const p of session.projectiles) {
      const target = session.enemies.find((e) => e.id === p.targetId)
      const origin = this.shotOrigins.get(p.id)
      if (!target || !origin) continue
      const to = this.pos(target)
      if (target.kind === 'boss') to.y += this.layout.unit * 1.2
      const k = clamp((session.time - p.born) / p.duration, 0, 1)
      const hx = lerp(origin.x, to.x, k)
      const hy = lerp(origin.y, to.y, k)
      const tk = Math.max(0, k - 0.45)
      const tx = lerp(origin.x, to.x, tk)
      const ty = lerp(origin.y, to.y, tk)
      const color = this.laserColor(p.id)
      ctx.strokeStyle = color
      ctx.lineCap = 'round'
      ctx.lineWidth = p.final ? 9 : 6
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(tx, ty)
      ctx.lineTo(hx, hy)
      ctx.stroke()
      ctx.lineWidth = p.final ? 4 : 3
      ctx.strokeStyle = '#ffffff'
      ctx.globalAlpha = 1
      ctx.stroke()
      const g = this.layout.unit * 0.9
      ctx.drawImage(glowSprite(color), hx - g, hy - g, g * 2, g * 2)
    }
    ctx.restore()
  }

  private drawShipSprite(ctx: CanvasRenderingContext2D): void {
    const L = this.layout
    const size = L.unit * 1.15
    ctx.save()
    ctx.translate(this.shipX, L.shipY + this.recoil * 6)
    ctx.rotate(this.shipAngle)
    // flame
    ctx.globalCompositeOperation = 'lighter'
    const flick = 0.8 + Math.random() * 0.4
    const fl = ctx.createLinearGradient(0, size * 0.6, 0, size * (1.6 + flick * 0.5))
    fl.addColorStop(0, '#ffffff')
    fl.addColorStop(0.3, this.ship.accent)
    fl.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = fl
    ctx.beginPath()
    ctx.moveTo(-size * 0.28, size * 0.6)
    ctx.quadraticCurveTo(0, size * (2 + flick * 0.5), size * 0.28, size * 0.6)
    ctx.fill()
    ctx.globalAlpha = 0.5
    ctx.drawImage(glowSprite(this.ship.accent), -size * 1.4, -size * 1.2, size * 2.8, size * 2.8)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.scale(size, size)
    drawShip(ctx, this.ship, this.clock)
    ctx.restore()
  }

  private drawPopups(ctx: CanvasRenderingContext2D): void {
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (const p of this.popups) {
      const k = p.age
      const scale = k < 0.15 ? easeOutBack(k / 0.15) : 1
      const size = Math.round(clamp(this.layout.unit * 0.8, 16, 30) * p.size * scale)
      ctx.globalAlpha = clamp(1.4 - k * 1.4, 0, 1)
      ctx.font = `700 ${size}px ${FONT}`
      ctx.lineWidth = Math.max(3, size * 0.18)
      ctx.strokeStyle = INK
      ctx.lineJoin = 'round'
      ctx.strokeText(p.text, p.x, p.y)
      ctx.fillStyle = p.color
      ctx.fillText(p.text, p.x, p.y)
    }
    ctx.restore()
  }

  private drawCallout(ctx: CanvasRenderingContext2D): void {
    const c = this.callout
    if (!c) return
    const L = this.layout
    const intro = clamp(c.age / 0.3, 0, 1)
    const outro = clamp((c.duration - c.age) / 0.3, 0, 1)
    const scale = easeOutBack(intro) * (0.9 + 0.1 * outro)
    const size = Math.round(clamp(L.w * 0.07, 38, 92) * c.size)
    ctx.save()
    ctx.translate(L.w / 2, L.h * 0.4)
    ctx.scale(scale, scale)
    ctx.rotate(Math.sin(c.age * 5) * 0.03)
    ctx.globalAlpha = outro
    ctx.font = `700 ${size}px ${FONT}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.lineJoin = 'round'
    ctx.lineWidth = size * 0.22
    ctx.strokeStyle = INK
    ctx.strokeText(c.text, 0, 0)
    const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2)
    g.addColorStop(0, c.colors[0])
    g.addColorStop(1, c.colors[1])
    ctx.fillStyle = g
    ctx.fillText(c.text, 0, 0)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.25 * outro
    ctx.fillText(c.text, 0, 0)
    ctx.restore()
  }
}

function lowest(enemies: readonly Enemy[]): Enemy | undefined {
  let best: Enemy | undefined
  for (const e of enemies) if (!e.doomed && (!best || e.y > best.y)) best = e
  return best
}

function comboColors(m: number): readonly [string, string] {
  const sets: readonly (readonly [string, string])[] = [
    ['#fff27a', '#ff9f1c'],
    ['#b8ff6a', '#1fbf6a'],
    ['#aef4ff', '#3d8bff'],
    ['#ffd6f5', '#c33dff'],
    ['#ffe0e0', '#ff3d3d'],
  ]
  return sets[Math.min(sets.length - 1, m - 2)] ?? ['#fff27a', '#ff9f1c']
}

function drawReticle(ctx: CanvasRenderingContext2D, r: number, time: number): void {
  ctx.save()
  ctx.rotate(time * 1.5)
  ctx.strokeStyle = '#ffd23f'
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  for (let i = 0; i < 4; i++) {
    ctx.rotate(TAU / 4)
    ctx.beginPath()
    ctx.arc(0, 0, r, -0.35, 0.35)
    ctx.stroke()
  }
  ctx.restore()
}
