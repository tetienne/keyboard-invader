export type LayoutId = 'azerty' | 'qwerty'

export type RowId = 'top' | 'home' | 'bottom'

/** Fingers, left pinky to right pinky. Thumbs are not needed for letters. */
export type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'ri' | 'rm' | 'rr' | 'rp'

/**
 * Each row is written with the same 10 columns as a standard ANSI/ISO block,
 * so a column index maps to the same finger whatever the layout.
 */
export const LAYOUT_ROWS: Readonly<Record<LayoutId, Readonly<Record<RowId, string>>>> = {
  azerty: { top: 'azertyuiop', home: 'qsdfghjklm', bottom: 'wxcvbn,;:!' },
  qwerty: { top: 'qwertyuiop', home: 'asdfghjkl;', bottom: 'zxcvbnm,./' },
}

export const ROW_ORDER: readonly RowId[] = ['top', 'home', 'bottom']

const COLUMN_FINGERS: readonly Finger[] = [
  'lp',
  'lr',
  'lm',
  'li',
  'li',
  'ri',
  'ri',
  'rm',
  'rr',
  'rp',
]

/** Pastel colour per finger, used on keycaps and in lessons. */
export const FINGER_COLORS: Readonly<Record<Finger, string>> = {
  lp: '#ff7aa8',
  lr: '#ffae57',
  lm: '#ffe066',
  li: '#7be07b',
  ri: '#5fd4ff',
  rm: '#8f9bff',
  rr: '#c985ff',
  rp: '#ff85e0',
}

export const isLetter = (ch: string): boolean => /^[a-z]$/.test(ch)

export function rowLetters(layout: LayoutId, row: RowId): string[] {
  return LAYOUT_ROWS[layout][row].split('').filter(isLetter)
}

export function lettersAtColumns(
  layout: LayoutId,
  row: RowId,
  columns: readonly number[],
): string[] {
  const keys = LAYOUT_ROWS[layout][row]
  return columns.map((c) => keys[c] ?? '').filter(isLetter)
}

export function allLetters(layout: LayoutId): string[] {
  return ROW_ORDER.flatMap((row) => rowLetters(layout, row))
}

export interface KeyPosition {
  row: RowId
  column: number
}

export function keyPosition(layout: LayoutId, ch: string): KeyPosition | undefined {
  for (const row of ROW_ORDER) {
    const column = LAYOUT_ROWS[layout][row].indexOf(ch)
    if (column >= 0) return { row, column }
  }
  return undefined
}

export function fingerFor(layout: LayoutId, ch: string): Finger | undefined {
  const pos = keyPosition(layout, ch)
  return pos ? COLUMN_FINGERS[pos.column] : undefined
}
