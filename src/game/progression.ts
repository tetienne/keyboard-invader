import { campaign, FIRST_WORD_WORLD, type LevelDef } from '../content/campaign'
import type { LayoutId } from '../content/keyboard'
import type { Profile } from '../state/profile'
import type { SessionResult } from './session'
import { awardTrophies, type TrophyDef } from './trophies'

// --- pilot level -------------------------------------------------------------

export const xpToNext = (level: number): number => 100 + 50 * (level - 1)

export interface LevelInfo {
  level: number
  /** XP earned inside the current level. */
  into: number
  needed: number
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1
  let rest = Math.max(0, Math.floor(xp))
  while (rest >= xpToNext(level)) {
    rest -= xpToNext(level)
    level++
  }
  return { level, into: rest, needed: xpToNext(level) }
}

export type RankId =
  | 'cadet'
  | 'pilot'
  | 'lieutenant'
  | 'captain'
  | 'commander'
  | 'admiral'
  | 'legend'

const RANKS: readonly [number, RankId][] = [
  [30, 'legend'],
  [20, 'admiral'],
  [15, 'commander'],
  [10, 'captain'],
  [6, 'lieutenant'],
  [3, 'pilot'],
  [1, 'cadet'],
]

export function rankFor(level: number): RankId {
  for (const [min, rank] of RANKS) if (level >= min) return rank
  return 'cadet'
}

// --- stars & unlocks -----------------------------------------------------------

export function starsFor(result: SessionResult): number {
  if (!result.won) return 0
  if (result.accuracy >= 0.9 && result.breaches === 0) return 3
  if (result.accuracy >= 0.8 && result.breaches <= 1) return 2
  return 1
}

export const levelStars = (profile: Profile, id: string): number => profile.levels[id]?.stars ?? 0

export function isLevelUnlocked(profile: Profile, layout: LayoutId, level: LevelDef): boolean {
  const worlds = campaign(layout)
  if (level.index > 0) {
    const prev = worlds[level.world]?.levels[level.index - 1]
    return prev ? levelStars(profile, prev.id) > 0 : false
  }
  return isWorldUnlocked(profile, layout, level.world)
}

export function isWorldUnlocked(profile: Profile, layout: LayoutId, world: number): boolean {
  if (world === 0) return true
  if (profile.reader && world === FIRST_WORD_WORLD) return true
  const prev = campaign(layout)[world - 1]
  const boss = prev?.levels[prev.levels.length - 1]
  return boss ? levelStars(profile, boss.id) > 0 : false
}

// --- applying a finished game -------------------------------------------------

export interface RewardSummary {
  stars: number
  previousStars: number
  coins: number
  xp: number
  levelBefore: number
  levelAfter: number
  newBest: boolean
  trophies: TrophyDef[]
}

export const TROPHY_BONUS = 25

export function applyResult(profile: Profile, result: SessionResult): RewardSummary {
  const levelBefore = levelInfo(profile.xp).level
  const stars = result.mode === 'campaign' ? starsFor(result) : 0
  let previousStars = 0
  let newBest = false

  if (result.mode === 'campaign' && result.levelId) {
    const record = profile.levels[result.levelId] ?? { stars: 0, best: 0 }
    previousStars = record.stars
    newBest = result.won && result.score > record.best && record.best > 0
    if (result.won) {
      profile.levels[result.levelId] = {
        stars: Math.max(record.stars, stars),
        best: Math.max(record.best, result.score),
      }
    }
    if (stars === 3 && previousStars < 3) profile.stats.perfectLevels++
  } else if (result.mode === 'endless') {
    newBest = result.score > profile.endlessBest && profile.endlessBest > 0
    profile.endlessBest = Math.max(profile.endlessBest, result.score)
    profile.endlessBestWave = Math.max(profile.endlessBestWave, result.wave)
  }

  const s = profile.stats
  s.games++
  s.kills += result.kills
  s.correct += result.correct
  s.mistakes += result.mistakes
  s.bestCombo = Math.max(s.bestCombo, result.bestCombo)
  s.goldenKills += result.goldenKills
  s.powerups += result.powerups
  s.playSeconds += Math.round(result.duration)
  if (result.bossDefeated) s.bossKills++

  for (const [k, ks] of Object.entries(result.keyStats)) {
    const cur = profile.keyStats[k] ?? { ok: 0, ko: 0 }
    // Decay old history so recent progress shows up quickly.
    profile.keyStats[k] = {
      ok: Math.round(cur.ok * 0.8) + ks.ok,
      ko: Math.round(cur.ko * 0.8) + ks.ko,
    }
  }

  const newStars = Math.max(0, stars - previousStars)
  let coins = Math.round(result.score / 50) + newStars * 10 + result.coins
  const xp =
    result.correct +
    stars * 15 +
    (result.won ? 25 : 5) +
    (result.mode === 'endless' ? result.wave * 5 : 0)
  profile.xp += xp

  const trophies = awardTrophies(profile)
  coins += trophies.length * TROPHY_BONUS
  profile.coins += coins

  return {
    stars,
    previousStars,
    coins,
    xp,
    levelBefore,
    levelAfter: levelInfo(profile.xp).level,
    newBest,
    trophies,
  }
}

// --- daily gift ------------------------------------------------------------------

export function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const dailyAvailable = (profile: Profile, today: Date): boolean =>
  profile.daily.last !== dayKey(today)

export interface DailyGift {
  coins: number
  streak: number
  trophies: TrophyDef[]
}

export function claimDaily(profile: Profile, today: Date): DailyGift | null {
  if (!dailyAvailable(profile, today)) return null
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  const streak = profile.daily.last === dayKey(yesterday) ? profile.daily.streak + 1 : 1
  profile.daily = { last: dayKey(today), streak }
  const coins = 20 + 10 * Math.min(streak - 1, 6)
  profile.coins += coins
  const trophies = awardTrophies(profile)
  profile.coins += trophies.length * TROPHY_BONUS
  return { coins, streak, trophies }
}

// --- shop -----------------------------------------------------------------------

export type BuyOutcome = 'ok' | 'owned' | 'poor' | 'locked'

export function buy(
  profile: Profile,
  kind: 'ship' | 'laser',
  item: { id: string; price: number; minLevel?: number },
): BuyOutcome {
  const owned = kind === 'ship' ? profile.ships : profile.lasers
  if (owned.includes(item.id)) return 'owned'
  if ((item.minLevel ?? 1) > levelInfo(profile.xp).level) return 'locked'
  if (profile.coins < item.price) return 'poor'
  profile.coins -= item.price
  owned.push(item.id)
  if (kind === 'ship') profile.ship = item.id
  else profile.laser = item.id
  return 'ok'
}
