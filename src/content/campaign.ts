import { lettersAtColumns, rowLetters, allLetters, type LayoutId, type RowId } from './keyboard'

export type LevelKind = 'letters' | 'words'
export type LevelTag = 'lesson' | 'review' | 'speed' | 'mix' | 'words' | 'boss'

export interface LevelDef {
  /** Stable id used in save files, e.g. "1-3". */
  id: string
  world: number
  index: number
  kind: LevelKind
  tag: LevelTag
  boss: boolean
  /** Letters introduced by this lesson (shown on the briefing screen). */
  newKeys: string[]
  /** Letters that may appear (letters levels only). */
  pool: string[]
  wordLen: readonly [number, number]
  /** Number of invaders to clear (minions for boss levels are unlimited). */
  enemies: number
  /** Seconds for an invader to fall from the top to the shield. */
  fallTime: number
  /** Extra fall seconds per character, so long words get more time. */
  fallPerChar: number
  spawnEvery: number
  maxOnScreen: number
  bossHp: number
  powerups: boolean
}

export interface WorldTheme {
  /** Three nebula colours, from deep background to highlight. */
  nebula: readonly [string, string, string]
  planet: { base: string; shade: string; glow: string; ring: boolean }
  accent: string
}

export interface WorldDef {
  index: number
  kind: LevelKind
  row: RowId | null
  theme: WorldTheme
  levels: LevelDef[]
}

export const WORLD_THEMES: readonly WorldTheme[] = [
  {
    nebula: ['#0b0a2e', '#3a1c71', '#ff5fa2'],
    planet: { base: '#7be07b', shade: '#1f7a55', glow: '#b8ff6a', ring: false },
    accent: '#7be07b',
  },
  {
    nebula: ['#051530', '#10527a', '#38e8ff'],
    planet: { base: '#5fd4ff', shade: '#1b4f9c', glow: '#aef4ff', ring: true },
    accent: '#5fd4ff',
  },
  {
    nebula: ['#170a24', '#5b1d6e', '#c985ff'],
    planet: { base: '#e6ecff', shade: '#7a86c9', glow: '#ffffff', ring: false },
    accent: '#c985ff',
  },
  {
    nebula: ['#1f0a14', '#7a1f3d', '#ffae57'],
    planet: { base: '#ffae57', shade: '#b0402a', glow: '#ffe066', ring: true },
    accent: '#ffae57',
  },
  {
    nebula: ['#04161a', '#0f5e55', '#6bffcf'],
    planet: { base: '#6bffcf', shade: '#127a6b', glow: '#d2fff0', ring: false },
    accent: '#6bffcf',
  },
  {
    nebula: ['#07040f', '#2b0d4a', '#ff4d6d'],
    planet: { base: '#2b1747', shade: '#0a0414', glow: '#ff4d6d', ring: true },
    accent: '#ff4d6d',
  },
]

/** Finger pairs in teaching order: index, middle, ring, pinky, index stretch. */
const LESSON_COLUMNS: readonly (readonly number[])[] = [
  [3, 6],
  [2, 7],
  [1, 8],
  [0, 9],
  [4, 5],
]

const LETTER_ROWS: readonly RowId[] = ['home', 'top', 'bottom']

const round1 = (v: number): number => Math.round(v * 10) / 10

function letterWorld(layout: LayoutId, world: number, learnedBefore: readonly string[]): WorldDef {
  const row = LETTER_ROWS[world] ?? 'home'
  const groups = LESSON_COLUMNS.map((cols) => lettersAtColumns(layout, row, cols)).filter(
    (g) => g.length > 0,
  )
  const rowKeys = rowLetters(layout, row)

  const steps: { tag: LevelTag; newKeys: string[]; pool: string[] }[] = []
  const learned: string[] = []
  for (const group of groups) {
    learned.push(...group)
    steps.push({ tag: 'lesson', newKeys: group, pool: [...learned] })
  }
  steps.push({ tag: 'review', newKeys: [], pool: rowKeys })
  if (world === 0) steps.push({ tag: 'speed', newKeys: [], pool: rowKeys })
  else steps.push({ tag: 'mix', newKeys: [], pool: [...new Set([...learnedBefore, ...rowKeys])] })
  steps.push({ tag: 'boss', newKeys: [], pool: world === 2 ? allLetters(layout) : rowKeys })

  const levels = steps.map((step, index): LevelDef => {
    const p = index / (steps.length - 1)
    const boss = step.tag === 'boss'
    const speedy = step.tag === 'speed' || step.tag === 'mix'
    return {
      id: `${world + 1}-${index + 1}`,
      world,
      index,
      kind: 'letters',
      tag: step.tag,
      boss,
      newKeys: step.newKeys,
      pool: step.pool,
      wordLen: [1, 1],
      enemies: 12 + index * 2 + world * 2,
      fallTime: round1((13 - 1.2 * world - 3 * p) * (speedy ? 0.85 : 1)),
      fallPerChar: 0,
      spawnEvery: round1(Math.max(1, 2.6 - 0.2 * world - 0.8 * p)),
      maxOnScreen: boss ? 3 : 2 + Math.floor(p * 2) + world,
      bossHp: 6 + world * 2,
      powerups: world > 0 || index >= 2,
    }
  })
  return { index: world, kind: 'letters', row, theme: themeFor(world), levels }
}

const WORD_RANGES: readonly (readonly [number, number])[] = [
  [2, 3],
  [4, 5],
  [5, 10],
]

function wordWorld(layout: LayoutId, world: number): WorldDef {
  const tier = world - LETTER_ROWS.length
  const range = WORD_RANGES[tier] ?? [3, 5]
  const count = 6
  const levels: LevelDef[] = []
  for (let index = 0; index < count; index++) {
    const p = index / (count - 1)
    const boss = index === count - 1
    levels.push({
      id: `${world + 1}-${index + 1}`,
      world,
      index,
      kind: 'words',
      tag: boss ? 'boss' : 'words',
      boss,
      newKeys: [],
      pool: allLetters(layout),
      wordLen: range,
      enemies: 10 + index * 2 + tier * 2,
      fallTime: round1(7 - 0.8 * tier - 1.5 * p),
      fallPerChar: round1(1.4 - 0.15 * tier - 0.25 * p),
      spawnEvery: round1(Math.max(1.2, 3.4 - 0.3 * tier - 0.8 * p)),
      maxOnScreen: boss ? 3 : 2 + Math.floor(p * 2) + tier,
      bossHp: 5 + tier * 2,
      powerups: true,
    })
  }
  return { index: world, kind: 'words', row: null, theme: themeFor(world), levels }
}

function themeFor(world: number): WorldTheme {
  return WORLD_THEMES[world % WORLD_THEMES.length] as WorldTheme
}

export const WORLD_COUNT = 6
/** First world that uses whole words; readers get it unlocked from the start. */
export const FIRST_WORD_WORLD = 3

const campaigns = new Map<LayoutId, WorldDef[]>()

export function campaign(layout: LayoutId): WorldDef[] {
  let worlds = campaigns.get(layout)
  if (!worlds) {
    worlds = []
    const learned: string[] = []
    for (let w = 0; w < LETTER_ROWS.length; w++) {
      worlds.push(letterWorld(layout, w, learned))
      learned.push(...rowLetters(layout, LETTER_ROWS[w] ?? 'home'))
    }
    for (let w = LETTER_ROWS.length; w < WORLD_COUNT; w++) worlds.push(wordWorld(layout, w))
    campaigns.set(layout, worlds)
  }
  return worlds
}

export function findLevel(layout: LayoutId, id: string): LevelDef | undefined {
  for (const world of campaign(layout)) {
    const level = world.levels.find((l) => l.id === id)
    if (level) return level
  }
  return undefined
}

export function nextLevel(layout: LayoutId, level: LevelDef): LevelDef | undefined {
  const worlds = campaign(layout)
  const world = worlds[level.world]
  return world?.levels[level.index + 1] ?? worlds[level.world + 1]?.levels[0]
}

/** Letters a pilot has met through cleared lessons (used by endless mode). */
export function learnedLetters(layout: LayoutId, cleared: (id: string) => boolean): string[] {
  const keys = new Set<string>()
  for (const world of campaign(layout)) {
    if (world.kind !== 'letters') continue
    for (const level of world.levels) if (cleared(level.id)) for (const k of level.pool) keys.add(k)
  }
  return [...keys]
}
