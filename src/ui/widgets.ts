import { findShip, type ShipDef } from '../content/ships'
import { formatNumber, t } from '../core/i18n'
import { levelInfo, rankFor } from '../game/progression'
import { drawShip, glowSprite } from '../render/art'
import type { Profile } from '../state/profile'
import { h } from './dom'

export function pilotBar(profile: Profile): HTMLElement {
  const info = levelInfo(profile.xp)
  const fill = h('i')
  const bar = h(
    'div',
    { class: 'pilot-bar panel' },
    h('div', { class: 'avatar' }, profile.avatar),
    h(
      'div',
      { class: 'who' },
      h('b', null, profile.name),
      h('small', null, t(`rank.${rankFor(info.level)}`)),
      h('div', { class: 'xpbar' }, fill),
    ),
    h('div', { class: 'lvl-badge', title: t('levelShort', { n: info.level }) }, info.level),
  )
  requestAnimationFrame(() => {
    fill.style.width = `${Math.round((info.into / info.needed) * 100)}%`
  })
  return bar
}

export const coinChip = (coins: number): HTMLElement =>
  h('div', { class: 'chip coins' }, '🪙 ', formatNumber(coins))

export const starChip = (stars: number): HTMLElement =>
  h('div', { class: 'chip' }, h('span', { class: 'star-on' }, '★'), ' ', stars)

/** Small canvas rendering a ship; `spin` keeps it gently animated. */
export function shipCanvas(
  ship: ShipDef | string,
  size = 130,
): { canvas: HTMLCanvasElement; tick: (time: number) => void } {
  const def = typeof ship === 'string' ? findShip(ship) : ship
  const canvas = document.createElement('canvas')
  const dpr = Math.min(2, window.devicePixelRatio || 1)
  canvas.width = canvas.height = size * dpr
  canvas.style.width = canvas.style.height = `${size}px`
  const ctx = canvas.getContext('2d')
  const tick = (time: number): void => {
    if (!ctx) return
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = 0.5
    ctx.drawImage(glowSprite(def.accent), 0, 0, size, size)
    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
    ctx.translate(size / 2, size / 2 + Math.sin(time * 2) * 3)
    ctx.rotate(Math.sin(time * 1.3) * 0.08)
    ctx.scale(size * 0.3, size * 0.3)
    drawShip(ctx, def, time)
  }
  tick(0)
  return { canvas, tick }
}

/** Gear button opening the settings modal; `refresh` re-renders the screen after changes. */
export function settingsButton(open: () => void): HTMLElement {
  return h('button', { class: 'btn ghost icon-btn', title: t('settings'), onClick: open }, '⚙️')
}

export function backButton(onClick: () => void): HTMLElement {
  return h('button', { class: 'btn ghost small', onClick }, '◀ ', t('back'))
}
