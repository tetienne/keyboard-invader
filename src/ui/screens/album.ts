import { campaign, type WorldTheme } from '../../content/campaign'
import { t } from '../../core/i18n'
import { isCampaignComplete, worldBadges } from '../../game/progression'
import { drawBoss, type Palette } from '../../render/art'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { backButton } from '../widgets'
import { diplomaScreen } from './diploma'
import { hubScreen } from './hub'

const themePalette = (theme: WorldTheme): Palette => ({
  body: theme.accent,
  dark: theme.planet.shade,
  light: theme.planet.glow,
})

/** Small animated canvas of a world's boss. */
function bossCanvas(
  theme: WorldTheme,
  size: number,
): {
  canvas: HTMLCanvasElement
  tick: (time: number) => void
} {
  const canvas = document.createElement('canvas')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = canvas.height = size * dpr
  canvas.style.width = canvas.style.height = `${size}px`
  const ctx = canvas.getContext('2d')
  const p = themePalette(theme)
  const tick = (time: number): void => {
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    // drawBoss spans about x ±1.25 and y -0.9..1.6 (tractor beam included).
    ctx.translate(size / 2, size * 0.42)
    ctx.scale(size * 0.34, size * 0.34)
    drawBoss(
      ctx,
      p,
      {
        t: time,
        lookX: Math.sin(time * 0.8),
        lookY: Math.cos(time * 0.6) * 0.5,
        scared: false,
        blink: time % 3.5 < 0.12,
        flash: 0,
      },
      1,
    )
  }
  tick(0)
  return { canvas, tick }
}

export function albumScreen(app: App): Screen {
  const profile = app.profile
  if (!profile) return hubScreen(app)
  const layout = app.settings.layout
  const worlds = campaign(layout)
  const badges = worldBadges(profile, layout)
  const ticks: ((time: number) => void)[] = []
  const stickers = badges.filter((b) => b.sticker).length
  const medals = badges.filter((b) => b.medal).length

  const cards = worlds.map((w, i) => {
    const b = badges[i]
    const got = b?.sticker ?? false
    const art = bossCanvas(w.theme, 130)
    if (got) ticks.push(art.tick)
    const { base, glow, shade } = w.theme.planet
    return h(
      'div',
      {
        class: `sticker pop ${got ? 'got' : 'locked'}`,
        style: `animation-delay:${i * 60}ms;--tilt:${(i % 2 ? 1 : -1) * (1.5 + (i % 3))}deg`,
      },
      h(
        'div',
        {
          class: 'sticker-art',
          style: `background: radial-gradient(circle at 35% 30%, ${glow}, ${base} 50%, ${shade})`,
        },
        art.canvas,
        got ? null : h('span', { class: 'sticker-q' }, '?'),
      ),
      h('b', null, got ? t(`world.${w.index}` as 'world.0') : '? ? ?'),
      h(
        'div',
        { class: 'sticker-meta' },
        h('span', null, h('span', { class: 'star-on' }, '★'), ` ${b?.stars ?? 0}/${b?.maxStars}`),
        h('span', { class: `medal${b?.medal ? ' on' : ''}` }, '🏅'),
      ),
    )
  })

  const el = h(
    'div',
    { class: 'screen scroll' },
    h(
      'div',
      { class: 'topbar' },
      backButton(() => app.go(hubScreen(app))),
      isCampaignComplete(profile, layout)
        ? h(
            'button',
            { class: 'btn small', onClick: () => app.go(diplomaScreen(app, 'album')) },
            '📜 ',
            t('diploma'),
          )
        : null,
    ),
    h('h1', { class: 'title', style: 'margin-top:60px' }, '🌟 ', t('album')),
    h(
      'div',
      { class: 'row' },
      h('div', { class: 'chip' }, '🌟 ', t('albumStickers', { n: stickers, total: worlds.length })),
      h('div', { class: 'chip' }, '🏅 ', t('albumMedals', { n: medals, total: worlds.length })),
    ),
    h('p', { class: 'subtitle' }, t('albumHint')),
    h('div', { class: 'sticker-grid' }, ...cards),
  )
  let time = 0
  return {
    el,
    scene: 'menu',
    music: 'menu',
    update: (dt) => {
      time += dt
      for (const tick of ticks) tick(time)
    },
    onKey: (e) => {
      if (e.key === 'Escape') app.go(hubScreen(app))
    },
  }
}
