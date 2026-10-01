import type { Lang } from '../../content/words'
import { t } from '../../core/i18n'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { profilesScreen } from './profiles'

const LANGS: readonly [Lang, string][] = [
  ['fr', 'Français'],
  ['en', 'English'],
]

export function titleScreen(app: App): Screen {
  // Shown before any text needs reading, so each name is written in its own language.
  const langPicker = h(
    'div',
    { class: 'seg title-lang', 'aria-label': t('language') },
    ...LANGS.map(([lang, label]) =>
      h(
        'button',
        {
          class: app.settings.lang === lang ? 'on' : '',
          'aria-pressed': String(app.settings.lang === lang),
          onClick: () => {
            if (app.settings.lang === lang) return
            app.settings.lang = lang
            // AZERTY is mostly a French thing; the settings screen still lets anyone override it.
            app.settings.layout = lang === 'fr' ? 'azerty' : 'qwerty'
            app.applySettings()
            app.save()
            done = true
            app.go(titleScreen(app))
          },
        },
        label,
      ),
    ),
  )
  const el = h(
    'div',
    { class: 'screen clickable' },
    langPicker,
    h('div', { class: 'logo' }, h('span', null, 'KEYBOARD'), h('span', null, 'INVADER')),
    h('p', { class: 'subtitle' }, t('tagline')),
    h('p', { class: 'press' }, t(app.touchMode ? 'tapToStart' : 'pressToStart')),
    app.touchMode
      ? h('p', { class: 'subtitle', style: 'font-size:15px;max-width:520px' }, t('touchNotice'))
      : null,
  )
  let done = false
  const next = (): void => {
    if (done) return
    done = true
    app.unlockAudio()
    app.sfx.warp()
    app.background.jump()
    app.go(profilesScreen(app))
  }
  el.addEventListener('click', (e) => {
    if (!langPicker.contains(e.target as Node)) next()
  })
  return {
    el,
    scene: 'menu',
    music: 'menu',
    onKey: (e) => {
      if (!e.repeat) next()
    },
  }
}
