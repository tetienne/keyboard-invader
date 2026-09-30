import {
  FINGER_COLORS,
  fingerFor,
  isLetter,
  LAYOUT_ROWS,
  ROW_ORDER,
  type LayoutId,
} from '../content/keyboard'
import { h } from './dom'

const ROW_OFFSET = { top: 0, home: 0.3, bottom: 0.8 } as const

/** Key pressed on the touch keyboard: a letter (a-z), or "back" to release the target. */
export type TouchKey = string

/**
 * On-screen keyboard showing where the next key is, coloured by finger:
 * the child learns key positions without looking down. On touch devices
 * without a keyboard it becomes the controller: tapping a key types it.
 */
export class KeyboardHint {
  readonly el: HTMLElement
  private readonly keys = new Map<string, HTMLElement>()
  private current: string | null = null
  private timers = new Map<string, number>()

  constructor(layout: LayoutId, active: readonly string[], onTouch?: (key: TouchKey) => void) {
    const touch = onTouch !== undefined
    this.el = h('div', {
      class: touch ? 'kbd touch' : 'kbd',
      style: touch
        ? '--ks: min(calc((100vw - 84px) / 11.2), 11vh, 64px)'
        : '--ks: clamp(20px, min(3.4vw, 5vh), 42px)',
    })
    for (const row of ROW_ORDER) {
      const rowEl = h('div', {
        class: 'kbd-row',
        style: `margin-left: calc(var(--ks) * ${ROW_OFFSET[row]})`,
      })
      for (const ch of LAYOUT_ROWS[layout][row]) {
        const finger = fingerFor(layout, ch)
        const cls = [
          'key',
          active.includes(ch) ? 'active' : '',
          ch === 'f' || ch === 'j' ? 'bump' : '',
          touch && !isLetter(ch) ? 'inert' : '',
        ]
        const key = h(
          'div',
          {
            class: cls.filter(Boolean).join(' '),
            style: `--kc:${finger ? FINGER_COLORS[finger] : '#8f86d9'}`,
          },
          isLetter(ch) ? ch.toUpperCase() : ch,
        )
        if (onTouch && isLetter(ch)) this.bindTouch(key, () => onTouch(ch))
        this.keys.set(ch, key)
        rowEl.append(key)
      }
      if (onTouch && row === 'top') {
        const back = h('div', { class: 'key active back', 'aria-label': 'Backspace' }, '⌫')
        this.bindTouch(back, () => onTouch('back'))
        rowEl.append(back)
      }
      this.el.append(rowEl)
    }
  }

  /** pointerdown reacts instantly (no click delay) and ignores multi-touch ghosts. */
  private bindTouch(el: HTMLElement, fire: () => void): void {
    el.addEventListener('pointerdown', (e) => {
      e.preventDefault()
      fire()
    })
  }

  setNext(ch: string | null): void {
    if (ch === this.current) return
    if (this.current) this.keys.get(this.current)?.classList.remove('next')
    this.current = ch
    if (ch) this.keys.get(ch)?.classList.add('next')
  }

  flash(ch: string, good: boolean): void {
    const key = this.keys.get(ch)
    if (!key) return
    const cls = good ? 'good' : 'bad'
    key.classList.remove('good', 'bad')
    key.classList.add(cls)
    const prev = this.timers.get(ch)
    if (prev !== undefined) window.clearTimeout(prev)
    this.timers.set(
      ch,
      window.setTimeout(() => key.classList.remove(cls), 140),
    )
  }
}
