import { describe, it, expect } from 'vitest'
import {
  loadWordLists,
  getAvailableWords,
  findActiveWord,
  matchWordKey,
} from '@/game/words.js'
import type { WordEntity } from '@/game/words.js'

function createMockWordEntity(
  word: string,
  y: number,
  cursorIndex = 0,
  tween: WordEntity['tween'] = null,
  markedForRemoval = false,
): WordEntity {
  return {
    text: {
      y,
      scale: { set: () => {} },
      tint: 0xffffff,
      alpha: 1,
      x: 100,
      chars: word.split('').map(() => ({ tint: 0xffffff })),
    },
    poolIndex: 0,
    word,
    cursorIndex,
    baseX: 100,
    originalTint: 0xffffff,
    tween,
    markedForRemoval,
  }
}

describe('loadWordLists', () => {
  it('returns French word lists with short and medium arrays', () => {
    const lists = loadWordLists('fr')
    expect(Array.isArray(lists.short)).toBe(true)
    expect(Array.isArray(lists.medium)).toBe(true)
    expect(lists.short.length).toBeGreaterThanOrEqual(20)
    expect(lists.medium.length).toBeGreaterThanOrEqual(15)
    for (const w of lists.short) {
      expect(typeof w).toBe('string')
    }
  })

  it('returns English word lists with short and medium arrays', () => {
    const lists = loadWordLists('en')
    expect(Array.isArray(lists.short)).toBe(true)
    expect(Array.isArray(lists.medium)).toBe(true)
    expect(lists.short.length).toBeGreaterThanOrEqual(20)
  })

  it('defaults to French for unknown locale', () => {
    const lists = loadWordLists('unknown')
    const frLists = loadWordLists('fr')
    expect(lists.short).toEqual(frLists.short)
    expect(lists.medium).toEqual(frLists.medium)
  })
})

describe('getAvailableWords', () => {
  const lists = loadWordLists('fr')

  it('returns only short words when total is 0', () => {
    const result = getAvailableWords(lists, 0, 0)
    expect([...result]).toEqual([...lists.short])
  })

  it('returns only short words when progress/total < 0.4', () => {
    const result = getAvailableWords(lists, 3, 20) // 15%
    expect([...result]).toEqual([...lists.short])
  })

  it('returns short + medium when progress/total >= 0.4', () => {
    const result = getAvailableWords(lists, 10, 20) // 50%
    expect([...result]).toEqual([...lists.short, ...lists.medium])
  })

  it('returns short + medium at exactly 0.4', () => {
    const result = getAvailableWords(lists, 8, 20) // 40%
    expect([...result]).toEqual([...lists.short, ...lists.medium])
  })
})

describe('findActiveWord', () => {
  it('returns null for empty array', () => {
    expect(findActiveWord([])).toBeNull()
  })

  it('returns entity with highest y value (lowest on screen)', () => {
    const entities = [
      createMockWordEntity('cat', 100),
      createMockWordEntity('dog', 300),
      createMockWordEntity('hat', 200),
    ]
    expect(findActiveWord(entities)).toBe(entities[1])
  })

  it('skips entities with active tweens', () => {
    const entities = [
      createMockWordEntity('cat', 300, 0, {
        elapsed: 0,
        duration: 300,
        type: 'hit',
      }),
      createMockWordEntity('dog', 100),
    ]
    expect(findActiveWord(entities)).toBe(entities[1])
  })

  it('skips entities marked for removal', () => {
    const entities = [
      createMockWordEntity('cat', 300, 0, null, true),
      createMockWordEntity('dog', 100),
    ]
    expect(findActiveWord(entities)).toBe(entities[1])
  })

  it('returns null when all entities have tweens', () => {
    const entities = [
      createMockWordEntity('cat', 300, 0, {
        elapsed: 0,
        duration: 300,
        type: 'hit',
      }),
    ]
    expect(findActiveWord(entities)).toBeNull()
  })
})

describe('matchWordKey', () => {
  it('returns correct for matching non-final character', () => {
    const entity = createMockWordEntity('cat', 100, 0)
    expect(matchWordKey(entity, 'c')).toBe('correct')
  })

  it('returns complete for matching final character', () => {
    const entity = createMockWordEntity('cat', 100, 2)
    expect(matchWordKey(entity, 't')).toBe('complete')
  })

  it('returns wrong for non-matching character', () => {
    const entity = createMockWordEntity('cat', 100, 0)
    expect(matchWordKey(entity, 'x')).toBe('wrong')
  })

  it('returns correct for middle character', () => {
    const entity = createMockWordEntity('dog', 100, 1)
    expect(matchWordKey(entity, 'o')).toBe('correct')
  })

  it('returns wrong when key does not match current cursor position', () => {
    const entity = createMockWordEntity('cat', 100, 1)
    expect(matchWordKey(entity, 'c')).toBe('wrong') // 'c' is at index 0, cursor is at 1
  })
})
