import { SHIPS, LASERS } from '../content/ships'
import {
  createProfile,
  defaultSettings,
  emptyStats,
  type Profile,
  type SaveData,
  type Settings,
} from './profile'

export const STORAGE_KEY = 'keyboard-invader:save:v2'

type Json = Record<string, unknown>

const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)
const num = (v: unknown, fallback: number, min = 0, max = Number.MAX_SAFE_INTEGER): number =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback
const str = (v: unknown, fallback: string): string => (typeof v === 'string' ? v : fallback)
const strList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []

function sanitizeSettings(raw: unknown, fallback: Settings): Settings {
  if (!isObj(raw)) return fallback
  return {
    lang: raw['lang'] === 'en' || raw['lang'] === 'fr' ? raw['lang'] : fallback.lang,
    layout:
      raw['layout'] === 'qwerty' || raw['layout'] === 'azerty' ? raw['layout'] : fallback.layout,
    music: num(raw['music'], fallback.music, 0, 1),
    sfx: num(raw['sfx'], fallback.sfx, 0, 1),
    // v2.0 stored a boolean; letters read on every spawn felt noisy, so it restarts off.
    voice:
      raw['voice'] === 'lessons' || raw['voice'] === 'all' || raw['voice'] === 'off'
        ? raw['voice']
        : fallback.voice,
    voiceVolume: num(raw['voiceVolume'], fallback.voiceVolume, 0, 1),
    keyboardHint:
      typeof raw['keyboardHint'] === 'boolean' ? raw['keyboardHint'] : fallback.keyboardHint,
  }
}

function sanitizeProfile(raw: unknown): Profile | null {
  if (!isObj(raw) || typeof raw['id'] !== 'string') return null
  const base = createProfile(
    str(raw['name'], 'Pilote'),
    str(raw['avatar'], '🦊'),
    raw['reader'] === true,
  )
  const levels: Profile['levels'] = {}
  if (isObj(raw['levels'])) {
    for (const [id, rec] of Object.entries(raw['levels'])) {
      if (isObj(rec)) levels[id] = { stars: num(rec['stars'], 0, 0, 3), best: num(rec['best'], 0) }
    }
  }
  const stats = emptyStats()
  if (isObj(raw['stats'])) {
    for (const key of Object.keys(stats) as (keyof typeof stats)[])
      stats[key] = num(raw['stats'][key], 0)
  }
  const keyStats: Profile['keyStats'] = {}
  if (isObj(raw['keyStats'])) {
    for (const [k, s] of Object.entries(raw['keyStats'])) {
      if (isObj(s) && /^[a-z]$/.test(k)) keyStats[k] = { ok: num(s['ok'], 0), ko: num(s['ko'], 0) }
    }
  }
  const ships = strList(raw['ships']).filter((id) => SHIPS.some((s) => s.id === id))
  const lasers = strList(raw['lasers']).filter((id) => LASERS.some((l) => l.id === id))
  if (!ships.includes('comet')) ships.unshift('comet')
  if (!lasers.includes('cyan')) lasers.unshift('cyan')
  const ship = str(raw['ship'], 'comet')
  const laser = str(raw['laser'], 'cyan')
  const daily = isObj(raw['daily']) ? raw['daily'] : {}
  return {
    ...base,
    id: raw['id'],
    createdAt: num(raw['createdAt'], Date.now()),
    xp: num(raw['xp'], 0),
    coins: num(raw['coins'], 0),
    levels,
    endlessBest: num(raw['endlessBest'], 0),
    endlessBestWave: num(raw['endlessBestWave'], 0),
    ships,
    ship: ships.includes(ship) ? ship : 'comet',
    lasers,
    laser: lasers.includes(laser) ? laser : 'cyan',
    trophies: strList(raw['trophies']),
    stats,
    keyStats,
    daily: {
      last: typeof daily['last'] === 'string' ? daily['last'] : null,
      streak: num(daily['streak'], 0),
    },
  }
}

export function parseSave(text: string | null, navigatorLang?: string): SaveData {
  const fallback: SaveData = {
    version: 2,
    settings: defaultSettings(navigatorLang),
    profiles: [],
    lastProfileId: null,
  }
  if (!text) return fallback
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return fallback
  }
  if (!isObj(raw)) return fallback
  const profiles = Array.isArray(raw['profiles'])
    ? raw['profiles'].map(sanitizeProfile).filter((p): p is Profile => p !== null)
    : []
  const last = typeof raw['lastProfileId'] === 'string' ? raw['lastProfileId'] : null
  return {
    version: 2,
    settings: sanitizeSettings(raw['settings'], fallback.settings),
    profiles,
    lastProfileId: profiles.some((p) => p.id === last) ? last : null,
  }
}

export interface Store {
  data: SaveData
  save(): void
}

export function openStore(storage: Storage | null, navigatorLang?: string): Store {
  let text: string | null
  try {
    text = storage?.getItem(STORAGE_KEY) ?? null
  } catch {
    text = null
  }
  const data = parseSave(text, navigatorLang)
  return {
    data,
    save() {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        // Private mode or quota exceeded: the game keeps working in memory.
      }
    },
  }
}
