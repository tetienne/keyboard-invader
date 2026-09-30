import { LASERS, SHIPS } from '../../content/ships'
import { formatNumber, t } from '../../core/i18n'
import { buy, levelInfo } from '../../game/progression'
import { awardTrophies } from '../../game/trophies'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { backButton, coinChip, shipCanvas } from '../widgets'
import { hubScreen } from './hub'

export function hangarScreen(app: App, tab: 'ships' | 'lasers' = 'ships'): Screen {
  const profile = app.profile
  if (!profile) return hubScreen(app)
  const lang = app.settings.lang
  const level = levelInfo(profile.xp).level
  const ticks: ((time: number) => void)[] = []

  const purchase = (
    kind: 'ship' | 'laser',
    item: { id: string; price: number; minLevel?: number },
  ): void => {
    const outcome = buy(profile, kind, item)
    if (outcome === 'ok') {
      awardTrophies(profile)
      app.save()
      app.sfx.chest()
      app.menuScene.particles.confetti(window.innerWidth / 2, window.innerHeight * 0.6, 90, 900)
      app.go(hangarScreen(app, tab))
    } else {
      app.sfx.mistake()
    }
  }

  const equip = (kind: 'ship' | 'laser', id: string): void => {
    if (kind === 'ship') profile.ship = id
    else profile.laser = id
    app.save()
    app.sfx.powerup()
    app.go(hangarScreen(app, tab))
  }

  const action = (
    kind: 'ship' | 'laser',
    item: { id: string; price: number; minLevel?: number },
  ): HTMLElement => {
    const owned = (kind === 'ship' ? profile.ships : profile.lasers).includes(item.id)
    const equipped = (kind === 'ship' ? profile.ship : profile.laser) === item.id
    if (equipped)
      return h('button', { class: 'btn green small', disabled: true }, '✔ ', t('equipped'))
    if (owned)
      return h(
        'button',
        { class: 'btn blue small', onClick: () => equip(kind, item.id) },
        t('equip'),
      )
    if ((item.minLevel ?? 1) > level)
      return h(
        'button',
        { class: 'btn ghost small', disabled: true },
        '🔒 ',
        t('needLevel', { n: item.minLevel ?? 1 }),
      )
    return h(
      'button',
      {
        class: 'btn small',
        disabled: profile.coins < item.price,
        onClick: () => purchase(kind, item),
      },
      '🪙 ',
      formatNumber(item.price),
    )
  }

  const items =
    tab === 'ships'
      ? SHIPS.map((ship) => {
          const preview = shipCanvas(ship, 130)
          ticks.push(preview.tick)
          return h(
            'div',
            { class: `shop-item pop${profile.ship === ship.id ? ' equipped' : ''}` },
            preview.canvas,
            h('div', { class: 'nm' }, ship.name[lang]),
            action('ship', ship),
          )
        })
      : LASERS.map((laser) => {
          const grad =
            laser.colors.length > 1
              ? `linear-gradient(180deg, ${laser.colors.join(',')})`
              : (laser.colors[0] ?? '#fff')
          return h(
            'div',
            { class: `shop-item pop${profile.laser === laser.id ? ' equipped' : ''}` },
            h(
              'div',
              {
                class: 'laser-swatch',
                style: `background: radial-gradient(circle, ${laser.colors[0] ?? '#fff'}33, transparent 70%)`,
              },
              h('i', { style: `background:${grad};color:${laser.colors[0] ?? '#fff'}` }),
            ),
            h('div', { class: 'nm' }, laser.name[lang]),
            action('laser', laser),
          )
        })

  const tabBtn = (id: 'ships' | 'lasers', label: string): HTMLElement =>
    h(
      'button',
      {
        class: `btn small ${tab === id ? 'purple' : 'ghost'}`,
        onClick: () => app.go(hangarScreen(app, id)),
      },
      label,
    )

  const el = h(
    'div',
    { class: 'screen scroll' },
    h(
      'div',
      { class: 'topbar' },
      backButton(() => app.go(hubScreen(app))),
      coinChip(profile.coins),
    ),
    h('h1', { class: 'title', style: 'margin-top:60px' }, '🛠️ ', t('hangar')),
    h(
      'div',
      { class: 'tabs' },
      tabBtn('ships', `🚀 ${t('ships')}`),
      tabBtn('lasers', `⚡ ${t('lasers')}`),
    ),
    h('div', { class: 'shop-grid' }, ...items),
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
