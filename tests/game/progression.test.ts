import { describe, it, expect } from 'vitest'
import {
  calculateXpGain,
  applyXp,
  xpForCurrentLevel,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
} from '../../src/game/progression.js'

describe('LEVEL_THRESHOLDS and MAX_LEVEL', () => {
  it('has exactly 10 entries starting with 0 and ending with 1900', () => {
    expect(LEVEL_THRESHOLDS).toHaveLength(10)
    expect(LEVEL_THRESHOLDS[0]).toBe(0)
    expect(LEVEL_THRESHOLDS[9]).toBe(1900)
  })

  it('MAX_LEVEL equals 10', () => {
    expect(MAX_LEVEL).toBe(10)
  })
})

describe('calculateXpGain', () => {
  it('returns correct values for perfect letter session', () => {
    const result = calculateXpGain(10, 10, 'letters')
    expect(result.baseXp).toBe(20)
    expect(result.accuracyBonus).toBe(10)
    expect(result.modeMultiplier).toBe(1.0)
    expect(result.totalXp).toBe(30)
  })

  it('applies 1.5x multiplier for words mode', () => {
    const result = calculateXpGain(10, 10, 'words')
    expect(result.totalXp).toBe(45)
  })

  it('returns all zeros when no hits', () => {
    const result = calculateXpGain(0, 10, 'letters')
    expect(result.totalXp).toBe(0)
    expect(result.baseXp).toBe(0)
    expect(result.accuracyBonus).toBe(0)
  })

  it('calculates partial accuracy correctly', () => {
    const result = calculateXpGain(7, 10, 'letters')
    expect(result.baseXp).toBe(14)
    expect(result.accuracyBonus).toBe(5)
    expect(result.totalXp).toBe(19)
  })

  it('returns all zeros when total is 0', () => {
    const result = calculateXpGain(0, 0, 'letters')
    expect(result.totalXp).toBe(0)
  })
})

describe('applyXp', () => {
  it('detects single level-up', () => {
    const result = applyXp(40, 1, 30)
    expect(result.previousLevel).toBe(1)
    expect(result.newLevel).toBe(2)
    expect(result.levelsGained).toBe(1)
    expect(result.remainingXp).toBe(70)
  })

  it('detects multi-level-up', () => {
    const result = applyXp(100, 2, 800)
    expect(result.levelsGained).toBeGreaterThanOrEqual(2)
  })

  it('caps at max level', () => {
    const result = applyXp(1900, 10, 100)
    expect(result.newLevel).toBe(10)
    expect(result.levelsGained).toBe(0)
  })

  it('accumulates XP even at max level', () => {
    const result = applyXp(1900, 10, 100)
    expect(result.remainingXp).toBe(2000)
  })
})

describe('xpForCurrentLevel', () => {
  it('returns progress into level 2', () => {
    const result = xpForCurrentLevel(70, 2)
    expect(result.current).toBe(20)
    expect(result.required).toBe(70)
  })

  it('returns zero progress at level 1 start', () => {
    const result = xpForCurrentLevel(0, 1)
    expect(result.current).toBe(0)
    expect(result.required).toBe(50)
  })

  it('returns zeros at max level', () => {
    const result = xpForCurrentLevel(1900, 10)
    expect(result.current).toBe(0)
    expect(result.required).toBe(0)
  })
})
