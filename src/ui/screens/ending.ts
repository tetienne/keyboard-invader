import { CAMPAIGN_SHIP, findShip } from '../../content/ships'
import { TAU } from '../../core/math'
import { t } from '../../core/i18n'
import { drawAlien, drawShip, glowSprite, palette } from '../../render/art'
import { Particles } from '../../render/particles'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { diplomaScreen } from './diploma'
import { hubScreen } from './hub'
import { mapScreen } from './map'

const FIREWORK_COLORS: readonly (readonly string[])[] = [
  ['#ffd23f', '#ff9f1c', '#ffffff'],
  ['#ff5fa2', '#c985ff', '#ffffff'],
  ['#5fd4ff', '#7be07b', '#ffffff'],
  ['#ffae57', '#ff4d6d', '#ffe066'],
]

/** The campaign climax: the new ship parades with dancing aliens under fireworks. */
export function endingScreen(app: App): Screen {
  const profile = app.profile
  if (!profile) return hubScreen(app)
  const ship = findShip(CAMPAIGN_SHIP)
  const particles = new Particles()
  const toDiploma = (): void => app.go(diplomaScreen(app))
  const toMap = (): void => app.go(mapScreen(app))

  const head = h(
    'div',
    { class: 'ending-head' },
    h('div', { class: 'ending-crown pop' }, '🌟'),
    h('h1', { class: 'title ending-title pop' }, t('endingTitle')),
    h('p', { class: 'subtitle pop' }, t('endingSub', { name: profile.name })),
    h(
      'div',
      { class: 'ending-reward pop' },
      h('small', null, t('endingReward')),
      h('b', null, '✨ ', ship.name[app.settings.lang], ' ✨'),
    ),
  )
  const actions = h(
    'div',
    { class: 'row ending-actions pop' },
    h('button', { class: 'btn big green', onClick: toDiploma }, '📜 ', t('seeDiploma')),
    h('button', { class: 'btn ghost', onClick: toMap }, '🗺️ ', t('map')),
  )
  const el = h('div', { class: 'screen ending' }, head, actions)

  app.sfx.fanfare()
  const cheers = [
    setTimeout(() => app.sfx.levelUp(), 1300),
    setTimeout(() => app.sfx.fanfare(), 3200),
  ]
  app.background.jump()

  let time = 0
  let nextFirework = 0.2
  let nextConfetti = 0
  let width = window.innerWidth
  let height = window.innerHeight

  return {
    el,
    scene: 'game',
    music: 'menu',
    world: 0,
    update(dt) {
      time += dt
      nextFirework -= dt
      nextConfetti -= dt
      if (nextFirework <= 0) {
        nextFirework = 0.35 + Math.random() * 0.5
        const colors = FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)] ?? []
        particles.explosion(
          width * (0.1 + Math.random() * 0.8),
          height * (0.08 + Math.random() * 0.45),
          colors,
          1 + Math.random() * 0.6,
        )
        if (Math.random() < 0.5) app.sfx.explode(Math.floor(Math.random() * 20))
      }
      if (nextConfetti <= 0) {
        nextConfetti = 1.6
        particles.confetti(width * 0.05, height, 60, Math.max(700, height * 1.1))
        particles.confetti(width * 0.95, height, 60, Math.max(700, height * 1.1))
      }
      particles.update(dt)
    },
    draw(ctx, w, hgt) {
      width = w
      height = hgt
      const unit = Math.min(w, hgt)
      // Keep the parade in the free band between the text and the buttons.
      const top = head.getBoundingClientRect().bottom
      const band = Math.max(unit * 0.3, actions.getBoundingClientRect().top - top)
      const cx = w / 2
      const cy = top + band * 0.4
      const size = Math.min(unit * 0.11, band * 0.2)

      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(time * 0.25)
      ctx.globalCompositeOperation = 'lighter'
      const rays = 12
      const rainbow = ['#ff5fa2', '#ffae57', '#ffe066', '#7be07b', '#5fd4ff', '#c985ff']
      for (let i = 0; i < rays; i++) {
        ctx.globalAlpha = 0.12
        ctx.fillStyle = rainbow[i % rainbow.length] ?? '#fff'
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.arc(0, 0, unit * 0.9, (i / rays) * TAU, ((i + 0.5) / rays) * TAU)
        ctx.closePath()
        ctx.fill()
      }
      ctx.globalAlpha = 0.7
      ctx.drawImage(glowSprite('#ffd23f'), -size * 3, -size * 3, size * 6, size * 6)
      ctx.restore()

      const n = 6
      const rx = Math.min(w * 0.42, unit * 0.7)
      const ry = band * 0.32
      for (let i = 0; i < n; i++) {
        const a = Math.PI * (0.08 + (0.84 * i) / (n - 1))
        const r = Math.min(unit * 0.045, band * 0.09)
        const hop = Math.abs(Math.sin(time * 4 + i * 0.9)) * r * 0.8
        const x = cx + Math.cos(a) * rx
        const y = cy + Math.sin(a) * ry + r - hop
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(Math.sin(time * 3 + i) * 0.25)
        ctx.scale(r, r)
        drawAlien(ctx, i, palette(i), {
          t: time + i,
          lookX: cx > x ? 0.8 : -0.8,
          lookY: -0.6,
          scared: false,
          blink: (time + i * 0.7) % 3 < 0.12,
          flash: 0,
        })
        ctx.restore()
      }

      ctx.save()
      ctx.translate(cx + Math.sin(time * 1.2) * unit * 0.03, cy + Math.sin(time * 2) * unit * 0.02)
      ctx.rotate(Math.sin(time * 1.2) * 0.12)
      ctx.scale(size, size)
      drawShip(ctx, ship, time)
      ctx.restore()

      particles.draw(ctx)
    },
    onKey(e) {
      // Kids mash keys: the Enter that opened this screen must not skip it.
      if (e.repeat || time < 1.2) return
      if (e.key === 'Enter' || e.key === ' ') toDiploma()
      else if (e.key === 'Escape') toMap()
    },
    leave() {
      for (const c of cheers) clearTimeout(c)
    },
  }
}
