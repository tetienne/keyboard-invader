import { t } from '../../core/i18n'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { profilesScreen } from './profiles'

export function titleScreen(app: App): Screen {
  const el = h(
    'div',
    { class: 'screen clickable' },
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
  el.addEventListener('click', next)
  return {
    el,
    scene: 'menu',
    music: 'menu',
    onKey: (e) => {
      if (!e.repeat) next()
    },
  }
}
