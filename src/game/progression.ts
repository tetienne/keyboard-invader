import type { GameMode } from './types.js'

export interface XpGain {
  readonly baseXp: number
  readonly accuracyBonus: number
  readonly modeMultiplier: number
  readonly totalXp: number
}

export interface LevelUpResult {
  readonly previousLevel: number
  readonly newLevel: number
  readonly levelsGained: number
  readonly remainingXp: number
}

// Level 1: 0 XP, Level 2: 50 XP (~2 sessions), ..., Level 10: 1900 XP (~8 sessions)
// Early levels fast (2-3 sessions), later levels slower (5-8 sessions)
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 50, 120, 220, 360, 540, 780, 1080, 1440, 1900,
]

export const MAX_LEVEL = 10

/**
 * Calculate XP earned from a session.
 * Base: 2 XP per hit. Accuracy bonus: baseXp * accuracy * 0.5.
 * Words mode gets 1.5x multiplier.
 */
export function calculateXpGain(
  hits: number,
  total: number,
  mode: GameMode,
): XpGain {
  if (total === 0 || hits === 0) {
    return { baseXp: 0, accuracyBonus: 0, modeMultiplier: mode === 'words' ? 1.5 : 1.0, totalXp: 0 }
  }

  const baseXp = hits * 2
  const accuracy = hits / total
  const accuracyBonus = Math.round(baseXp * accuracy * 0.5)
  const modeMultiplier = mode === 'words' ? 1.5 : 1.0
  const totalXp = Math.round((baseXp + accuracyBonus) * modeMultiplier)

  return { baseXp, accuracyBonus, modeMultiplier, totalXp }
}

/**
 * Determine level from cumulative XP.
 * Iterates thresholds from highest to find the matching level.
 */
function resolveLevel(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]!) {
      return i + 1
    }
  }
  return 1
}

/**
 * Apply XP gain and detect level-ups.
 */
export function applyXp(
  currentXp: number,
  currentLevel: number,
  xpGain: number,
): LevelUpResult {
  const newTotalXp = currentXp + xpGain
  const newLevel = Math.min(resolveLevel(newTotalXp), MAX_LEVEL)

  return {
    previousLevel: currentLevel,
    newLevel,
    levelsGained: newLevel - currentLevel,
    remainingXp: newTotalXp,
  }
}

/**
 * Get progress within the current level for UI progress bar.
 */
export function xpForCurrentLevel(
  totalXp: number,
  level: number,
): { current: number; required: number } {
  if (level >= MAX_LEVEL) {
    return { current: 0, required: 0 }
  }

  const levelStart = LEVEL_THRESHOLDS[level - 1]!
  const levelEnd = LEVEL_THRESHOLDS[level]!
  const current = totalXp - levelStart
  const required = levelEnd - levelStart

  return { current, required }
}
