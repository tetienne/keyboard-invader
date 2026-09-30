import type { LayoutId } from '../../content/keyboard'
import type { Lang } from '../../content/words'
import type { VoiceMode } from '../../state/profile'
import { t } from '../../core/i18n'
import type { App } from '../app'
import { h } from '../dom'
import { profilesScreen } from './profiles'

export function openSettings(app: App, onClose: () => void): void {
  const s = app.settings
  let dirty = false
  const change = (): void => {
    dirty = true
    app.applySettings()
    app.save()
  }

  const seg = <T extends string>(
    options: readonly [T, string][],
    get: () => T,
    set: (v: T) => void,
  ): HTMLElement => {
    const wrap = h('div', { class: 'seg' })
    const buttons = options.map(([value, label]) => {
      const b = h('button', { class: get() === value ? 'on' : '' }, label)
      b.addEventListener('click', () => {
        set(value)
        for (const x of buttons) x.classList.toggle('on', x === b)
        change()
      })
      return b
    })
    wrap.append(...buttons)
    return wrap
  }

  const slider = (get: () => number, set: (v: number) => void): HTMLElement => {
    const input = h('input', { type: 'range' })
    input.min = '0'
    input.max = '100'
    input.value = String(Math.round(get() * 100))
    input.addEventListener('input', () => {
      set(Number(input.value) / 100)
      change()
    })
    input.addEventListener('change', () => app.sfx.coin())
    return input
  }

  const toggle = (get: () => boolean, set: (v: boolean) => void): HTMLElement => {
    const b = h('button', { class: `toggle${get() ? ' on' : ''}`, 'aria-pressed': String(get()) })
    b.addEventListener('click', () => {
      set(!get())
      b.classList.toggle('on', get())
      b.setAttribute('aria-pressed', String(get()))
      change()
    })
    return b
  }

  const row = (label: string, control: HTMLElement): HTMLElement =>
    h('div', { class: 'setting' }, h('span', null, label), control)

  const profile = app.profile
  const del = profile ? h('button', { class: 'btn pink small' }, '🗑️ ', t('deletePilot')) : null
  del?.addEventListener('click', () => {
    if (!profile) return
    const confirmBox = h(
      'div',
      { class: 'dialog panel pop' },
      h(
        'p',
        { class: 'subtitle', style: 'color:#fff;font-size:22px' },
        t('confirmDelete', { name: profile.name }),
      ),
      h(
        'div',
        { class: 'row' },
        h('button', { class: 'btn ghost', onClick: () => closeConfirm() }, t('no')),
        h(
          'button',
          {
            class: 'btn pink',
            onClick: () => {
              app.store.data.profiles = app.store.data.profiles.filter((p) => p.id !== profile.id)
              app.profile = null
              app.save()
              closeConfirm()
              close()
              app.go(profilesScreen(app))
            },
          },
          t('yes'),
        ),
      ),
    )
    const closeConfirm = app.modal(confirmBox)
  })

  const preview = (): void => {
    if (s.voice !== 'off') app.voice.say('A', s.lang)
  }
  const voiceMode = seg<VoiceMode>(
    [
      ['off', t('voice.off')],
      ['lessons', t('voice.lessons')],
      ['all', t('voice.all')],
    ],
    () => s.voice,
    (v) => {
      s.voice = v
      app.applySettings()
      preview()
    },
  )
  const voiceVolume = slider(
    () => s.voiceVolume,
    (v) => (s.voiceVolume = v),
  )
  voiceVolume.addEventListener('change', preview)

  const section = (title: string): HTMLElement => h('h3', { class: 'setting-title' }, title)

  const body = h(
    'div',
    { class: 'dialog panel pop' },
    h('h2', { class: 'title' }, '⚙️ ', t('settings')),
    h(
      'div',
      { class: 'settings' },
      section(`🔊 ${t('sectionSound')}`),
      row(
        `🎵 ${t('music')}`,
        slider(
          () => s.music,
          (v) => (s.music = v),
        ),
      ),
      row(
        `💥 ${t('sfx')}`,
        slider(
          () => s.sfx,
          (v) => (s.sfx = v),
        ),
      ),
      row(`🗣️ ${t('voice')}`, voiceMode),
      row(`🔈 ${t('voiceVolume')}`, voiceVolume),
      section(`🎮 ${t('sectionGame')}`),
      row(
        t('language'),
        seg<Lang>(
          [
            ['fr', 'Français'],
            ['en', 'English'],
          ],
          () => s.lang,
          (v) => (s.lang = v),
        ),
      ),
      row(
        t('layout'),
        seg<LayoutId>(
          [
            ['azerty', 'AZERTY'],
            ['qwerty', 'QWERTY'],
          ],
          () => s.layout,
          (v) => (s.layout = v),
        ),
      ),
      row(
        `⌨️ ${t('keyboardHint')}`,
        toggle(
          () => s.keyboardHint,
          (v) => (s.keyboardHint = v),
        ),
      ),
    ),
    h(
      'div',
      { class: 'row' },
      del,
      h('button', { class: 'btn green', onClick: () => close() }, t('close')),
    ),
  )
  const close = app.modal(body, () => {
    if (dirty) onClose()
  })
}
