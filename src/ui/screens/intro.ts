import type { TrackId } from '../../audio/music'
import { themeFor } from '../../content/campaign'
import { CAMPAIGN_SHIP, findShip, SHIPS, type ShipDef } from '../../content/ships'
import { t } from '../../core/i18n'
import { clamp, easeOutBack, easeOutCubic, lerp, TAU } from '../../core/math'
import { createRng } from '../../core/rng'
import {
  drawAlien,
  drawShip,
  drawWorldBoss,
  glowSprite,
  palette,
  type Palette,
} from '../../render/art'
import { paintPlanet } from '../../render/background'
import { FONT } from '../../render/game-view'
import { Particles } from '../../render/particles'
import type { App, Screen } from '../app'
import { h } from '../dom'

type SceneId = 'galaxy' | 'villain' | 'gang' | 'chiefs' | 'hero' | 'hangar' | 'demo' | 'finale'

interface SceneDef {
  id: SceneId
  duration: number
  /** World whose sky paints the backdrop. */
  world: number
  music?: TrackId
}

const SCENES: readonly SceneDef[] = [
  { id: 'galaxy', duration: 5, world: 0 },
  { id: 'villain', duration: 5.5, world: 5, music: 'bossIntro' },
  { id: 'gang', duration: 5, world: 5 },
  { id: 'chiefs', duration: 6.2, world: 5 },
  { id: 'hero', duration: 4.5, world: 0, music: 'w0' },
  { id: 'hangar', duration: 5, world: 0 },
  // Ends early once the three aliens are gone.
  { id: 'demo', duration: 9, world: 0 },
  { id: 'finale', duration: 5, world: 0 },
]
const TOTAL = SCENES.reduce((sum, s) => sum + s.duration, 0)

const VILLAIN = 5
const INK = '#1b1033'
const LETTER_COLORS = ['#ffe066', '#5fd4ff', '#ff7aa8', '#7be07b', '#c985ff', '#ffae57']
/** Same keys on AZERTY and QWERTY, right under the index and middle fingers. */
const DEMO_LETTERS = ['f', 'j', 'd'] as const
const SHOT_TIME = 0.15
const GANG_WORD = { fr: 'clavier', en: 'keyboard' } as const

interface Twinkle {
  letter: string
  x: number
  y: number
  delay: number
  color: string
  phase: number
}

interface DemoAlien {
  letter: string
  firedAt: number | null
  boomAt: number | null
  x: number
  y: number
}

interface Floater {
  text: string
  x: number
  y: number
  born: number
  color: string
}

function makeTwinkles(): Twinkle[] {
  const rng = createRng(11)
  return Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map((letter, i) => ({
    letter: letter.toUpperCase(),
    x: 0.05 + rng() * 0.9,
    y: 0.06 + rng() * 0.84,
    delay: 0.5 + rng() * 2.4,
    color: LETTER_COLORS[i % LETTER_COLORS.length] ?? '#ffffff',
    phase: rng() * TAU,
  }))
}

function outlined(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  fill: string,
  scale = 1,
): void {
  if (scale <= 0) return
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(scale, scale)
  ctx.font = `700 ${Math.round(size)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.lineJoin = 'round'
  ctx.lineWidth = size * 0.22
  ctx.strokeStyle = INK
  ctx.strokeText(text, 0, 0)
  ctx.fillStyle = fill
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

function glowLetter(
  ctx: CanvasRenderingContext2D,
  letter: string,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number,
): void {
  if (alpha <= 0 || size <= 0) return
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.globalCompositeOperation = 'lighter'
  ctx.drawImage(glowSprite(color), x - size * 1.2, y - size * 1.2, size * 2.4, size * 2.4)
  ctx.globalCompositeOperation = 'source-over'
  outlined(ctx, letter, x, y, size, color)
  ctx.restore()
}

/** The white letter disc aliens carry in the game. */
function badge(
  ctx: CanvasRenderingContext2D,
  letter: string,
  x: number,
  y: number,
  r: number,
  ring: string,
): void {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, TAU)
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.lineWidth = Math.max(2, r * 0.16)
  ctx.strokeStyle = ring
  ctx.stroke()
  ctx.fillStyle = INK
  ctx.font = `700 ${Math.round(r * 1.35)}px ${FONT}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter.toUpperCase(), x, y + r * 0.06)
}

function alien(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  species: number,
  pal: Palette,
  time: number,
  rot = 0,
): void {
  if (r <= 0) return
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  ctx.scale(r, r)
  drawAlien(ctx, species, pal, {
    t: time,
    lookX: Math.sin(time * 0.8) * 0.6,
    lookY: 0.5,
    scared: false,
    blink: time % 3.3 < 0.12,
    flash: 0,
  })
  ctx.restore()
}

function boss(
  ctx: CanvasRenderingContext2D,
  world: number,
  x: number,
  y: number,
  r: number,
  time: number,
): void {
  if (r <= 0) return
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(r, r)
  drawWorldBoss(ctx, world, {
    t: time,
    lookX: Math.sin(time * 0.7) * 0.7,
    lookY: 0.4,
    scared: false,
    blink: time % 2.9 < 0.12,
    flash: 0,
  })
  ctx.restore()
}

/** `size` is half the ship's height. */
function ship(
  ctx: CanvasRenderingContext2D,
  def: ShipDef,
  x: number,
  y: number,
  size: number,
  time: number,
  rot = 0,
  flame = 1,
): void {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(rot)
  if (flame > 0) {
    ctx.globalCompositeOperation = 'lighter'
    const f = size * (1.3 + Math.random() * 0.3) * flame
    ctx.drawImage(glowSprite(def.accent), -f / 2, size * 0.5, f, f * 1.6)
    ctx.globalCompositeOperation = 'source-over'
  }
  ctx.scale(size, size)
  drawShip(ctx, def, time)
  ctx.restore()
}

/** Sucked-in spiral behind Doctor Swirl. */
function vortex(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  time: number,
  alpha: number,
): void {
  if (alpha <= 0) return
  ctx.save()
  ctx.translate(x, y)
  ctx.globalCompositeOperation = 'lighter'
  const dots = 30
  for (let arm = 0; arm < 3; arm++) {
    for (let j = 0; j < dots; j++) {
      const p = j / dots
      const a = (arm * TAU) / 3 + p * 5 - time * 2.5
      const d = r * (0.25 + p * 1.9)
      ctx.globalAlpha = alpha * (1 - p) * 0.8
      ctx.fillStyle = j % 2 ? '#ff4d6d' : '#c985ff'
      ctx.beginPath()
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d * 0.62, r * 0.06 * (1 - p * 0.5), 0, TAU)
      ctx.fill()
    }
  }
  ctx.restore()
}

/**
 * Opening cinematic: the galaxy, the villain, his gang, the hero, a playable
 * demo, then the logo. Space or Escape skips it all; Enter or a tap jumps to
 * the next scene.
 */
export function introScreen(app: App, then: () => Screen): Screen {
  const lang = app.settings.lang
  const hero = findShip(app.profile?.ship ?? 'comet')
  const legend = findShip(CAMPAIGN_SHIP)
  const fleet = SHIPS.filter((s) => !s.exclusive)
  const gangWord = GANG_WORD[lang]
  const twinkles = makeTwinkles()
  const particles = new Particles()
  const planets = new Map<string, HTMLCanvasElement>()

  let index = -1
  let st = 0
  let time = 0
  let done = false
  let cues = new Set<string>()
  let width = window.innerWidth
  let area = window.innerHeight * 0.78
  // Demo state, reset when the demo starts.
  let demo: DemoAlien[] = []
  let floaters: Floater[] = []
  let freed: Floater[] = []
  let autoAt = 0
  let lastShot = -1
  let combo = 0
  let clearedAt: number | null = null
  let aim = 0
  let nextFirework = 0

  const captionSlot = h('div', { class: 'intro-caption-slot' })
  const bar = h('i')
  const skip = h(
    'button',
    { class: 'btn ghost small intro-skip', onClick: () => finish() },
    t('introSkip'),
    ' ⏭',
    app.touchMode ? null : h('kbd', null, t('keySpace')),
  )
  const logo = h(
    'div',
    { class: 'intro-logo pop' },
    h('div', { class: 'logo' }, h('span', null, 'KEYBOARD'), h('span', null, 'INVADER')),
  )
  const el = h(
    'div',
    { class: 'screen intro' },
    skip,
    captionSlot,
    h('div', { class: 'intro-progress' }, bar),
  )
  el.addEventListener('click', (e) => {
    if (skip.contains(e.target as Node)) return
    if (SCENES[index]?.id === 'demo' && fireNext()) return
    enter(index + 1)
  })

  const unit = (): number => Math.min(width, area)
  const scene = (): SceneDef | undefined => SCENES[index]

  function finish(): void {
    if (done) return
    done = true
    app.store.data.introSeen = true
    app.save()
    app.go(then())
  }

  function enter(i: number): void {
    const def = SCENES[i]
    if (!def) {
      finish()
      return
    }
    index = i
    st = 0
    cues = new Set()
    particles.clear()
    const text = t(`intro.${def.id}`)
    captionSlot.replaceChildren(h('p', { class: 'intro-caption pop' }, text))
    app.voice.say(text, lang)
    app.background.setTheme(themeFor(def.world))
    app.background.showPlanet = def.id !== 'galaxy' && def.id !== 'villain'
    if (def.music && app.audio.ctx) app.music.play(def.music)
    if (def.id === 'hero') {
      app.background.jump()
      app.sfx.warp()
    }
    if (def.id === 'demo') {
      demo = DEMO_LETTERS.map((letter) => ({ letter, firedAt: null, boomAt: null, x: 0, y: 0 }))
      floaters = []
      freed = []
      autoAt = 2.4
      lastShot = -1
      combo = 0
      clearedAt = null
      aim = 0
    }
    if (def.id === 'finale') {
      el.append(logo)
      app.sfx.fanfare()
      nextFirework = 0.3
    } else logo.remove()
  }

  /** Runs `fn` once, the first frame the scene clock passes `at`. */
  function cue(at: number, key: string, fn: () => void): void {
    if (st >= at && !cues.has(key)) {
      cues.add(key)
      fn()
    }
  }

  function planetSprite(world: number, size: number): HTMLCanvasElement {
    const s = Math.max(16, Math.round(size / 8) * 8)
    const key = `${world}:${s}`
    let c = planets.get(key)
    if (!c) {
      c = paintPlanet(themeFor(world), s)
      planets.set(key, c)
    }
    return c
  }

  // ---- layout helpers (depend on the last drawn size) ----

  function planetSpot(i: number): { x: number; y: number; size: number } {
    // Portrait screens get two rows of three.
    const cols = width < area ? 3 : 6
    const col = i % cols
    const row = Math.floor(i / cols)
    const spread = Math.min((width * 0.9) / cols, area * 0.3)
    const wave = Math.sin(i * 1.7 + 0.4) * area * (cols === 6 ? 0.16 : 0.05)
    return {
      x: width / 2 + (col - (cols - 1) / 2) * spread,
      y: area * (cols === 6 ? 0.5 : 0.33 + row * 0.34) + wave,
      size: Math.min(spread * 0.72, area * 0.2),
    }
  }

  const demoShip = (): { x: number; y: number; size: number } => ({
    x: width / 2,
    y: area * 0.84,
    size: unit() * 0.06,
  })

  function demoAlienPos(i: number): { x: number; y: number; r: number } {
    const u = unit()
    return {
      x: width / 2 + (i - 1) * Math.min(width * 0.26, u * 0.5),
      y: lerp(area * 0.12, area * 0.45, clamp(st / 9, 0, 1)) + Math.sin(time * 2 + i) * u * 0.01,
      r: u * 0.055,
    }
  }

  function fire(a: DemoAlien): void {
    a.firedAt = st
    lastShot = st
    autoAt = st + 1.5
    app.sfx.shoot(combo * 4)
  }

  /** Fires at the leftmost alien still around; false once they are all gone. */
  function fireNext(): boolean {
    const a = demo.find((d) => d.firedAt === null)
    if (!a) return false
    fire(a)
    return true
  }

  // ---- per-scene updates ----

  function updateScene(def: SceneDef, dt: number): void {
    switch (def.id) {
      case 'galaxy':
        for (let i = 0; i < 6; i++) cue(0.3 + i * 0.35, `planet${i}`, () => app.sfx.star(i % 5))
        break
      case 'villain':
        cue(0.3, 'rumble', () => app.sfx.breach())
        cue(1, 'slurp', () => app.sfx.warp())
        cue(2.6, 'giggle', () => app.sfx.giggle())
        break
      case 'gang':
        for (let i = 0; i < gangWord.length; i++)
          cue(0.6 + i * 0.3, `pop${i}`, () => app.sfx.pop(i))
        cue(0.6 + gangWord.length * 0.3 + 0.3, 'giggle', () => app.sfx.giggle())
        break
      case 'chiefs':
        for (let i = 0; i < 6; i++) cue(0.3 + i * 0.75, `chief${i}`, () => app.sfx.combo(i + 1))
        break
      case 'hero':
        cue(1.3, 'you', () => {
          app.sfx.fanfare()
          particles.confetti(width * 0.05, area, 50, Math.max(600, area))
          particles.confetti(width * 0.95, area, 50, Math.max(600, area))
        })
        break
      case 'hangar':
        fleet.forEach((_, i) => cue(0.2 + i * 0.22, `ship${i}`, () => app.sfx.coin()))
        cue(2.4, 'legend', () => app.sfx.levelUp())
        if (Math.random() < dt * 14) {
          particles.add({
            kind: 'star',
            x: Math.random() * width,
            y: -10,
            vy: 120 + Math.random() * 80,
            color: '#ffd23f',
            size: 6 + Math.random() * 5,
            life: 2.4,
            drag: 0,
            gravity: 60,
            vr: (Math.random() - 0.5) * 6,
          })
        }
        break
      case 'demo':
        updateDemo()
        break
      case 'finale':
        nextFirework -= dt
        if (nextFirework <= 0) {
          nextFirework = 0.4 + Math.random() * 0.4
          particles.explosion(
            width * (0.1 + Math.random() * 0.8),
            area * (0.1 + Math.random() * 0.5),
            [LETTER_COLORS[Math.floor(Math.random() * LETTER_COLORS.length)] ?? '#fff', '#fff'],
            1 + Math.random() * 0.5,
          )
          if (Math.random() < 0.5) app.sfx.explode(Math.floor(Math.random() * 20))
        }
        break
    }
  }

  function updateDemo(): void {
    if (st >= autoAt && clearedAt === null) fireNext()
    demo.forEach((a, i) => {
      if (a.firedAt === null || a.boomAt !== null || st < a.firedAt + SHOT_TIME) return
      const p = demoAlienPos(i)
      a.boomAt = st
      a.x = p.x
      a.y = p.y
      const pal = palette(i)
      particles.explosion(p.x, p.y, [pal.body, pal.light, '#ffffff'], 1.1)
      app.sfx.explode(combo * 4)
      combo++
      const cheer = t(i === 0 ? 'callout.nice' : i === 1 ? 'callout.great' : 'callout.awesome')
      floaters.push({ text: cheer, x: p.x, y: p.y - p.r * 1.6, born: st, color: '#ffd23f' })
      freed.push({ text: a.letter.toUpperCase(), x: p.x, y: p.y, born: st, color: pal.body })
    })
    if (clearedAt === null && demo.every((a) => a.boomAt !== null)) clearedAt = st + 0.5
    if (clearedAt !== null) {
      cue(clearedAt, 'bravo', () => {
        app.sfx.levelUp()
        particles.confetti(width * 0.1, area, 50, Math.max(600, area))
        particles.confetti(width * 0.9, area, 50, Math.max(600, area))
      })
    }
  }

  function sceneOver(def: SceneDef): boolean {
    if (def.id === 'demo' && clearedAt !== null) return st >= clearedAt + 1.8
    return st >= def.duration
  }

  // ---- per-scene drawing ----

  function drawPlanets(ctx: CanvasRenderingContext2D, alpha: number, popFrom: number | null): void {
    for (let i = 0; i < 6; i++) {
      const p = planetSpot(i)
      const s = popFrom === null ? 1 : easeOutBack(clamp((st - popFrom - i * 0.35) / 0.5, 0, 1))
      if (s <= 0) continue
      const sprite = planetSprite(i, p.size)
      const sw = sprite.width * s
      const sh = sprite.height * s
      const y = p.y + Math.sin(time * 1.2 + i) * p.size * 0.06
      ctx.globalAlpha = alpha
      ctx.drawImage(sprite, p.x - sw / 2, y - sh / 2, sw, sh)
    }
    ctx.globalAlpha = 1
  }

  function drawGalaxy(ctx: CanvasRenderingContext2D): void {
    drawPlanets(ctx, 1, 0.3)
    const size = unit() * 0.05
    for (const tw of twinkles) {
      const a = clamp((st - tw.delay) / 0.5, 0, 1)
      const pulse = 1 + 0.15 * Math.sin(time * 3 + tw.phase)
      const y = tw.y * area + Math.sin(time + tw.phase) * size * 0.3
      glowLetter(ctx, tw.letter, tw.x * width, y, size * pulse * easeOutBack(a), tw.color, a)
    }
  }

  function drawVillain(ctx: CanvasRenderingContext2D): void {
    const u = unit()
    const cx = width / 2
    const cy = area * 0.45
    const R = u * 0.2
    drawPlanets(ctx, lerp(1, 0.3, clamp(st, 0, 1)), null)
    vortex(ctx, cx, cy, R * 1.4, time, clamp(st / 0.8, 0, 1))
    const shake = st > 0.3 && st < 1.1 ? (1.1 - st) * u * 0.02 : 0

    const size = u * 0.05
    twinkles.forEach((tw, i) => {
      const p = clamp((st - 0.9 - i * 0.05) / 1.3, 0, 1)
      const k = p * p
      const x0 = tw.x * width - cx
      const y0 = tw.y * area - cy
      const r = Math.hypot(x0, y0) * (1 - k)
      const a = Math.atan2(y0, x0) + k * 4
      const fade = p < 0.85 ? 1 : 1 - (p - 0.85) / 0.15
      glowLetter(
        ctx,
        tw.letter,
        cx + Math.cos(a) * r,
        cy + Math.sin(a) * r,
        size * (1 - k * 0.7),
        tw.color,
        fade,
      )
    })

    const grow = easeOutBack(clamp((st - 0.3) / 0.9, 0, 1))
    ctx.save()
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake)
    // Wobbles with laughter once the letters are gone.
    const laugh = st > 2.6 && st < 3.4 ? Math.sin(st * 40) * 0.06 : 0
    boss(ctx, VILLAIN, cx, cy, R * grow * (1 + laugh), time)
    ctx.restore()
    const name = easeOutBack(clamp((st - 2.2) / 0.5, 0, 1))
    outlined(ctx, t('boss.5'), cx, cy + R * 1.45, u * 0.07, themeFor(VILLAIN).accent, name)
  }

  function drawGang(ctx: CanvasRenderingContext2D): void {
    const u = unit()
    const move = easeOutCubic(clamp(st / 0.8, 0, 1))
    const bx = width / 2
    const by = lerp(area * 0.45, area * 0.2, move)
    const R = u * lerp(0.2, 0.13, move)
    vortex(ctx, bx, by, R * 1.4, time, 1)
    boss(ctx, VILLAIN, bx, by, R, time)

    const n = gangWord.length
    const gap = Math.min(width * 0.9, u * 1.6) / n
    const r = Math.min(gap * 0.36, area * 0.075)
    for (let i = 0; i < n; i++) {
      const at = 0.6 + i * 0.3
      const x = width / 2 + (i - (n - 1) / 2) * gap
      const y = area * 0.66
      const by2 = y + r * 1.05
      const br = Math.max(12, r * 0.55)
      const letter = gangWord[i] ?? ''
      const pal = palette(i)
      // The letter is tossed from the boss to the alien.
      const f = clamp((st - at + 0.3) / 0.3, 0, 1)
      if (f > 0 && f < 1) {
        const lx = lerp(bx, x, f)
        const ly = lerp(by, by2, f) - Math.sin(f * Math.PI) * area * 0.15
        glowLetter(ctx, letter.toUpperCase(), lx, ly, br * 1.3, LETTER_COLORS[i % 6] ?? '#fff', 1)
      }
      const s = easeOutBack(clamp((st - at) / 0.35, 0, 1))
      if (s <= 0) continue
      const hop = Math.abs(Math.sin(time * 5 + i)) * r * 0.25
      alien(ctx, x, y - hop, r * s, i % 6, pal, time + i, Math.sin(time * 3 + i) * 0.15)
      badge(ctx, letter, x, by2 - hop, br * s, pal.dark)
    }
  }

  function drawChiefs(ctx: CanvasRenderingContext2D): void {
    const wide = width / area > 1.5
    const cols = wide ? 6 : 3
    const rows = wide ? 1 : 2
    const cellW = (width * 0.94) / cols
    const cellH = (area * 0.94) / rows
    const R = Math.min(cellW * 0.3, cellH * 0.28)
    const label = clamp(Math.min(cellW * 0.12, R * 0.42), 13, 30)
    for (let i = 0; i < 6; i++) {
      const s = easeOutBack(clamp((st - 0.3 - i * 0.75) / 0.45, 0, 1))
      if (s <= 0) continue
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = width * 0.03 + cellW * (col + 0.5)
      const y = area * 0.03 + cellH * (row + 0.5) - R * 0.25
      const accent = themeFor(i).accent
      ctx.globalAlpha = 0.6 * s
      ctx.globalCompositeOperation = 'lighter'
      ctx.drawImage(glowSprite(accent), x - R * 1.8, y - R * 1.8, R * 3.6, R * 3.6)
      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      boss(ctx, i, x, y, R * s, time + i)
      outlined(ctx, t(`boss.${i}` as 'boss.0'), x, y + R * 1.35, label, accent, s)
    }
  }

  function drawHero(ctx: CanvasRenderingContext2D): void {
    const u = unit()
    const size = u * 0.13
    const k = easeOutBack(clamp(st / 1.1, 0, 1))
    const x = width / 2 + Math.sin(time * 1.5) * u * 0.02
    const y = lerp(area + size * 3, area * 0.58, k)
    ship(ctx, hero, x, y, size, time, Math.sin(time * 2) * 0.08, 1.4)
    const you = easeOutBack(clamp((st - 1.3) / 0.5, 0, 1))
    const wobble = 1 + Math.sin(time * 6) * 0.04
    outlined(ctx, t('introYou'), width / 2, area * 0.2, u * 0.16, '#ffd23f', you * wobble)
  }

  function drawHangar(ctx: CanvasRenderingContext2D): void {
    const u = unit()
    const n = fleet.length
    const rx = Math.min(width * 0.42, u * 0.85)
    const ry = area * 0.3
    const size = Math.min((rx * 2) / n / 2.6, area * 0.07)
    fleet.forEach((def, i) => {
      const s = easeOutBack(clamp((st - 0.2 - i * 0.22) / 0.4, 0, 1))
      if (s <= 0) return
      const a = Math.PI * (0.92 - (0.84 * i) / (n - 1))
      const x = width / 2 + Math.cos(a) * rx
      const y = area * 0.42 + Math.sin(a) * ry + Math.sin(time * 2 + i) * size * 0.15
      ship(ctx, def, x, y, size * s, time + i, Math.sin(time * 1.5 + i) * 0.12, 0.8)
    })

    const k = easeOutBack(clamp((st - 2.4) / 0.6, 0, 1))
    if (k <= 0) return
    const cx = width / 2
    const cy = area * 0.4
    const big = Math.min(u * 0.11, area * 0.14) * k
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(time * 0.4)
    ctx.globalCompositeOperation = 'lighter'
    const rays = 10
    for (let i = 0; i < rays; i++) {
      ctx.globalAlpha = 0.14 * k
      ctx.fillStyle = LETTER_COLORS[i % LETTER_COLORS.length] ?? '#fff'
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, big * 5, (i / rays) * TAU, ((i + 0.5) / rays) * TAU)
      ctx.closePath()
      ctx.fill()
    }
    ctx.globalAlpha = 0.8 * k
    ctx.drawImage(glowSprite('#ffd23f'), -big * 2.5, -big * 2.5, big * 5, big * 5)
    ctx.restore()
    ship(ctx, legend, cx, cy + Math.sin(time * 2) * big * 0.1, big, time, 0, 1)
    outlined(ctx, '? ? ?', cx, cy + big * 1.9, big * 0.55, '#ffd23f', k)
  }

  function drawDemo(ctx: CanvasRenderingContext2D): void {
    const u = unit()
    const sh = demoShip()
    const target = demo.find((a) => a.firedAt !== null && a.boomAt === null)
    let goal = 0
    if (target) {
      const p = demoAlienPos(demo.indexOf(target))
      goal = clamp(Math.atan2(p.x - sh.x, sh.y - p.y), -0.6, 0.6)
    }
    aim = lerp(aim, goal, 0.25)

    demo.forEach((a, i) => {
      const pal = palette(i)
      if (a.boomAt !== null) {
        // Off it goes, spinning back home.
        const k = (st - a.boomAt) / 0.45
        if (k < 1) alien(ctx, a.x, a.y - k * u * 0.1, u * 0.055 * (1 - k), i, pal, time, k * 6)
        return
      }
      const p = demoAlienPos(i)
      alien(ctx, p.x, p.y, p.r, i, pal, time + i)
      const next = demo.find((d) => d.firedAt === null) === a
      const br = Math.max(14, p.r * 0.62)
      if (next) {
        ctx.beginPath()
        ctx.arc(p.x, p.y + p.r * 0.95, br + 5 + Math.sin(time * 6) * 3, 0, TAU)
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 3
        ctx.stroke()
      }
      badge(ctx, a.letter, p.x, p.y + p.r * 0.95, br, a.firedAt === null ? pal.dark : '#ffd23f')
      if (a.firedAt !== null) {
        const k = clamp((st - a.firedAt) / SHOT_TIME, 0, 1)
        const nx = sh.x + Math.sin(aim) * sh.size
        const ny = sh.y - Math.cos(aim) * sh.size
        const hx = lerp(nx, p.x, k)
        const hy = lerp(ny, p.y, k)
        ctx.lineCap = 'round'
        ctx.strokeStyle = '#5fd4ff'
        ctx.lineWidth = 7
        ctx.globalAlpha = 0.5
        ctx.beginPath()
        ctx.moveTo(nx, ny)
        ctx.lineTo(hx, hy)
        ctx.stroke()
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.globalAlpha = 1
        ctx.stroke()
        const g = u * 0.04
        ctx.drawImage(glowSprite('#5fd4ff'), hx - g, hy - g, g * 2, g * 2)
      }
    })

    const recoil = st - lastShot < 0.12 ? u * 0.008 : 0
    ship(ctx, hero, sh.x, sh.y + recoil, sh.size, time, aim, 1)

    // Keycap showing which key to press next.
    const next = demo.find((d) => d.firedAt === null)
    if (next) {
      const ks = clamp(u * 0.07, 40, 70)
      const kx = sh.x + sh.size * 2.2 + ks * 0.8
      const press = st - lastShot < 0.15 ? ks * 0.08 : 0
      const bob = Math.sin(time * 5) * ks * 0.04
      const ky = sh.y - ks / 2 + bob
      ctx.fillStyle = '#9a8cc9'
      ctx.beginPath()
      ctx.roundRect(kx, ky + ks * 0.1, ks, ks, ks * 0.18)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = INK
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.roundRect(kx, ky + press, ks, ks * 0.92, ks * 0.18)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = INK
      ctx.font = `700 ${Math.round(ks * 0.55)}px ${FONT}`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(next.letter.toUpperCase(), kx + ks / 2, ky + press + ks * 0.47)
      outlined(ctx, t('introTry'), kx + ks / 2, ky - ks * 0.35, ks * 0.32, '#ffffff')
    }

    // Freed letters fly back up to the stars.
    for (const f of freed) {
      const k = (st - f.born) / 1.4
      if (k >= 1) continue
      glowLetter(ctx, f.text, f.x, lerp(f.y, -u * 0.1, k * k), u * 0.05, f.color, 1)
    }
    for (const f of floaters) {
      const k = (st - f.born) / 0.9
      if (k >= 1) continue
      ctx.globalAlpha = 1 - k
      outlined(
        ctx,
        f.text,
        f.x,
        f.y - k * u * 0.08,
        u * 0.045,
        f.color,
        easeOutBack(clamp(k * 4, 0, 1)),
      )
      ctx.globalAlpha = 1
    }
    if (clearedAt !== null) {
      const k = easeOutBack(clamp((st - clearedAt) / 0.5, 0, 1))
      outlined(ctx, t('introBravo'), width / 2, area * 0.35, u * 0.13, '#7be07b', k)
    }
  }

  function drawFinale(ctx: CanvasRenderingContext2D): void {
    const u = unit()
    const a = st * 1.6 - Math.PI / 2
    const rx = Math.min(width * 0.42, u * 0.8)
    const ry = area * 0.36
    const x = width / 2 + Math.cos(a) * rx
    const y = area * 0.45 + Math.sin(a) * ry
    const size = u * 0.05
    // Nose follows the loop's tangent.
    const rot = Math.atan2(Math.cos(a) * ry, -Math.sin(a) * rx) + Math.PI / 2
    particles.add({ kind: 'glow', x, y, color: hero.accent, size: size * 0.9, life: 0.35, drag: 0 })
    ship(ctx, hero, x, y, size, time, rot, 0)
  }

  enter(0)

  return {
    el,
    scene: 'game',
    music: 'menu',
    world: 0,
    update(dt) {
      if (done) return
      time += dt
      st += dt
      const def = scene()
      if (!def) return
      updateScene(def, dt)
      particles.update(dt)
      if (sceneOver(def)) enter(index + 1)
    },
    draw(ctx, w, height) {
      width = w
      const top = captionSlot.getBoundingClientRect().top
      area = top > height * 0.4 ? top - 8 : height * 0.78
      const def = scene()
      if (def) {
        const before = SCENES.slice(0, index).reduce((sum, s) => sum + s.duration, 0)
        const progress = (before + Math.min(st, def.duration)) / TOTAL
        bar.style.width = `${(progress * 100).toFixed(1)}%`
        switch (def.id) {
          case 'galaxy':
            drawGalaxy(ctx)
            break
          case 'villain':
            drawVillain(ctx)
            break
          case 'gang':
            drawGang(ctx)
            break
          case 'chiefs':
            drawChiefs(ctx)
            break
          case 'hero':
            drawHero(ctx)
            break
          case 'hangar':
            drawHangar(ctx)
            break
          case 'demo':
            drawDemo(ctx)
            break
          case 'finale':
            drawFinale(ctx)
            break
        }
      }
      particles.draw(ctx)
    },
    onKey(e) {
      if (e.repeat) return
      if (e.key === ' ' || e.key === 'Escape') finish()
      else if (e.key === 'Enter' || e.key === 'ArrowRight') enter(index + 1)
      else if (scene()?.id === 'demo') {
        const key = e.key.toLowerCase()
        const a = demo.find((d) => d.firedAt === null && d.letter === key)
        if (a) fire(a)
      }
    },
    leave() {
      app.voice.stop()
      app.background.showPlanet = true
      logo.remove()
    },
  }
}
