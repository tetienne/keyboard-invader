import { themeFor, type WorldStyle } from '../content/campaign'
import type { ShipDef } from '../content/ships'
import { TAU } from '../core/math'

/**
 * Procedural cartoon art. Every drawing function works in "unit" space: the
 * caller translates to the sprite centre and scales so that 1 unit = radius.
 */

export interface Palette {
  body: string
  dark: string
  light: string
}

export const ALIEN_PALETTES: readonly Palette[] = [
  { body: '#7be07b', dark: '#1f6e4a', light: '#d2ffb8' },
  { body: '#ff7aa8', dark: '#a3285a', light: '#ffd6e5' },
  { body: '#5fd4ff', dark: '#1b5b9c', light: '#dcf6ff' },
  { body: '#ffae57', dark: '#a8491c', light: '#ffe6c7' },
  { body: '#b58cff', dark: '#56289c', light: '#ece2ff' },
  { body: '#ffe066', dark: '#a37d12', light: '#fff7cc' },
  { body: '#ff6b6b', dark: '#9c2323', light: '#ffd6d6' },
  { body: '#4fe3c1', dark: '#11705f', light: '#cffff2' },
  // World-only colours (endless mode keeps drawing from the first 8).
  { body: '#d8f1ff', dark: '#5a7fb0', light: '#ffffff' },
  { body: '#f2cf8a', dark: '#9c6a2a', light: '#fff3d6' },
  { body: '#7b5cff', dark: '#2a1470', light: '#d9ccff' },
]

export const GOLDEN: Palette = { body: '#ffd23f', dark: '#a86d00', light: '#fff6c2' }

const OUTLINE = '#1b1033'

export const palette = (index: number): Palette =>
  ALIEN_PALETTES[index % ALIEN_PALETTES.length] as Palette

const gradientCache = new Map<string, CanvasGradient>()

/** Volume shading, cached: gradients are resolved in the current transform. */
function bodyGradient(ctx: CanvasRenderingContext2D, p: Palette): CanvasGradient {
  const key = p.body + p.light
  let g = gradientCache.get(key)
  if (!g) {
    g = ctx.createRadialGradient(-0.35, -0.45, 0.05, 0, 0, 1.25)
    g.addColorStop(0, p.light)
    g.addColorStop(0.45, p.body)
    g.addColorStop(1, p.dark)
    gradientCache.set(key, g)
  }
  return g
}

export interface AlienPose {
  t: number
  /** Direction the eyes look at, roughly unit length. */
  lookX: number
  lookY: number
  scared: boolean
  blink: boolean
  /** 0..1 white flash when hit. */
  flash: number
}

function eye(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  pose: AlienPose,
): void {
  if (pose.blink) {
    ctx.beginPath()
    ctx.moveTo(x - r * 0.8, y)
    ctx.quadraticCurveTo(x, y + r * 0.5, x + r * 0.8, y)
    ctx.strokeStyle = OUTLINE
    ctx.lineWidth = r * 0.28
    ctx.lineCap = 'round'
    ctx.stroke()
    return
  }
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = r * 0.18
  ctx.strokeStyle = OUTLINE
  ctx.stroke()
  const pr = pose.scared ? r * 0.32 : r * 0.52
  const px = x + pose.lookX * r * 0.38
  const py = y + pose.lookY * r * 0.38
  ctx.beginPath()
  ctx.arc(px, py, pr, 0, TAU)
  ctx.fillStyle = OUTLINE
  ctx.fill()
  ctx.beginPath()
  ctx.arc(px - pr * 0.35, py - pr * 0.4, pr * 0.38, 0, TAU)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
}

function mouth(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  pose: AlienPose,
): void {
  ctx.strokeStyle = OUTLINE
  ctx.fillStyle = OUTLINE
  ctx.lineCap = 'round'
  if (pose.scared) {
    ctx.beginPath()
    ctx.ellipse(x, y + w * 0.1, w * 0.28, w * 0.36, 0, 0, TAU)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(x - w * 0.5, y)
  ctx.quadraticCurveTo(x, y + w * 0.6, x + w * 0.5, y)
  ctx.lineWidth = w * 0.22
  ctx.stroke()
}

function cheeks(ctx: CanvasRenderingContext2D, x: number, y: number, spread: number): void {
  ctx.fillStyle = 'rgba(255, 90, 140, 0.35)'
  ctx.beginPath()
  ctx.ellipse(x - spread, y, 0.14, 0.08, 0, 0, TAU)
  ctx.ellipse(x + spread, y, 0.14, 0.08, 0, 0, TAU)
  ctx.fill()
}

function finishBody(ctx: CanvasRenderingContext2D, p: Palette, flash: number): void {
  ctx.fillStyle = bodyGradient(ctx, p)
  ctx.fill()
  ctx.lineWidth = 0.09
  ctx.strokeStyle = OUTLINE
  ctx.lineJoin = 'round'
  ctx.stroke()
  if (flash > 0) {
    ctx.globalAlpha = flash
    ctx.fillStyle = '#ffffff'
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

function antenna(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  tip: string,
): void {
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.quadraticCurveTo((x0 + x1) / 2 + 0.1, (y0 + y1) / 2, x1, y1)
  ctx.lineWidth = 0.09
  ctx.strokeStyle = OUTLINE
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(x1, y1, 0.14, 0, TAU)
  ctx.fillStyle = tip
  ctx.fill()
  ctx.lineWidth = 0.06
  ctx.stroke()
}

export function drawAlien(
  ctx: CanvasRenderingContext2D,
  species: number,
  p: Palette,
  pose: AlienPose,
): void {
  const t = pose.t
  const bob = Math.sin(t * 3) * 0.04
  ctx.save()
  ctx.translate(0, bob)
  switch (species % 6) {
    case 0: {
      // Blob with antennae
      const w = Math.sin(t * 4) * 0.12
      antenna(ctx, -0.3, -0.7, -0.55 + w, -1.25, '#ff5fa2')
      antenna(ctx, 0.3, -0.7, 0.55 - w, -1.25, '#ffe066')
      ctx.beginPath()
      ctx.ellipse(-0.45, 0.82, 0.22, 0.14, 0, 0, TAU)
      ctx.ellipse(0.45, 0.82, 0.22, 0.14, 0, 0, TAU)
      ctx.fillStyle = p.dark
      ctx.fill()
      ctx.beginPath()
      ctx.ellipse(0, 0, 1, 0.9, 0, 0, TAU)
      finishBody(ctx, p, pose.flash)
      eye(ctx, -0.36, -0.18, 0.28, pose)
      eye(ctx, 0.36, -0.18, 0.28, pose)
      cheeks(ctx, 0, 0.18, 0.6)
      mouth(ctx, 0, 0.3, 0.34, pose)
      break
    }
    case 1: {
      // Squid with wiggly tentacles
      ctx.lineCap = 'round'
      for (let i = 0; i < 4; i++) {
        const x = -0.6 + i * 0.4
        const sway = Math.sin(t * 5 + i * 1.3) * 0.2
        ctx.beginPath()
        ctx.moveTo(x, 0.35)
        ctx.quadraticCurveTo(x + sway, 0.8, x - sway * 0.5, 1.15)
        ctx.lineWidth = 0.34
        ctx.strokeStyle = OUTLINE
        ctx.stroke()
        ctx.lineWidth = 0.2
        ctx.strokeStyle = p.body
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.moveTo(-0.95, 0.4)
      ctx.bezierCurveTo(-1.05, -1.1, 1.05, -1.1, 0.95, 0.4)
      ctx.quadraticCurveTo(0, 0.62, -0.95, 0.4)
      ctx.closePath()
      finishBody(ctx, p, pose.flash)
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.beginPath()
      ctx.arc(-0.35, -0.6, 0.1, 0, TAU)
      ctx.arc(0.1, -0.72, 0.07, 0, TAU)
      ctx.fill()
      eye(ctx, -0.34, -0.1, 0.26, pose)
      eye(ctx, 0.34, -0.1, 0.26, pose)
      mouth(ctx, 0, 0.2, 0.28, pose)
      break
    }
    case 2: {
      // Cyclops with horns and little arms
      const wave = Math.sin(t * 6) * 0.25
      ctx.lineCap = 'round'
      ctx.lineWidth = 0.16
      ctx.strokeStyle = OUTLINE
      ctx.beginPath()
      ctx.moveTo(-0.85, 0.1)
      ctx.lineTo(-1.2, -0.25 + wave)
      ctx.moveTo(0.85, 0.1)
      ctx.lineTo(1.2, -0.25 - wave)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-0.55, -0.7)
      ctx.lineTo(-0.72, -1.15)
      ctx.lineTo(-0.25, -0.88)
      ctx.moveTo(0.55, -0.7)
      ctx.lineTo(0.72, -1.15)
      ctx.lineTo(0.25, -0.88)
      ctx.fillStyle = '#fff4d6'
      ctx.fill()
      ctx.lineWidth = 0.07
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(0, 0, 0.95, 0, TAU)
      finishBody(ctx, p, pose.flash)
      eye(ctx, 0, -0.18, 0.44, pose)
      cheeks(ctx, 0, 0.3, 0.55)
      mouth(ctx, 0, 0.45, 0.36, pose)
      break
    }
    case 3: {
      // Crab invader: a tribute to the arcade classic
      const pinch = (Math.sin(t * 5) + 1) * 0.2
      for (const side of [-1, 1]) {
        ctx.save()
        ctx.translate(side * 1.05, -0.25)
        ctx.rotate(-Math.PI / 2 + side * 0.45)
        const open = 0.25 + pinch
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, 0.36, open, TAU - open)
        ctx.closePath()
        finishBody(ctx, p, pose.flash)
        ctx.restore()
      }
      ctx.lineWidth = 0.1
      ctx.strokeStyle = OUTLINE
      ctx.beginPath()
      ctx.moveTo(-0.3, -0.6)
      ctx.lineTo(-0.4, -0.95)
      ctx.moveTo(0.3, -0.6)
      ctx.lineTo(0.4, -0.95)
      ctx.stroke()
      for (let i = 0; i < 3; i++) {
        const x = -0.5 + i * 0.5
        const k = Math.sin(t * 8 + i) * 0.08
        ctx.beginPath()
        ctx.moveTo(x, 0.55)
        ctx.lineTo(x + k, 0.92)
        ctx.lineWidth = 0.14
        ctx.stroke()
      }
      ctx.beginPath()
      ctx.roundRect(-0.9, -0.7, 1.8, 1.35, 0.55)
      finishBody(ctx, p, pose.flash)
      eye(ctx, -0.4, -0.98, 0.24, pose)
      eye(ctx, 0.4, -0.98, 0.24, pose)
      cheeks(ctx, 0, 0.05, 0.5)
      mouth(ctx, 0, 0.12, 0.4, pose)
      break
    }
    case 4: {
      // Little saucer with a pilot in the dome
      ctx.beginPath()
      ctx.ellipse(0, -0.25, 0.62, 0.62, 0, Math.PI, 0)
      ctx.closePath()
      ctx.fillStyle = 'rgba(190, 240, 255, 0.35)'
      ctx.fill()
      ctx.save()
      ctx.beginPath()
      ctx.arc(0, -0.28, 0.4, 0, TAU)
      ctx.fillStyle = bodyGradient(ctx, p)
      ctx.fill()
      ctx.lineWidth = 0.07
      ctx.strokeStyle = OUTLINE
      ctx.stroke()
      ctx.restore()
      eye(ctx, -0.15, -0.36, 0.14, pose)
      eye(ctx, 0.15, -0.36, 0.14, pose)
      ctx.beginPath()
      ctx.ellipse(0, -0.25, 0.62, 0.62, 0, Math.PI, 0)
      ctx.lineWidth = 0.08
      ctx.strokeStyle = OUTLINE
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(0, 0.08, 1.1, 0.4, 0, 0, TAU)
      const hull: Palette = { body: '#c7cce8', dark: '#4b4f7a', light: '#ffffff' }
      finishBody(ctx, hull, pose.flash)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI + 0.3
        const lx = Math.cos(a) * 0.8
        const on = Math.floor(t * 6 + i) % 2 === 0
        ctx.beginPath()
        ctx.arc(lx, 0.16 + Math.sin(a) * 0.12, 0.09, 0, TAU)
        ctx.fillStyle = on ? p.body : p.dark
        ctx.fill()
      }
      break
    }
    default: {
      // Jelly ghost with a wavy skirt
      ctx.beginPath()
      ctx.moveTo(-0.95, 0)
      ctx.bezierCurveTo(-0.95, -1.25, 0.95, -1.25, 0.95, 0)
      const waves = 4
      for (let i = 0; i <= waves; i++) {
        const x = 0.95 - (i / waves) * 1.9
        const y = 0.75 + Math.sin(t * 6 + i * 1.7) * 0.12 + (i % 2 === 0 ? 0 : 0.14)
        ctx.lineTo(x, y)
      }
      ctx.closePath()
      finishBody(ctx, p, pose.flash)
      eye(ctx, -0.34, -0.3, 0.26, pose)
      eye(ctx, 0.34, -0.3, 0.26, pose)
      cheeks(ctx, 0, 0.02, 0.62)
      mouth(ctx, 0, 0.1, 0.3, pose)
    }
  }
  ctx.restore()
}

export const bossPalette = (world: number): Palette => palette(themeFor(world).palettes[0] ?? 0)

/** The boss of world N in unit space (1 unit = radius), with its world's palette and accessory. */
export function drawWorldBoss(
  ctx: CanvasRenderingContext2D,
  world: number,
  pose: AlienPose,
  hpRatio = 1,
): void {
  drawBoss(ctx, bossPalette(world), pose, hpRatio, themeFor(world).style)
}

/** Big mothership boss; `style` adds its world's accessory. */
export function drawBoss(
  ctx: CanvasRenderingContext2D,
  p: Palette,
  pose: AlienPose,
  hpRatio: number,
  style?: WorldStyle,
): void {
  const t = pose.t
  ctx.save()
  ctx.translate(0, Math.sin(t * 1.5) * 0.04)
  if (style === 'void') bossSwirl(ctx, t)
  // tractor glow
  const beam = ctx.createLinearGradient(0, 0.3, 0, 1.6)
  beam.addColorStop(0, `${p.body}88`)
  beam.addColorStop(1, `${p.body}00`)
  ctx.fillStyle = beam
  ctx.beginPath()
  ctx.moveTo(-0.35, 0.3)
  ctx.lineTo(0.35, 0.3)
  ctx.lineTo(0.8, 1.6)
  ctx.lineTo(-0.8, 1.6)
  ctx.closePath()
  ctx.fill()

  // dome with the big boss inside
  ctx.beginPath()
  ctx.ellipse(0, -0.2, 0.62, 0.66, 0, Math.PI, 0)
  ctx.closePath()
  ctx.fillStyle = 'rgba(180, 235, 255, 0.28)'
  ctx.fill()
  ctx.save()
  ctx.translate(0, -0.3)
  ctx.scale(0.42, 0.42)
  drawAlien(ctx, 2, p, { ...pose, scared: hpRatio < 0.35 || pose.scared })
  ctx.restore()
  ctx.beginPath()
  ctx.ellipse(0, -0.2, 0.62, 0.66, 0, Math.PI, 0)
  ctx.lineWidth = 0.05
  ctx.strokeStyle = OUTLINE
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(-0.25, -0.55, 0.12, 0.06, -0.6, 0, TAU)
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  ctx.fill()

  if (style === 'desert') nemes(ctx)

  // hull
  ctx.beginPath()
  ctx.ellipse(0, 0.08, 1.25, 0.34, 0, 0, TAU)
  const hull: Palette = { body: '#8e86c7', dark: '#2a2250', light: '#e3e0ff' }
  ctx.fillStyle = bodyGradient(ctx, hull)
  ctx.fill()
  ctx.lineWidth = 0.05
  ctx.strokeStyle = OUTLINE
  ctx.stroke()
  ctx.beginPath()
  ctx.ellipse(0, 0.2, 0.9, 0.16, 0, 0, Math.PI)
  ctx.fillStyle = hull.dark
  ctx.fill()
  if (pose.flash > 0) {
    ctx.globalAlpha = pose.flash
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.ellipse(0, 0.08, 1.25, 0.34, 0, 0, TAU)
    ctx.fill()
    ctx.globalAlpha = 1
  }
  for (let i = 0; i < 9; i++) {
    const a = (i / 8) * Math.PI
    const lx = -Math.cos(a) * 1.02
    const ly = 0.1 + Math.sin(a) * 0.14
    const on = Math.floor(t * 8 - i) % 3 === 0
    ctx.beginPath()
    ctx.arc(lx, ly, 0.055, 0, TAU)
    ctx.fillStyle = on ? '#ffffff' : p.body
    ctx.fill()
  }
  if (style) bossAccessory(ctx, style, t)
  ctx.restore()
}

/** Point on the dome outline, `a` from 0 (right) to PI (left). */
const domeAt = (a: number, out = 0): [number, number] => [
  Math.cos(a) * (0.62 + out),
  -0.2 - Math.sin(a) * (0.66 + out),
]

function outlined(ctx: CanvasRenderingContext2D, fill: string, width = 0.04): void {
  ctx.fillStyle = fill
  ctx.fill()
  ctx.lineWidth = width
  ctx.strokeStyle = OUTLINE
  ctx.lineJoin = 'round'
  ctx.stroke()
}

function bossSwirl(ctx: CanvasRenderingContext2D, t: number): void {
  ctx.save()
  ctx.globalCompositeOperation = 'lighter'
  ctx.lineCap = 'round'
  ctx.scale(1, 0.55)
  ctx.rotate(t * 0.6)
  for (let arm = 0; arm < 3; arm++) {
    ctx.rotate(TAU / 3)
    ctx.beginPath()
    for (let i = 0; i <= 16; i++) {
      const k = i / 16
      const a = k * 2.6
      const r = 0.5 + k * 1.15
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    ctx.lineWidth = 0.16
    ctx.strokeStyle = arm === 0 ? 'rgba(255,77,109,0.35)' : 'rgba(201,133,255,0.35)'
    ctx.stroke()
  }
  ctx.restore()
}

/** Pharaoh headdress: striped flaps falling from the dome, tucked behind the hull. */
function nemes(ctx: CanvasRenderingContext2D): void {
  for (const s of [-1, 1]) {
    ctx.beginPath()
    ctx.moveTo(s * 0.5, -0.6)
    ctx.quadraticCurveTo(s * 0.86, -0.45, s * 0.98, 0.15)
    ctx.lineTo(s * 0.6, 0.15)
    ctx.quadraticCurveTo(s * 0.62, -0.2, s * 0.42, -0.45)
    ctx.closePath()
    outlined(ctx, '#ffd23f')
    ctx.save()
    ctx.clip()
    ctx.strokeStyle = '#2f6fd6'
    ctx.lineWidth = 0.08
    for (let i = 0; i < 4; i++) {
      ctx.beginPath()
      ctx.moveTo(s * 0.3, -0.5 + i * 0.18)
      ctx.lineTo(s * 1.1, -0.42 + i * 0.18)
      ctx.stroke()
    }
    ctx.restore()
  }
}

function bossAccessory(ctx: CanvasRenderingContext2D, style: WorldStyle, t: number): void {
  ctx.lineCap = 'round'
  switch (style) {
    case 'meadow': {
      // Crown of flowers along the dome.
      const colors = ['#ff7aa8', '#ffe066', '#ffffff', '#ffe066', '#ff7aa8']
      colors.forEach((color, i) => {
        const [x, y] = domeAt(0.55 + i * 0.51, 0.02)
        const r = i === 2 ? 0.1 : 0.08
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(t * 0.8 + i)
        ctx.beginPath()
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * TAU
          ctx.moveTo(Math.cos(a) * r + r * 0.9, Math.sin(a) * r)
          ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r * 0.9, 0, TAU)
        }
        outlined(ctx, color, 0.03)
        ctx.beginPath()
        ctx.arc(0, 0, r * 0.6, 0, TAU)
        outlined(ctx, '#ff9f1c', 0.03)
        ctx.restore()
      })
      break
    }
    case 'bubbles': {
      // Captain's cap on top of the dome, bubbles rising from the hull.
      ctx.beginPath()
      ctx.ellipse(0, -0.86, 0.36, 0.08, 0, 0, TAU)
      outlined(ctx, '#1b3d8f')
      ctx.beginPath()
      ctx.moveTo(-0.3, -0.88)
      ctx.quadraticCurveTo(-0.34, -1.06, 0, -1.08)
      ctx.quadraticCurveTo(0.34, -1.06, 0.3, -0.88)
      ctx.closePath()
      outlined(ctx, '#ffffff')
      ctx.beginPath()
      ctx.rect(-0.3, -0.93, 0.6, 0.06)
      outlined(ctx, '#1b3d8f', 0.03)
      ctx.beginPath()
      ctx.arc(0, -0.99, 0.05, 0, TAU)
      outlined(ctx, '#ffd23f', 0.025)
      for (let i = 0; i < 5; i++) {
        const k = (t * 0.5 + i / 5) % 1
        const side = i % 2 === 0 ? -1 : 1
        ctx.beginPath()
        ctx.arc(side * (1.05 + Math.sin(k * 9 + i) * 0.06), 0.05 - k * 0.9, 0.04 + k * 0.05, 0, TAU)
        ctx.globalAlpha = 1 - k
        ctx.lineWidth = 0.025
        ctx.strokeStyle = '#dcf6ff'
        ctx.stroke()
        ctx.globalAlpha = 1
      }
      break
    }
    case 'ice': {
      // Crown of ice spikes, icicles under the hull.
      for (let i = 0; i < 5; i++) {
        const a = 0.95 + i * 0.3
        const len = i === 2 ? 0.26 : i % 2 === 0 ? 0.16 : 0.2
        const [x0, y0] = domeAt(a - 0.11)
        const [x1, y1] = domeAt(a + 0.11)
        const [tx, ty] = domeAt(a, len)
        ctx.beginPath()
        ctx.moveTo(x0, y0)
        ctx.lineTo(tx, ty)
        ctx.lineTo(x1, y1)
        ctx.closePath()
        outlined(ctx, i === 2 ? '#ffffff' : '#bfefff', 0.03)
      }
      for (let i = 0; i < 6; i++) {
        const x = -0.75 + i * 0.3
        const len = 0.14 + ((i * 7) % 3) * 0.05
        ctx.beginPath()
        ctx.moveTo(x - 0.06, 0.33)
        ctx.lineTo(x, 0.33 + len)
        ctx.lineTo(x + 0.06, 0.33)
        ctx.closePath()
        outlined(ctx, '#dff7ff', 0.025)
      }
      break
    }
    case 'desert': {
      // Gold uraeus jewel on top of the headdress.
      ctx.beginPath()
      ctx.ellipse(0, -0.9, 0.08, 0.12, 0, 0, TAU)
      outlined(ctx, '#ffd23f', 0.03)
      ctx.beginPath()
      ctx.arc(0, -0.9, 0.045, 0, TAU)
      ctx.fillStyle = '#2fd6b5'
      ctx.fill()
      break
    }
    case 'jungle': {
      // Palm tuft on the dome and a leafy vine across the hull.
      for (let i = 0; i < 3; i++) {
        ctx.save()
        ctx.translate(0, -0.84)
        ctx.rotate(-0.7 + i * 0.7 + Math.sin(t * 2 + i) * 0.08)
        ctx.beginPath()
        ctx.ellipse(0, -0.16, 0.07, 0.18, 0, 0, TAU)
        outlined(ctx, i === 1 ? '#7be07b' : '#3fbf5f', 0.03)
        ctx.restore()
      }
      ctx.beginPath()
      ctx.moveTo(-1.15, -0.02)
      for (let i = 1; i <= 8; i++) {
        const x = -1.15 + i * 0.29
        ctx.quadraticCurveTo(x - 0.15, 0.24, x, 0.04 + (i % 2) * 0.06)
      }
      ctx.lineWidth = 0.05
      ctx.strokeStyle = '#2e8f4a'
      ctx.stroke()
      for (let i = 0; i < 6; i++) {
        const x = -0.95 + i * 0.38
        ctx.save()
        ctx.translate(x, 0.2)
        ctx.rotate((i % 2 === 0 ? 0.5 : -0.5) + Math.sin(t * 3 + i) * 0.15)
        ctx.beginPath()
        ctx.ellipse(0, 0.08, 0.05, 0.11, 0, 0, TAU)
        outlined(ctx, '#5fd47a', 0.025)
        ctx.restore()
      }
      break
    }
    case 'void': {
      // Little stars orbiting the mothership.
      for (let i = 0; i < 4; i++) {
        const a = t * 1.2 + (i * TAU) / 4
        const x = Math.cos(a) * 1.35
        const y = Math.sin(a) * 0.5 - 0.1
        const r = 0.05 + 0.02 * Math.sin(t * 5 + i)
        ctx.beginPath()
        ctx.moveTo(x, y - r * 2)
        ctx.lineTo(x + r * 0.6, y)
        ctx.lineTo(x, y + r * 2)
        ctx.lineTo(x - r * 0.6, y)
        ctx.closePath()
        ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#ffb3c6'
        ctx.fill()
      }
      break
    }
  }
}

export type PowerIcon = 'freeze' | 'bomb' | 'heal'

export function drawPowerup(ctx: CanvasRenderingContext2D, power: PowerIcon, t: number): void {
  const colors: Record<PowerIcon, [string, string]> = {
    freeze: ['#aef4ff', '#2a8fd6'],
    bomb: ['#ffd0a0', '#ff5a2e'],
    heal: ['#ffd0e0', '#ff3d7f'],
  }
  const [light, dark] = colors[power]
  const g = ctx.createRadialGradient(-0.3, -0.3, 0.05, 0, 0, 1)
  g.addColorStop(0, '#ffffff')
  g.addColorStop(0.35, light)
  g.addColorStop(1, dark)
  ctx.beginPath()
  ctx.arc(0, 0, 0.8, 0, TAU)
  ctx.fillStyle = g
  ctx.fill()
  ctx.lineWidth = 0.08
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()
  ctx.save()
  ctx.rotate(t * 1.5)
  ctx.setLineDash([0.25, 0.18])
  ctx.beginPath()
  ctx.arc(0, 0, 1.02, 0, TAU)
  ctx.lineWidth = 0.08
  ctx.strokeStyle = light
  ctx.stroke()
  ctx.restore()
  ctx.setLineDash([])
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#ffffff'
  ctx.lineCap = 'round'
  if (power === 'freeze') {
    ctx.lineWidth = 0.1
    for (let i = 0; i < 3; i++) {
      ctx.save()
      ctx.rotate((i * Math.PI) / 3)
      ctx.beginPath()
      ctx.moveTo(0, -0.5)
      ctx.lineTo(0, 0.5)
      ctx.moveTo(-0.14, -0.36)
      ctx.lineTo(0, -0.24)
      ctx.lineTo(0.14, -0.36)
      ctx.moveTo(-0.14, 0.36)
      ctx.lineTo(0, 0.24)
      ctx.lineTo(0.14, 0.36)
      ctx.stroke()
      ctx.restore()
    }
  } else if (power === 'bomb') {
    ctx.beginPath()
    ctx.arc(0, 0.08, 0.36, 0, TAU)
    ctx.fillStyle = OUTLINE
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0.18, -0.2)
    ctx.quadraticCurveTo(0.35, -0.5, 0.2, -0.55)
    ctx.lineWidth = 0.08
    ctx.strokeStyle = OUTLINE
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0.2, -0.58, 0.09 + Math.sin(t * 20) * 0.03, 0, TAU)
    ctx.fillStyle = '#ffe066'
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.moveTo(0, 0.42)
    ctx.bezierCurveTo(-0.7, -0.05, -0.35, -0.6, 0, -0.25)
    ctx.bezierCurveTo(0.35, -0.6, 0.7, -0.05, 0, 0.42)
    ctx.fill()
  }
}

/** Player ship, nose pointing up (-y), about 2 units tall. */
export function drawShip(ctx: CanvasRenderingContext2D, ship: ShipDef, t: number): void {
  const body: Palette = {
    body: ship.body,
    dark: shade(ship.body, -0.45),
    light: shade(ship.body, 0.55),
  }
  const accent = ship.accent
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  const outline = (): void => {
    ctx.lineWidth = 0.08
    ctx.strokeStyle = OUTLINE
    ctx.stroke()
  }
  const fillBody = (): void => {
    ctx.fillStyle = bodyGradient(ctx, body)
    ctx.fill()
    outline()
  }
  const fillAccent = (): void => {
    ctx.fillStyle = accent
    ctx.fill()
    outline()
  }
  const cockpit = (x: number, y: number, rx: number, ry: number): void => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, TAU)
    const g = ctx.createLinearGradient(x, y - ry, x, y + ry)
    g.addColorStop(0, '#ffffff')
    g.addColorStop(0.35, ship.cockpit)
    g.addColorStop(1, shade(ship.cockpit, -0.5))
    ctx.fillStyle = g
    ctx.fill()
    outline()
    ctx.beginPath()
    ctx.ellipse(x - rx * 0.35, y - ry * 0.4, rx * 0.25, ry * 0.18, -0.5, 0, TAU)
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.fill()
  }

  switch (ship.shape) {
    case 'arrow':
      ctx.beginPath()
      ctx.moveTo(-1, 0.6)
      ctx.lineTo(-0.25, -0.1)
      ctx.lineTo(0.25, -0.1)
      ctx.lineTo(1, 0.6)
      ctx.lineTo(0.3, 0.45)
      ctx.lineTo(-0.3, 0.45)
      ctx.closePath()
      fillAccent()
      ctx.beginPath()
      ctx.moveTo(0, -1.05)
      ctx.bezierCurveTo(0.42, -0.5, 0.42, 0.4, 0.3, 0.75)
      ctx.lineTo(-0.3, 0.75)
      ctx.bezierCurveTo(-0.42, 0.4, -0.42, -0.5, 0, -1.05)
      fillBody()
      cockpit(0, -0.25, 0.17, 0.3)
      break
    case 'round':
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.ellipse(s * 0.72, 0.45, 0.22, 0.38, s * -0.3, 0, TAU)
        fillAccent()
      }
      ctx.beginPath()
      ctx.arc(0, 0, 0.78, 0, TAU)
      fillBody()
      cockpit(0, -0.1, 0.42, 0.38)
      break
    case 'wing':
      ctx.beginPath()
      ctx.moveTo(0, -0.9)
      ctx.lineTo(1.15, 0.55)
      ctx.lineTo(0.35, 0.4)
      ctx.lineTo(0, 0.7)
      ctx.lineTo(-0.35, 0.4)
      ctx.lineTo(-1.15, 0.55)
      ctx.closePath()
      fillBody()
      ctx.beginPath()
      ctx.moveTo(0.75, 0.2)
      ctx.lineTo(1.15, 0.55)
      ctx.lineTo(0.7, 0.48)
      ctx.closePath()
      fillAccent()
      ctx.beginPath()
      ctx.moveTo(-0.75, 0.2)
      ctx.lineTo(-1.15, 0.55)
      ctx.lineTo(-0.7, 0.48)
      ctx.closePath()
      fillAccent()
      cockpit(0, -0.1, 0.16, 0.34)
      break
    case 'saucer':
      cockpit(0, -0.25, 0.48, 0.45)
      ctx.beginPath()
      ctx.ellipse(0, 0.2, 1.1, 0.36, 0, 0, TAU)
      fillBody()
      ctx.beginPath()
      ctx.ellipse(0, 0.3, 0.7, 0.14, 0, 0, Math.PI)
      fillAccent()
      for (let i = 0; i < 5; i++) {
        ctx.beginPath()
        ctx.arc(-0.7 + i * 0.35, 0.18, 0.07, 0, TAU)
        ctx.fillStyle = Math.floor(t * 6 + i) % 2 ? '#ffffff' : accent
        ctx.fill()
      }
      break
    case 'rocket':
      for (const s of [-1, 1]) {
        ctx.beginPath()
        ctx.moveTo(s * 0.3, 0.1)
        ctx.lineTo(s * 0.8, 0.75)
        ctx.lineTo(s * 0.3, 0.6)
        ctx.closePath()
        fillAccent()
      }
      ctx.beginPath()
      ctx.moveTo(0, -1.1)
      ctx.bezierCurveTo(0.55, -0.6, 0.45, 0.4, 0.32, 0.75)
      ctx.lineTo(-0.32, 0.75)
      ctx.bezierCurveTo(-0.45, 0.4, -0.55, -0.6, 0, -1.1)
      fillBody()
      ctx.beginPath()
      ctx.moveTo(0, -1.1)
      ctx.bezierCurveTo(0.22, -0.9, 0.3, -0.75, 0.32, -0.65)
      ctx.lineTo(-0.32, -0.65)
      ctx.bezierCurveTo(-0.3, -0.75, -0.22, -0.9, 0, -1.1)
      fillAccent()
      cockpit(0, -0.15, 0.2, 0.2)
      break
    case 'star': {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        const r = i % 2 === 0 ? 1.05 : 0.5
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r + 0.1)
      }
      ctx.closePath()
      fillBody()
      ctx.beginPath()
      ctx.arc(0, 0.1, 0.3, 0, TAU)
      fillAccent()
      cockpit(0, 0.05, 0.2, 0.2)
      break
    }
    case 'shark':
      ctx.beginPath()
      ctx.moveTo(0, -1.1)
      ctx.quadraticCurveTo(0.5, -0.3, 0.9, 0.6)
      ctx.lineTo(0.2, 0.45)
      ctx.lineTo(0, 0.8)
      ctx.lineTo(-0.2, 0.45)
      ctx.lineTo(-0.9, 0.6)
      ctx.quadraticCurveTo(-0.5, -0.3, 0, -1.1)
      fillBody()
      ctx.beginPath()
      ctx.moveTo(-0.12, 0)
      ctx.lineTo(0, -0.5)
      ctx.lineTo(0.12, 0)
      ctx.closePath()
      fillAccent()
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 3; i++) {
        ctx.beginPath()
        ctx.moveTo(-0.5 + i * 0.1, 0.25)
        ctx.lineTo(-0.44 + i * 0.1, 0.12)
        ctx.lineTo(-0.38 + i * 0.1, 0.25)
        ctx.fill()
      }
      cockpit(0, -0.55, 0.13, 0.22)
      break
    case 'crown':
      ctx.beginPath()
      ctx.moveTo(-1, 0.65)
      ctx.lineTo(-1, -0.35)
      ctx.lineTo(-0.5, 0.05)
      ctx.lineTo(0, -0.85)
      ctx.lineTo(0.5, 0.05)
      ctx.lineTo(1, -0.35)
      ctx.lineTo(1, 0.65)
      ctx.closePath()
      fillBody()
      for (const [x, y] of [
        [-1, -0.35],
        [0, -0.85],
        [1, -0.35],
      ] as const) {
        ctx.beginPath()
        ctx.arc(x, y, 0.13, 0, TAU)
        fillAccent()
      }
      ctx.beginPath()
      ctx.rect(-1, 0.35, 2, 0.3)
      fillAccent()
      cockpit(0, 0.02, 0.24, 0.24)
      break
  }
}

/** Lighten (amount > 0) or darken (amount < 0) a #rrggbb colour. */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16)
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) =>
    Math.round(amount >= 0 ? c + (255 - c) * amount : c * (1 + amount)),
  )
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`
}

const glowCache = new Map<string, HTMLCanvasElement>()

/** Soft radial glow sprite, drawn with additive blending for neon light. */
export function glowSprite(color: string): HTMLCanvasElement {
  let c = glowCache.get(color)
  if (!c) {
    c = document.createElement('canvas')
    c.width = c.height = 64
    const g = c.getContext('2d')
    if (g) {
      const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.2, color)
      grad.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, 64, 64)
    }
    glowCache.set(color, c)
  }
  return c
}
