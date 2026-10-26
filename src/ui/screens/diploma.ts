import { CAMPAIGN_SHIP } from '../../content/ships'
import { getLang, t } from '../../core/i18n'
import { levelInfo, rankFor } from '../../game/progression'
import { totalStars } from '../../state/profile'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { backButton, shipCanvas } from '../widgets'
import { albumScreen } from './album'
import { hubScreen } from './hub'

export function diplomaScreen(app: App, from: 'hub' | 'album' = 'hub'): Screen {
  const profile = app.profile
  if (!profile) return hubScreen(app)
  const back = (): void => app.go(from === 'album' ? albumScreen(app) : hubScreen(app))
  const ship = shipCanvas(CAMPAIGN_SHIP, 120)
  const date = new Intl.DateTimeFormat(getLang(), { dateStyle: 'long' }).format(new Date())
  const fact = (label: string, value: string): HTMLElement =>
    h('div', { class: 'diploma-fact' }, h('small', null, label), h('b', null, value))

  const el = h(
    'div',
    { class: 'screen scroll diploma-screen' },
    h(
      'div',
      { class: 'topbar no-print' },
      backButton(back),
      h('button', { class: 'btn green small', onClick: () => window.print() }, '🖨️ ', t('print')),
    ),
    h(
      'div',
      { class: 'diploma pop' },
      h(
        'div',
        { class: 'diploma-inner' },
        h('div', { class: 'diploma-corner tl' }, '⭐'),
        h('div', { class: 'diploma-corner tr' }, '🚀'),
        h('div', { class: 'diploma-corner bl' }, '🪐'),
        h('div', { class: 'diploma-corner br' }, '⭐'),
        h('h1', { class: 'diploma-title' }, t('diplomaTitle')),
        h('p', { class: 'diploma-line' }, t('diplomaAwarded')),
        h(
          'div',
          { class: 'diploma-name' },
          h('span', { class: 'diploma-avatar' }, profile.avatar),
          h('span', null, profile.name),
        ),
        h('p', { class: 'diploma-line' }, t('diplomaText')),
        h(
          'div',
          { class: 'diploma-facts' },
          fact(t('diplomaStars'), `★ ${totalStars(profile)}`),
          fact(t('diplomaRank'), t(`rank.${rankFor(levelInfo(profile.xp).level)}`)),
          fact(t('diplomaDate'), date),
        ),
        h(
          'div',
          { class: 'diploma-foot' },
          h('div', { class: 'diploma-ship' }, ship.canvas),
          h('div', { class: 'diploma-seal' }, h('span', null, '🏅')),
          h(
            'div',
            { class: 'diploma-sign' },
            h('i', null, '✍️'),
            h('span', null, t('diplomaSign')),
          ),
        ),
      ),
    ),
  )
  return {
    el,
    scene: 'menu',
    music: 'menu',
    onKey: (e) => {
      if (e.key === 'Escape') back()
    },
  }
}
