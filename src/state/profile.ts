import type { LayoutId } from '../content/keyboard'
import type { Lang } from '../content/words'
import type { KeyStat } from '../game/session'

export interface LevelRecord {
  stars: number
  best: number
}

export interface ProfileStats {
  games: number
  kills: number
  correct: number
  mistakes: number
  bestCombo: number
  bossKills: number
  perfectLevels: number
  goldenKills: number
  powerups: number
  playSeconds: number
}

export interface Profile {
  id: string
  name: string
  avatar: string
  /** Can read: word worlds unlocked from the start, words in endless mode. */
  reader: boolean
  createdAt: number
  xp: number
  coins: number
  levels: Record<string, LevelRecord>
  endlessBest: number
  endlessBestWave: number
  ships: string[]
  ship: string
  lasers: string[]
  laser: string
  trophies: string[]
  stats: ProfileStats
  keyStats: Record<string, KeyStat>
  daily: { last: string | null; streak: number }
}

/** When the voice reads letters aloud. */
export type VoiceMode = 'off' | 'lessons' | 'all'

export interface Settings {
  lang: Lang
  layout: LayoutId
  music: number
  sfx: number
  voice: VoiceMode
  voiceVolume: number
  keyboardHint: boolean
}

export interface SaveData {
  version: 2
  settings: Settings
  profiles: Profile[]
  lastProfileId: string | null
}

export const AVATARS: readonly string[] = [
  '🦊',
  '🐼',
  '🐸',
  '🦁',
  '🐙',
  '🦄',
  '🐯',
  '🐵',
  '🐧',
  '🐶',
  '🐱',
  '🦖',
]

export function emptyStats(): ProfileStats {
  return {
    games: 0,
    kills: 0,
    correct: 0,
    mistakes: 0,
    bestCombo: 0,
    bossKills: 0,
    perfectLevels: 0,
    goldenKills: 0,
    powerups: 0,
    playSeconds: 0,
  }
}

export function createProfile(
  name: string,
  avatar: string,
  reader: boolean,
  now = Date.now(),
): Profile {
  return {
    id: `p${now.toString(36)}${Math.floor(Math.random() * 1e6).toString(36)}`,
    name: name.trim().slice(0, 14) || 'Pilote',
    avatar,
    reader,
    createdAt: now,
    xp: 0,
    coins: 0,
    levels: {},
    endlessBest: 0,
    endlessBestWave: 0,
    ships: ['comet'],
    ship: 'comet',
    lasers: ['cyan'],
    laser: 'cyan',
    trophies: [],
    stats: emptyStats(),
    keyStats: {},
    daily: { last: null, streak: 0 },
  }
}

export function defaultSettings(navigatorLang = 'fr'): Settings {
  const fr = navigatorLang.toLowerCase().startsWith('fr')
  return {
    lang: fr ? 'fr' : 'en',
    layout: fr ? 'azerty' : 'qwerty',
    music: 0.5,
    sfx: 0.8,
    voice: 'off',
    voiceVolume: 0.8,
    keyboardHint: true,
  }
}

export function totalStars(profile: Profile): number {
  let n = 0
  for (const r of Object.values(profile.levels)) n += r.stars
  return n
}

/** Weight >= 1 for letters the child often misses, so they come back more. */
export function keyWeight(profile: Profile, ch: string): number {
  const s = profile.keyStats[ch]
  if (!s || s.ok + s.ko < 5) return 1
  const errorRate = s.ko / (s.ok + s.ko)
  return 1 + Math.min(2.5, errorRate * 6)
}
