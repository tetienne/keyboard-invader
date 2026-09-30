import { describe, expect, it } from 'vitest'
import { findShip } from '../src/content/ships'
import {
  applyResult,
  buy,
  claimDaily,
  dailyAvailable,
  isLevelUnlocked,
  isWorldUnlocked,
  levelInfo,
  rankFor,
  starsFor,
  xpToNext,
} from '../src/game/progression'
import type { SessionResult } from '../src/game/session'
import { createProfile, keyWeight, totalStars } from '../src/state/profile'
import { level } from './helpers'

function result(patch: Partial<SessionResult> = {}): SessionResult {
  return {
    mode: 'campaign',
    levelId: '1-1',
    won: true,
    score: 2000,
    accuracy: 0.95,
    correct: 40,
    mistakes: 2,
    kills: 12,
    breaches: 0,
    bestCombo: 25,
    goldenKills: 1,
    powerups: 0,
    bossDefeated: false,
    coins: 3,
    wave: 1,
    duration: 60,
    heartsLeft: 5,
    keyStats: { f: { ok: 20, ko: 1 }, j: { ok: 20, ko: 1 } },
    ...patch,
  }
}

describe('pilot level', () => {
  it('turns xp into levels', () => {
    expect(levelInfo(0)).toEqual({ level: 1, into: 0, needed: xpToNext(1) })
    expect(levelInfo(xpToNext(1)).level).toBe(2)
    expect(levelInfo(xpToNext(1) + xpToNext(2) + 10)).toEqual({
      level: 3,
      into: 10,
      needed: xpToNext(3),
    })
  })

  it('gives ranks', () => {
    expect(rankFor(1)).toBe('cadet')
    expect(rankFor(10)).toBe('captain')
    expect(rankFor(99)).toBe('legend')
  })
})

describe('stars', () => {
  it('rewards accuracy and a clean shield', () => {
    expect(starsFor(result({ won: false }))).toBe(0)
    expect(starsFor(result({ accuracy: 0.6, breaches: 3 }))).toBe(1)
    expect(starsFor(result({ accuracy: 0.85, breaches: 1 }))).toBe(2)
    expect(starsFor(result())).toBe(3)
  })
})

describe('applyResult', () => {
  it('stores the best record, pays coins and xp, and awards trophies', () => {
    const p = createProfile('Lina', '🦊', false)
    const r = applyResult(p, result())
    expect(r.stars).toBe(3)
    expect(p.levels['1-1']).toEqual({ stars: 3, best: 2000 })
    expect(r.coins).toBeGreaterThan(0)
    expect(p.coins).toBe(r.coins)
    expect(p.xp).toBe(r.xp)
    expect(p.stats.kills).toBe(12)
    expect(r.trophies.map((t) => t.id)).toEqual(
      expect.arrayContaining(['first', 'combo20', 'perfect']),
    )
    expect(totalStars(p)).toBe(3)

    const again = applyResult(p, result({ score: 1000, accuracy: 0.7, breaches: 2 }))
    expect(again.stars).toBe(1)
    expect(p.levels['1-1']).toEqual({ stars: 3, best: 2000 })
    expect(again.trophies).toHaveLength(0)
  })

  it('does not record a lost level but still rewards effort', () => {
    const p = createProfile('Tom', '🐼', false)
    const r = applyResult(p, result({ won: false, score: 500 }))
    expect(p.levels['1-1']).toBeUndefined()
    expect(r.coins).toBeGreaterThan(0)
    expect(r.xp).toBeGreaterThan(0)
  })

  it('tracks endless records', () => {
    const p = createProfile('Tom', '🐼', true)
    applyResult(p, result({ mode: 'endless', levelId: null, score: 5000, wave: 6, won: false }))
    expect(p.endlessBest).toBe(5000)
    expect(p.endlessBestWave).toBe(6)
    const r = applyResult(
      p,
      result({ mode: 'endless', levelId: null, score: 7000, wave: 4, won: false }),
    )
    expect(r.newBest).toBe(true)
    expect(p.endlessBestWave).toBe(6)
  })

  it('weights often-missed keys', () => {
    const p = createProfile('Tom', '🐼', true)
    applyResult(p, result({ keyStats: { f: { ok: 2, ko: 8 }, j: { ok: 10, ko: 0 } } }))
    expect(keyWeight(p, 'f')).toBeGreaterThan(keyWeight(p, 'j'))
    expect(keyWeight(p, 'z')).toBe(1)
  })
})

describe('unlocks', () => {
  it('opens levels one after the other', () => {
    const p = createProfile('Lina', '🦊', false)
    expect(isLevelUnlocked(p, 'azerty', level('1-1'))).toBe(true)
    expect(isLevelUnlocked(p, 'azerty', level('1-2'))).toBe(false)
    p.levels['1-1'] = { stars: 1, best: 10 }
    expect(isLevelUnlocked(p, 'azerty', level('1-2'))).toBe(true)
    expect(isWorldUnlocked(p, 'azerty', 1)).toBe(false)
    p.levels['1-8'] = { stars: 1, best: 10 }
    expect(isWorldUnlocked(p, 'azerty', 1)).toBe(true)
  })

  it('lets readers jump to word worlds', () => {
    expect(isWorldUnlocked(createProfile('A', '🦊', true), 'azerty', 3)).toBe(true)
    expect(isWorldUnlocked(createProfile('B', '🦊', false), 'azerty', 3)).toBe(false)
  })
})

describe('daily gift', () => {
  it('grows with the streak and resets after a missed day', () => {
    const p = createProfile('Lina', '🦊', false)
    const d1 = new Date(2026, 0, 10, 9)
    const g1 = claimDaily(p, d1)
    expect(g1?.streak).toBe(1)
    expect(dailyAvailable(p, d1)).toBe(false)
    expect(claimDaily(p, d1)).toBeNull()
    const g2 = claimDaily(p, new Date(2026, 0, 11, 20))
    expect(g2?.streak).toBe(2)
    expect((g2?.coins ?? 0) > (g1?.coins ?? 0)).toBe(true)
    expect(claimDaily(p, new Date(2026, 0, 14))?.streak).toBe(1)
  })
})

describe('shop', () => {
  it('buys and equips with enough coins and level', () => {
    const p = createProfile('Lina', '🦊', false)
    const bubble = findShip('bubble')
    expect(buy(p, 'ship', bubble)).toBe('poor')
    p.coins = 100
    expect(buy(p, 'ship', bubble)).toBe('ok')
    expect(p.coins).toBe(40)
    expect(p.ship).toBe('bubble')
    expect(buy(p, 'ship', bubble)).toBe('owned')
    p.coins = 5000
    expect(buy(p, 'ship', findShip('royal'))).toBe('locked')
  })
})
