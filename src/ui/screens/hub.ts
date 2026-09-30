import { formatNumber, t } from '../../core/i18n'
import { claimDaily, dailyAvailable } from '../../game/progression'
import { TROPHIES } from '../../game/trophies'
import { totalStars } from '../../state/profile'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { coinChip, pilotBar, shipCanvas, starChip } from '../widgets'
import { hangarScreen } from './hangar'
import { mapScreen } from './map'
import { endlessLaunch, gameScreen } from './game'
import { profilesScreen } from './profiles'
import { openSettings } from './settings'
import { trophiesScreen } from './trophies'

export function hubScreen(app: App): Screen {
  const profile = app.profile
  if (!profile) return profilesScreen(app)

  const ship = shipCanvas(profile.ship, 150)
  const card = (
    cls: string,
    emoji: string,
    title: string,
    sub: string,
    onClick: () => void,
    badge?: string,
  ): HTMLElement =>
    h(
      'button',
      { class: `hub-card ${cls} pop`, onClick },
      badge ? h('span', { class: 'badge' }, badge) : null,
      h('span', { class: 'big-emoji' }, emoji),
      h('b', null, title),
      h('span', null, sub),
    )

  const el = h(
    'div',
    { class: 'screen' },
    h(
      'div',
      { class: 'topbar' },
      pilotBar(profile),
      h(
        'div',
        { class: 'row' },
        starChip(totalStars(profile)),
        coinChip(profile.coins),
        h(
          'button',
          {
            class: 'btn ghost icon-btn',
            title: t('settings'),
            onClick: () => openSettings(app, () => app.go(hubScreen(app))),
          },
          '⚙️',
        ),
        h(
          'button',
          {
            class: 'btn ghost icon-btn',
            title: t('switchPilot'),
            onClick: () => app.go(profilesScreen(app)),
          },
          '👥',
        ),
      ),
    ),
    h(
      'div',
      { class: 'hub-grid' },
      card('adventure', '🚀', t('adventure'), `★ ${totalStars(profile)}`, () =>
        app.go(mapScreen(app)),
      ),
      card(
        'endless',
        '♾️',
        t('endless'),
        t('endlessRecord', { score: formatNumber(profile.endlessBest) }),
        () => app.go(gameScreen(app, endlessLaunch())),
      ),
      card('hangar', '🛠️', t('hangar'), `🪙 ${formatNumber(profile.coins)}`, () =>
        app.go(hangarScreen(app)),
      ),
      card(
        'trophies',
        '🏆',
        t('trophies'),
        t('trophiesCount', { n: profile.trophies.length, total: TROPHIES.length }),
        () => app.go(trophiesScreen(app)),
      ),
    ),
    h('div', { style: 'pointer-events:none' }, ship.canvas),
  )

  if (dailyAvailable(profile, new Date())) setTimeout(() => showDaily(app), 500)

  let time = 0
  return {
    el,
    scene: 'menu',
    music: 'menu',
    update: (dt) => {
      time += dt
      ship.tick(time)
    },
    onKey: (e) => {
      if (e.key === 'Enter' || e.key === ' ') app.go(mapScreen(app))
      else if (e.key === 'Escape') app.go(profilesScreen(app))
    },
  }
}

function showDaily(app: App): void {
  const profile = app.profile
  if (!profile || !dailyAvailable(profile, new Date())) return
  const chest = h('div', { class: 'chest' }, '🎁')
  const open = h('button', { class: 'btn big' }, t('dailyOpen'))
  const body = h(
    'div',
    { class: 'dialog panel pop' },
    h('h2', { class: 'title' }, t('dailyTitle')),
    chest,
    open,
  )
  let claimed = false
  const close = app.modal(body, () => {
    if (claimed) app.go(hubScreen(app))
  })
  const reveal = (): void => {
    const gift = claimDaily(profile, new Date())
    if (!gift) return
    claimed = true
    app.save()
    app.sfx.chest()
    chest.textContent = '✨🪙✨'
    chest.classList.add('open')
    app.menuScene.particles.confetti(window.innerWidth / 2, window.innerHeight * 0.55, 120, 900)
    open.remove()
    body.append(
      h('div', { class: 'coins-won pop' }, `+${gift.coins} 🪙`),
      h('p', { class: 'subtitle' }, t('dailyStreak', { n: gift.streak })),
      ...gift.trophies.map((tr) =>
        h(
          'div',
          { class: 'trophy-toast pop' },
          h('span', { class: 'ico' }, tr.icon),
          h(
            'div',
            null,
            h('b', null, t('newTrophy')),
            h('small', null, tr.name[app.settings.lang]),
          ),
        ),
      ),
      h('p', { class: 'subtitle', style: 'font-size:16px' }, t('dailyHint')),
      h('button', { class: 'btn big green', onClick: close }, t('dailyCollect')),
    )
  }
  open.addEventListener('click', reveal)
  chest.addEventListener('click', reveal)
}
