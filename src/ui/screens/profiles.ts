import { t } from '../../core/i18n'
import { levelInfo } from '../../game/progression'
import { AVATARS, createProfile, totalStars } from '../../state/profile'
import type { App, Screen } from '../app'
import { h } from '../dom'
import { hubScreen } from './hub'

export function profilesScreen(app: App): Screen {
  const profiles = app.store.data.profiles
  if (profiles.length === 0) return createProfileScreen(app, false)

  const cards = profiles.map((p, i) => {
    const card = h(
      'button',
      { class: 'pilot-card pop', style: `animation-delay:${i * 70}ms`, onClick: () => open(p.id) },
      h('div', { class: 'avatar' }, p.avatar),
      h('div', { class: 'name' }, p.name),
      h(
        'div',
        { class: 'meta' },
        `${t('levelShort', { n: levelInfo(p.xp).level })} · ★ ${totalStars(p)}`,
      ),
    )
    return card
  })
  const open = (id: string): void => {
    const p = profiles.find((x) => x.id === id)
    if (!p) return
    app.selectProfile(p)
    app.go(hubScreen(app))
  }
  const el = h(
    'div',
    { class: 'screen' },
    h('h1', { class: 'title' }, t('whoPlays')),
    h(
      'div',
      { class: 'cards' },
      ...cards,
      h(
        'button',
        {
          class: 'pilot-card new pop',
          style: `animation-delay:${cards.length * 70}ms`,
          onClick: () => app.go(createProfileScreen(app, true)),
        },
        h('div', { class: 'avatar' }, '＋'),
        h('div', { class: 'name' }, t('newPilot')),
      ),
    ),
  )
  return {
    el,
    scene: 'menu',
    music: 'menu',
    onKey: (e) => {
      const n = Number(e.key)
      const p = profiles[n - 1]
      if (Number.isInteger(n) && p) open(p.id)
    },
  }
}

export function createProfileScreen(app: App, canGoBack: boolean): Screen {
  let avatar = AVATARS[Math.floor(Math.random() * AVATARS.length)] ?? '🦊'
  let reader: boolean | null = null

  const input = h('input', { class: 'name-input', type: 'text', 'aria-label': t('yourName') })
  input.maxLength = 14
  input.placeholder = t('namePlaceholder')
  input.autocomplete = 'off'
  input.spellcheck = false

  const avatarButtons = AVATARS.map((a) => {
    const b = h(
      'button',
      { class: `avatar-choice${a === avatar ? ' selected' : ''}`, type: 'button' },
      a,
    )
    b.addEventListener('click', () => {
      avatar = a
      for (const x of avatarButtons) x.classList.toggle('selected', x === b)
    })
    return b
  })

  const go = h('button', { class: 'btn big green', disabled: true }, '🚀 ', t('go'))
  const choice = (emoji: string, label: string, value: boolean): HTMLButtonElement => {
    const b = h(
      'button',
      { class: 'choice', type: 'button' },
      h('span', { class: 'emoji' }, emoji),
      label,
    )
    b.addEventListener('click', () => {
      reader = value
      for (const c of choices) c.classList.toggle('selected', c === b)
      go.disabled = false
    })
    return b
  }
  const choices = [choice('🔤', t('readerNo'), false), choice('📖', t('readerYes'), true)]

  const submit = (): void => {
    if (reader === null) return
    const profile = createProfile(input.value, avatar, reader)
    app.store.data.profiles.push(profile)
    app.selectProfile(profile)
    app.sfx.levelUp()
    app.go(hubScreen(app))
  }
  go.addEventListener('click', submit)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit()
    else if (/^[a-zA-Z]$/.test(e.key)) app.sfx.type()
  })

  const el = h(
    'div',
    { class: 'screen scroll' },
    canGoBack
      ? h(
          'div',
          { class: 'topbar' },
          h(
            'button',
            { class: 'btn ghost small', onClick: () => app.go(profilesScreen(app)) },
            '◀ ',
            t('back'),
          ),
        )
      : null,
    h(
      'div',
      { class: 'panel form pop', style: 'margin:auto' },
      h('h1', { class: 'title' }, t('createTitle')),
      h(
        'div',
        null,
        h('div', { class: 'label' }, t('chooseAvatar')),
        h('div', { class: 'avatar-grid' }, ...avatarButtons),
      ),
      h('div', null, h('div', { class: 'label' }, t('yourName')), input),
      h(
        'div',
        null,
        h('div', { class: 'label' }, t('readerQuestion')),
        h('div', { class: 'choice-row' }, ...choices),
      ),
      h('div', { class: 'row' }, go),
    ),
  )
  setTimeout(() => input.focus(), 50)
  return { el, scene: 'menu', music: 'menu' }
}
