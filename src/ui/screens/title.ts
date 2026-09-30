import { t } from '../../core/i18n'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { profilesScreen } from './profiles'

export function titleScreen(app: App): Screen {
  const touchOnly =
    window.matchMedia('(pointer: coarse)').matches && !window.matchMedia('(pointer: fine)').matches
  const el = h(
    'div',
    { class: 'screen clickable' },
    h('div', { class: 'logo' }, h('span', null, 'KEYBOARD'), h('span', null, 'INVADER')),
    h('p', { class: 'subtitle' }, t('tagline')),
    h('p', { class: 'press' }, t('pressToStart')),
    touchOnly ? h('p', { class: 'notice' }, t('noKeyboard')) : null,
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
