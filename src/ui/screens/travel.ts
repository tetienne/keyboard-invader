import { themeFor } from '../../content/campaign'
import { findShip } from '../../content/ships'
import { t } from '../../core/i18n'
import { clamp, easeOutBack, lerp } from '../../core/math'
import { drawShip, glowSprite } from '../../render/art'
import { FONT } from '../../render/game-view'
import type { App, Screen } from '../app'
import { h } from '../dom'

const DURATION = 2.6
/** Share of the trip spent in hyperspace before the new world shows up. */
const ARRIVAL = 0.35

/** Hyperspace hop to a new world, then its planet grows in. Any key or tap skips it. */
export function travelScreen(app: App, world: number, then: () => Screen): Screen {
  const ship = findShip(app.profile?.ship ?? '')
  const theme = themeFor(world)
  const text = t(`travel.${world}` as 'travel.0')
  let time = 0
  let arrived = false
  let done = false
  const finish = (): void => {
    if (done) return
    done = true
    app.go(then())
  }
  const el = h('div', { class: 'screen play', style: 'padding:0;pointer-events:auto' })
  el.addEventListener('pointerdown', finish)
  app.background.warp = 1
  app.background.setWarp(1)
  app.background.travel = 0.001
  app.sfx.warp()

  return {
    el,
    scene: 'game',
    world: Math.max(0, world - 1),
    update(dt) {
      time += dt
      const k = time / DURATION
      app.background.travel = clamp(k, 0.001, 1)
      if (!arrived && k > ARRIVAL) {
        arrived = true
        app.background.setTheme(theme)
        app.background.setWarp(0)
      }
      if (time >= DURATION) finish()
    },
    draw(ctx, w, height) {
      const k = time / DURATION
      const u = clamp(Math.min(w, height) * 0.05, 24, 60)
      const x = w / 2 + (k < ARRIVAL ? (Math.random() - 0.5) * 3 : 0)
      const y = lerp(height * 0.8, height * 0.72, easeOutBack(clamp(k / ARRIVAL, 0, 1)))
      ctx.save()
      ctx.translate(x, y)
      ctx.globalCompositeOperation = 'lighter'
      const flame = u * (1.4 + Math.random() * 0.3) * (k < ARRIVAL ? 1.6 : 1)
      ctx.drawImage(glowSprite(ship.accent), -flame / 2, u * 0.5, flame, flame * 1.6)
      ctx.globalCompositeOperation = 'source-over'
      ctx.scale(u, u)
      drawShip(ctx, ship, time)
      ctx.restore()

      const intro = clamp((k - ARRIVAL) / 0.2, 0, 1)
      if (intro <= 0) return
      const size = Math.round(clamp(w * 0.06, 32, 72))
      ctx.save()
      ctx.translate(w / 2, height * 0.2)
      ctx.font = `700 ${size}px ${FONT}`
      const fit = Math.min(1, (w * 0.9) / (ctx.measureText(text).width + size * 0.22))
      const s = easeOutBack(intro) * fit
      ctx.scale(s, s)
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineJoin = 'round'
      ctx.lineWidth = size * 0.22
      ctx.strokeStyle = '#1b1033'
      ctx.strokeText(text, 0, 0)
      ctx.fillStyle = theme.accent
      ctx.fillText(text, 0, 0)
      ctx.restore()
    },
    onKey(e) {
      if (!e.repeat) finish()
    },
    leave() {
      app.background.travel = 0
      app.background.setWarp(0)
      app.background.setTheme(theme)
    },
  }
}
