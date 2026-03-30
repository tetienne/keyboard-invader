import { describe, it, expect } from 'vitest'
import {
  HOME_ROW,
  TOP_ROW,
  BOTTOM_ROW,
  LETTER_COLORS,
  getAvailableLetters,
  findLowestMatch,
  findLowestEntity,
} from '@/game/letters.js'
import type { LetterEntity } from '@/game/letters.js'

function createMockEntity(
  letter: string,
  y: number,
  tween: LetterEntity['tween'] = null,
  markedForRemoval = false,
): LetterEntity {
  return {
    text: { y } as unknown as LetterEntity['text'],
    poolIndex: 0,
    letter,
    baseX: 100,
    originalTint: 0xffffff,
    tween,
    markedForRemoval,
  }
}

describe('HOME_ROW', () => {
  it('contains exactly the 7 home row keys', () => {
    expect([...HOME_ROW]).toEqual(['a', 's', 'd', 'f', 'j', 'k', 'l'])
  })
})

describe('LETTER_COLORS', () => {
  it('has 8 entries, all are numbers', () => {
    expect(LETTER_COLORS).toHaveLength(8)
    for (const color of LETTER_COLORS) {
      expect(typeof color).toBe('number')
    }
  })
})

describe('getAvailableLetters', () => {
  it('returns only HOME_ROW for 0 progress', () => {
    const result = getAvailableLetters(0, 20)
    expect([...result]).toEqual([...HOME_ROW])
  })

  it('returns HOME_ROW + TOP_ROW at 40% progress', () => {
    const result = getAvailableLetters(8, 20) // 40%
    expect([...result]).toEqual([...HOME_ROW, ...TOP_ROW])
  })

  it('returns all rows at 70% progress', () => {
    const result = getAvailableLetters(14, 20) // 70%
    expect([...result]).toEqual([...HOME_ROW, ...TOP_ROW, ...BOTTOM_ROW])
  })

  it('returns HOME_ROW when total is 0 (edge case)', () => {
    const result = getAvailableLetters(0, 0)
    expect([...result]).toEqual([...HOME_ROW])
  })
})

describe('findLowestMatch', () => {
  it('returns entity with highest y value matching the key', () => {
    const entities = [
      createMockEntity('a', 100),
      createMockEntity('a', 300),
      createMockEntity('a', 200),
    ]
    const result = findLowestMatch(entities, 'a')
    expect(result).toBe(entities[1])
  })

  it('returns null when no entity matches the key', () => {
    const entities = [createMockEntity('b', 100), createMockEntity('c', 200)]
    const result = findLowestMatch(entities, 'a')
    expect(result).toBeNull()
  })

  it('skips entities that have an active tween', () => {
    const entities = [
      createMockEntity('a', 300, { elapsed: 0, duration: 300, type: 'hit' }),
      createMockEntity('a', 100),
    ]
    const result = findLowestMatch(entities, 'a')
    expect(result).toBe(entities[1])
  })

  it('skips entities marked for removal', () => {
    const entities = [
      createMockEntity('a', 300, null, true),
      createMockEntity('a', 100),
    ]
    const result = findLowestMatch(entities, 'a')
    expect(result).toBe(entities[1])
  })
})

describe('findLowestEntity', () => {
  it('returns the entity with highest y regardless of letter', () => {
    const entities = [
      createMockEntity('a', 100),
      createMockEntity('b', 300),
      createMockEntity('c', 200),
    ]
    const result = findLowestEntity(entities)
    expect(result).toBe(entities[1])
  })

  it('returns null for empty array', () => {
    const result = findLowestEntity([])
    expect(result).toBeNull()
  })

  it('skips entities with active tweens', () => {
    const entities = [
      createMockEntity('a', 300, { elapsed: 0, duration: 300, type: 'hit' }),
      createMockEntity('b', 100),
    ]
    const result = findLowestEntity(entities)
    expect(result).toBe(entities[1])
  })
})
