import { t } from '../../core/i18n'
import { TROPHIES } from '../../game/trophies'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { backButton } from '../widgets'
import { hubScreen } from './hub'

export function trophiesScreen(app: App): Screen {
  const profile = app.profile
  if (!profile) return hubScreen(app)
  const lang = app.settings.lang
  const list = TROPHIES.map((tr, i) => {
    const got = profile.trophies.includes(tr.id)
    return h(
      'div',
      { class: `trophy pop ${got ? 'got' : 'locked'}`, style: `animation-delay:${i * 30}ms` },
      h('span', { class: 'ico' }, tr.icon),
      h('div', null, h('b', null, tr.name[lang]), h('small', null, tr.desc[lang])),
    )
  })
  const el = h(
    'div',
    { class: 'screen scroll' },
    h(
      'div',
      { class: 'topbar' },
      backButton(() => app.go(hubScreen(app))),
    ),
    h('h1', { class: 'title', style: 'margin-top:60px' }, '🏆 ', t('trophies')),
    h(
      'p',
      { class: 'subtitle' },
      t('trophiesCount', { n: profile.trophies.length, total: TROPHIES.length }),
    ),
    h('div', { class: 'trophy-grid' }, ...list),
  )
  return {
    el,
    scene: 'menu',
    music: 'menu',
    onKey: (e) => {
      if (e.key === 'Escape') app.go(hubScreen(app))
    },
  }
}
