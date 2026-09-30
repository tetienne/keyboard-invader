type Child = Node | string | number | null | undefined | false

interface Props {
  class?: string
  style?: string
  title?: string
  type?: string
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
  [attr: `data-${string}` | `aria-${string}`]: string | undefined
}

/** Minimal hyperscript helper: h('div', { class: 'x' }, 'text', child). */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Props | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag)
  if (props) {
    for (const [key, value] of Object.entries(props) as [string, unknown][]) {
      if (value === undefined || value === null || value === false) continue
      if (key === 'onClick' && typeof value === 'function') {
        el.addEventListener('click', value as (e: Event) => void)
      } else if (key === 'class' && typeof value === 'string') el.className = value
      else if (key === 'disabled') (el as HTMLButtonElement).disabled = value === true
      else if (typeof value === 'string') el.setAttribute(key, value)
    }
  }
  append(el, children)
  return el
}

export function append(el: HTMLElement, children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue
    el.append(c instanceof Node ? c : String(c))
  }
}

export function clear(el: HTMLElement): void {
  while (el.firstChild) el.removeChild(el.firstChild)
}

export const starsText = (n: number, max = 3): HTMLElement =>
  h(
    'span',
    { class: 'stars' },
    ...Array.from({ length: max }, (_, i) =>
      h('span', { class: i < n ? 'star-on' : 'star-off' }, '★'),
    ),
  )
