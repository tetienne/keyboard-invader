import {
  FINGER_COLORS,
  fingerFor,
  LAYOUT_ROWS,
  ROW_ORDER,
  type LayoutId,
} from '../content/keyboard'
import { h } from './dom'

const ROW_OFFSET = { top: 0, home: 0.3, bottom: 0.8 } as const

/**
 * On-screen keyboard showing where the next key is, coloured by finger:
 * the child learns key positions without looking down.
 */
export class KeyboardHint {
  readonly el: HTMLElement
  private readonly keys = new Map<string, HTMLElement>()
  private current: string | null = null
  private timers = new Map<string, number>()

  constructor(layout: LayoutId, active: readonly string[]) {
    this.el = h('div', { class: 'kbd', style: '--ks: clamp(20px, min(3.4vw, 5vh), 42px)' })
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
        ]
        const key = h(
          'div',
          {
            class: cls.filter(Boolean).join(' '),
            style: `--kc:${finger ? FINGER_COLORS[finger] : '#8f86d9'}`,
          },
          /^[a-z]$/.test(ch) ? ch.toUpperCase() : ch,
        )
        this.keys.set(ch, key)
        rowEl.append(key)
      }
      this.el.append(rowEl)
    }
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
